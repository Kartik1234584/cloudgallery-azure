import os
import datetime

from flask import Flask, render_template, request, jsonify, abort
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from azure.storage.blob import BlobServiceClient, ContentSettings


load_dotenv()

app = Flask(__name__)

# ==================================================
# CONFIGURATION
# ==================================================

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE


# ==================================================
# AZURE BLOB STORAGE
# ==================================================

AZURE_CONNECTION_STRING = os.getenv(
    "AZURE_STORAGE_CONNECTION_STRING"
)

AZURE_CONTAINER = os.getenv(
    "AZURE_STORAGE_CONTAINER",
    "images"
)

if not AZURE_CONNECTION_STRING:
    raise RuntimeError(
        "AZURE_STORAGE_CONNECTION_STRING is missing from .env"
    )

blob_service_client = BlobServiceClient.from_connection_string(
    AZURE_CONNECTION_STRING
)

container_client = blob_service_client.get_container_client(
    AZURE_CONTAINER
)


# ==================================================
# HELPER FUNCTIONS
# ==================================================

def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


def format_file_size(size_in_bytes):

    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"

    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes / 1024:.1f} KB"

    else:
        return f"{size_in_bytes / (1024 * 1024):.1f} MB"


def get_file_type(filename):

    ext = (
        filename.rsplit(".", 1)[1].lower()
        if "." in filename
        else "unknown"
    )

    return ext.upper()


# ==================================================
# LIST AZURE IMAGES
# ==================================================

def list_storage_images():

    images = []

    blobs = container_client.list_blobs()

    for blob in blobs:

        filename = blob.name

        if not allowed_file(filename):
            continue

        size = blob.size or 0

        modified = blob.last_modified

        if modified:
            modified = modified.replace(tzinfo=None)
        else:
            modified = datetime.datetime.now()

        images.append({

            "filename": filename,

            "size_bytes": size,

            "size_formatted": format_file_size(size),

            "type": get_file_type(filename),

            "extension": filename.rsplit(".", 1)[1].lower(),

            "upload_date": modified.strftime(
                "%Y-%m-%d %H:%M:%S"
            ),

            "iso_date": modified.isoformat(),

            "url": f"/uploads/{filename}",

            "download_url": f"/api/download/{filename}"

        })

    images.sort(
        key=lambda x: x["iso_date"],
        reverse=True
    )

    return images


# ==================================================
# HOME
# ==================================================

@app.route("/")
def index():

    return render_template("index.html")


# ==================================================
# GET IMAGES
# ==================================================

@app.route("/api/images", methods=["GET"])
def get_images():

    try:

        images = list_storage_images()

        return jsonify({

            "success": True,

            "count": len(images),

            "images": images

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ==================================================
# STATS
# ==================================================

@app.route("/api/stats", methods=["GET"])
def get_stats():

    try:

        images = list_storage_images()

        total_size = sum(
            img["size_bytes"]
            for img in images
        )

        now = datetime.datetime.now()

        recent_threshold = (
            now - datetime.timedelta(hours=24)
        )

        recent_count = 0

        for img in images:

            img_date = datetime.datetime.fromisoformat(
                img["iso_date"]
            )

            if img_date >= recent_threshold:
                recent_count += 1

        return jsonify({

            "success": True,

            "total_images": len(images),

            "total_storage_bytes": total_size,

            "total_storage_formatted":
                format_file_size(total_size),

            "recent_uploads": recent_count,

            "storage_mode":
                "Azure Blob Storage",

            "azure_status":
                "Connected"

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ==================================================
# UPLOAD IMAGE TO AZURE
# ==================================================

@app.route("/api/upload", methods=["POST"])
def upload_file():

    if (
        "images" not in request.files
        and "image" not in request.files
    ):

        return jsonify({

            "success": False,

            "error": "No file uploaded"

        }), 400


    uploaded_files = (
        request.files.getlist("images")
        or request.files.getlist("image")
    )


    saved_files = []

    errors = []


    for file in uploaded_files:

        if file.filename == "":
            continue


        if not allowed_file(file.filename):

            errors.append(
                f"'{file.filename}' has an unsupported "
                "file format."
            )

            continue


        filename = secure_filename(file.filename)


        # Prevent overwriting
        base_name, extension = os.path.splitext(
            filename
        )

        counter = 1

        target_filename = filename


        existing_blobs = {
            blob.name
            for blob in container_client.list_blobs()
        }


        while target_filename in existing_blobs:

            target_filename = (
                f"{base_name}_{counter}{extension}"
            )

            counter += 1


        try:

            blob_client = container_client.get_blob_client(
                target_filename
            )


            blob_client.upload_blob(

                file,

                overwrite=False,

                content_settings=ContentSettings(

                    content_type=file.content_type

                )

            )


            saved_files.append({

                "filename": target_filename,

                "message": "Uploaded to Azure Blob Storage"

            })


        except Exception as e:

            errors.append(
                f"Failed to upload '{file.filename}': {str(e)}"
            )


    if not saved_files and errors:

        return jsonify({

            "success": False,

            "error": "; ".join(errors)

        }), 400


    return jsonify({

        "success": True,

        "message":
            f"Successfully uploaded "
            f"{len(saved_files)} file(s) to Azure.",

        "files": saved_files,

        "warnings": errors if errors else None

    })


# ==================================================
# SERVE IMAGE FROM AZURE
# ==================================================

@app.route("/uploads/<path:filename>")
def serve_upload(filename):

    try:

        blob_client = container_client.get_blob_client(
            filename
        )

        data = blob_client.download_blob().readall()

        from flask import Response

        properties = blob_client.get_blob_properties()

        return Response(

            data,

            mimetype=properties.content_settings.content_type
            or "application/octet-stream"

        )

    except Exception:

        abort(
            404,
            description="Image file not found"
        )


# ==================================================
# DOWNLOAD IMAGE
# ==================================================

@app.route("/api/download/<path:filename>")
def download_file(filename):

    try:

        blob_client = container_client.get_blob_client(
            filename
        )

        data = blob_client.download_blob().readall()

        from flask import Response

        response = Response(

            data,

            mimetype="application/octet-stream"

        )

        response.headers[
            "Content-Disposition"
        ] = f'attachment; filename="{os.path.basename(filename)}"'

        return response

    except Exception:

        abort(
            404,
            description="Image file not found"
        )


# ==================================================
# DELETE IMAGE
# ==================================================

@app.route(
    "/api/delete/<path:filename>",
    methods=["DELETE"]
)
def delete_file(filename):

    try:

        blob_client = container_client.get_blob_client(
            filename
        )

        blob_client.delete_blob()

        return jsonify({

            "success": True,

            "message":
                f"Image '{filename}' deleted successfully."

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ==================================================
# FILE TOO LARGE
# ==================================================

@app.errorhandler(413)
def request_entity_too_large(error):

    return jsonify({

        "success": False,

        "error":
            "File size exceeds maximum allowed limit of 10 MB."

    }), 413


# ==================================================
# RUN
# ==================================================

if __name__ == "__main__":

    print("=" * 60)

    print(" CloudGallery — Azure Blob Storage")

    print(f" Container: {AZURE_CONTAINER}")

    print(" Storage: Azure Blob Storage")

    print(" URL: http://127.0.0.1:5000")

    print("=" * 60)

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )