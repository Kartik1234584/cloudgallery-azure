# CloudGallery — Azure Image Storage

A modern, responsive, cloud-ready image management web application built with **Python 3**, **Flask**, **HTML5**, **CSS3**, and **Vanilla JavaScript**.

Currently running in **Local Demo Mode** (storing images locally in `uploads/`), this application is engineered with a modular backend architecture specifically prepared for future integration with **Microsoft Azure Blob Storage**.

---

## 🌟 Features

- 📊 **Dashboard Overview**: Summary stat cards displaying Total Images, Total Storage Used, Recent Uploads, and Storage Mode Status.
- 📤 **Drag & Drop Image Upload**: Interactive file picker supporting multiple file selection, live pre-upload thumbnails, file size & format validation, queue management, and upload progress bars.
- 🖼️ **Image Gallery**: Responsive grid and list views for desktop, laptop, tablet, and mobile displays.
- 🔍 **Real-Time Search**: Instant filename searching as you type.
- 🎯 **Multi-Criteria Filtering**: Filter images by file format (`JPG/JPEG`, `PNG`, `WEBP`, `GIF`, or `All`).
- 🔄 **Dynamic Sorting**: Sort images by *Newest First*, *Oldest First*, *Name A-Z*, *Name Z-A*, *Largest File*, and *Smallest File*.
- 🔍 **Lightbox Modal**: Fullscreen high-resolution image preview with full metadata sidebar (filename, file size, file format, upload timestamp).
- ⬇️ **Direct Image Download**: Single-click attachment download for any stored image.
- 🗑️ **Safe File Deletion**: Instant deletion with confirmation dialog modal and dynamic dashboard statistic updates.
- 🌙 **Dark & Light Mode**: Seamless UI color theme toggle with `localStorage` persistence.
- 🔔 **Toast Notification Engine**: Non-intrusive interactive alerts for success, warnings, error validation, and file actions.
- 🔒 **Security Best Practices**: File format whitelisting, 10MB per-file size enforcement, and safe file name handling using `secure_filename`.

---

## 🛠️ Technology Stack

- **Backend**: Python 3, Flask, Werkzeug
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design Tokens), Vanilla JavaScript (ES6+)
- **Storage**: Local Demo Mode (`uploads/`) — *Azure Blob Storage Ready*
- **No Heavy Frameworks**: No React, Vue, Angular, Tailwind, Docker, or external databases required.

---

## 📂 Project Structure

```
CLOUDGALLERY/
│
├── app.py                      # Core Flask backend with REST API routes & storage abstraction
├── requirements.txt            # Python dependencies (Flask, Werkzeug)
├── README.md                   # Project documentation & Azure integration guide
├── .gitignore                  # Git ignore rules for venv, uploads, and pycache
│
├── templates/
│   └── index.html              # Main Single-Page Application (SPA) HTML layout
│
├── static/
│   ├── css/
│   │   └── style.css           # Custom Design System, Light/Dark themes, CSS Grid/Flex
│   └── js/
│       └── app.js              # Vanilla JS application state, upload queue, toast notifications
│
└── uploads/
    └── .gitkeep                # Local image storage folder for development/testing
```

---

## 🚀 How to Run Locally

### 1. Prerequisites
Ensure you have Python 3.8+ installed on your system.

### 2. Create Virtual Environment & Activate

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Start the Application
```bash
python app.py
```

### 5. Access in Web Browser
Open your web browser and navigate to:
```
http://127.0.0.1:5000
```

---

## ☁️ Future Azure Blob Storage Integration

> [!NOTE]
> Azure Blob Storage integration will be added in a future step. Real Azure resources, connection strings, or credentials are **NOT** required to run the local demo application.

### How to Connect Azure Blob Storage Later:

1. **Install Azure Storage Blob SDK**:
   ```bash
   pip install azure-storage-blob
   ```

2. **Configure Environment Variables**:
   Set your Azure Storage Account Connection String as an environment variable (never hardcode secrets into code):
   ```cmd
   set AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=your_account;AccountKey=your_key;EndpointSuffix=core.windows.net"
   ```

3. **Update `app.py` Storage Functions**:
   In `app.py`, locate the `# FUTURE AZURE BLOB STORAGE INTEGRATION` section and update the file handling methods:

   ```python
   from azure.storage.blob import BlobServiceClient

   connect_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
   blob_service_client = BlobServiceClient.from_connection_string(connect_str)
   container_client = blob_service_client.get_container_client("cloudgallery-container")

   # Replace list_storage_images() with container_client.list_blobs()
   # Replace save_to_storage() with container_client.upload_blob()
   # Replace delete_from_storage() with container_client.delete_blob()
   ```

Because the frontend relies strictly on standard JSON REST API contracts (`/api/images`, `/api/upload`, `/api/delete/<filename>`), swapping local storage for Azure Blob Storage in `app.py` requires **zero changes** to the frontend code!
