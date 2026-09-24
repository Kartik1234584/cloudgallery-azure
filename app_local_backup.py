import os
import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory, abort
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit per file

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Helper functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def format_file_size(size_in_bytes):
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes / 1024:.1f} KB"
    else:
        return f"{size_in_bytes / (1024 * 1024):.1f} MB"

def get_file_type(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'unknown'
    return ext.upper()

# ==================================================
# FUTURE AZURE BLOB STORAGE INTEGRATION
# ==================================================
# This application is designed to easily switch from Local File System storage
# to Azure Blob Storage without modifying frontend code.
#
# To connect Azure Blob Storage later:
# 1. Install azure-storage-blob:
#    pip install azure-storage-blob
#
# 2. Retrieve Connection String from environment variable (DO NOT hardcode secrets):
#    import os
#    from azure.storage.blob import BlobServiceClient
#    connect_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
#    blob_service_client = BlobServiceClient.from_connection_string(connect_str)
#    container_client = blob_service_client.get_container_client('cloudgallery')
#
# 3. Replace the functions below (list_storage_images, save_to_storage, delete_from_storage)
#    with equivalent Azure Blob Container client operations.
# ==================================================

def list_storage_images():
    """Reads image metadata from local storage directory (Replaceable with Azure Blob listing)."""
    images = []
    if not os.path.exists(UPLOAD_FOLDER):
        return images

    for filename in os.listdir(UPLOAD_FOLDER):
        if filename.startswith('.') or not allowed_file(filename):
            continue
        
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            stat = os.stat(file_path)
            mod_time = datetime.datetime.fromtimestamp(stat.st_mtime)
            
            images.append({
                'filename': filename,
                'size_bytes': stat.st_size,
                'size_formatted': format_file_size(stat.st_size),
                'type': get_file_type(filename),
                'extension': filename.rsplit('.', 1)[1].lower(),
                'upload_date': mod_time.strftime('%Y-%m-%d %H:%M:%S'),
                'iso_date': mod_time.isoformat(),
                'url': f'/uploads/{filename}',
                'download_url': f'/api/download/{filename}'
            })

    # Sort newest first by default
    images.sort(key=lambda x: x['iso_date'], reverse=True)
    return images

# Routes
@app.route('/')
def index():
    """Renders the main single-page application interface."""
    return render_template('index.html')

@app.route('/api/images', methods=['GET'])
def get_images():
    """API endpoint to get list of all stored images."""
    try:
        images = list_storage_images()
        return jsonify({
            'success': True,
            'count': len(images),
            'images': images
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """API endpoint for dashboard summary statistics."""
    try:
        images = list_storage_images()
        total_size = sum(img['size_bytes'] for img in images)
        
        now = datetime.datetime.now()
        recent_threshold = now - datetime.timedelta(hours=24)
        
        recent_count = 0
        for img in images:
            img_date = datetime.datetime.fromisoformat(img['iso_date'])
            if img_date >= recent_threshold:
                recent_count += 1

        return jsonify({
            'success': True,
            'total_images': len(images),
            'total_storage_bytes': total_size,
            'total_storage_formatted': format_file_size(total_size),
            'recent_uploads': recent_count,
            'storage_mode': 'Local Demo Mode',
            'azure_status': 'Not Connected (Ready for Azure Blob Storage)'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """API endpoint to handle image uploads."""
    if 'images' not in request.files and 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    uploaded_files = request.files.getlist('images') or request.files.getlist('image')
    saved_files = []
    errors = []

    for file in uploaded_files:
        if file.filename == '':
            continue

        if not allowed_file(file.filename):
            errors.append(f"'{file.filename}' has an unsupported file format. Allowed: JPG, JPEG, PNG, GIF, WEBP.")
            continue

        filename = secure_filename(file.filename)
        # Avoid overwriting files by prepending timestamp if needed
        base_name, extension = os.path.splitext(filename)
        counter = 1
        target_filename = filename
        
        while os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], target_filename)):
            target_filename = f"{base_name}_{counter}{extension}"
            counter += 1

        file_path = os.path.join(app.config['UPLOAD_FOLDER'], target_filename)
        
        try:
            file.save(file_path)
            stat = os.stat(file_path)
            mod_time = datetime.datetime.fromtimestamp(stat.st_mtime)

            saved_files.append({
                'filename': target_filename,
                'size_bytes': stat.st_size,
                'size_formatted': format_file_size(stat.st_size),
                'type': get_file_type(target_filename),
                'extension': target_filename.rsplit('.', 1)[1].lower(),
                'upload_date': mod_time.strftime('%Y-%m-%d %H:%M:%S'),
                'iso_date': mod_time.isoformat(),
                'url': f'/uploads/{target_filename}',
                'download_url': f'/api/download/{target_filename}'
            })
        except Exception as e:
            errors.append(f"Failed to save '{file.filename}': {str(e)}")

    if not saved_files and errors:
        return jsonify({'success': False, 'error': '; '.join(errors)}), 400

    return jsonify({
        'success': True,
        'message': f"Successfully uploaded {len(saved_files)} file(s).",
        'files': saved_files,
        'warnings': errors if errors else None
    })

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    """Serves raw image files from local uploads folder."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/download/<path:filename>')
def download_file(filename):
    """Triggers direct browser download attachment for specified image."""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
    except Exception:
        abort(404, description="Image file not found")

@app.route('/api/delete/<path:filename>', methods=['DELETE'])
def delete_file(filename):
    """Deletes an image from local storage."""
    safe_name = secure_filename(filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_name)

    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({
                'success': True,
                'message': f"Image '{safe_name}' deleted successfully."
            })
        except Exception as e:
            return jsonify({'success': False, 'error': f"Could not delete file: {str(e)}"}), 500
    else:
        return jsonify({'success': False, 'error': 'Image file not found'}), 404

# Handle 413 File Too Large Error
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'success': False,
        'error': 'File size exceeds maximum allowed limit of 10 MB.'
    }), 413

if __name__ == '__main__':
    print("=" * 60)
    print(" CloudGallery Web Application — Running in Local Demo Mode")
    print(" Azure Blob Storage ready for future integration.")
    print(" URL: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(debug=True, host='127.0.0.1', port=5000)
