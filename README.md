# ☁️ CloudGallery – Azure Image Storage & Management

CloudGallery is a cloud-based image management web application built with **Python Flask** and **Microsoft Azure Blob Storage**. It allows users to upload, view, download, and delete images through a web interface while storing the images in an Azure Blob Storage container.

## 📌 Project Overview

The project demonstrates hands-on experience with:

- Microsoft Azure Storage Account
- Azure Blob Storage
- Azure Blob Containers
- Python Flask
- REST API endpoints
- Image upload and management
- Environment-based configuration
- Git and GitHub
- Secure cloud credential handling

### Architecture

```
User
  ↓
CloudGallery Web Interface
  ↓
Python Flask Application
  ↓
Azure Blob Storage SDK
  ↓
Azure Storage Account
  ↓
images Blob Container
```

## ✨ Features

- 📤 Upload images
- 🖼️ View images in a gallery
- ☁️ Store images in Azure Blob Storage
- ⬇️ Download images
- 🗑️ Delete images
- 🔎 Search images by filename
- 🏷️ Filter images by format
- 📊 Dashboard statistics
- 📅 Upload information
- 📦 File-size information
- 🔐 Environment-based Azure configuration
- 🛡️ Image-format validation
- 📏 10 MB maximum file size
- 🔄 Duplicate filename handling

## 🛠️ Technologies Used

### Cloud

- Microsoft Azure
- Azure Storage Account
- Azure Blob Storage
- Azure Blob Container

### Backend

- Python
- Flask
- Azure Storage Blob SDK
- python-dotenv
- Werkzeug

### Frontend

- HTML5
- CSS3
- JavaScript

### Tools

- Visual Studio Code
- Git
- GitHub
- Python Virtual Environment

## 📂 Project Structure

```
CLOUDGALLERY/
│
├── static/
├── templates/
├── uploads/
├── app.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## ☁️ Azure Storage Configuration

CloudGallery uses an Azure Storage Account containing an `images` Blob container.

```
Storage Account
      ↓
Blob Storage
      ↓
images
      ├── image1.png
      ├── image2.jpg
      └── image3.webp
```

### Environment Variables

Create a local `.env` file:

```
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_CONTAINER=images
```

**Never commit the real `.env` file or Azure credentials to GitHub.**

The repository contains `.env.example`:

```
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string_here
AZURE_STORAGE_CONTAINER=images
```

## 🔐 Security

Azure credentials are stored through environment variables rather than hardcoded in application source code.

The `.env` file should remain in `.gitignore`:

```
.env
```

Never publish:

- Azure Storage connection strings
- Azure access keys
- API keys
- Passwords
- Other cloud credentials

## 🚀 Getting Started

### 1. Clone the repository

```
git clone https://github.com/Kartik1234584/cloudgallery-azure.git
cd cloudgallery-azure
```

### 2. Create a virtual environment

Windows:

```
python -m venv venv
```

Activate:

```
venv\Scripts\Activate.ps1
```

If required:

```
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

### 3. Install dependencies

```
pip install -r requirements.txt
```

### 4. Configure `.env`

Create `.env` in the project root:

```
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_CONTAINER=images
```

Use your own Azure Storage connection string.

## 🪣 Azure Blob Storage Setup

To recreate the cloud environment:

1. Open Azure Portal.
2. Create a Storage Account.
3. Create a Blob container named `images`.
4. Obtain the Storage Account connection string.
5. Add it to your local `.env`.
6. Run the Flask application.

Recommended learning configuration:

```
Performance: Standard
Replication: LRS
Account Kind: StorageV2
```

## ▶️ Run the Application

```
python app.py
```

Open:

```
http://127.0.0.1:5000
```

## 📤 Image Upload Workflow

```
Select Image
     ↓
CloudGallery Upload Interface
     ↓
Flask Upload API
     ↓
Validate File
     ↓
Azure Blob Storage
     ↓
images Container
```

Supported formats:

```
JPG
JPEG
PNG
GIF
WEBP
```

Maximum file size:

```
10 MB per file
```

## 🔌 API Endpoints

### Get Images

```
GET /api/images
```

Returns stored image information.

### Get Statistics

```
GET /api/stats
```

Returns dashboard statistics such as image count, storage size, recent uploads, and storage status.

### Upload Images

```
POST /api/upload
```

Uploads image files.

### Download Image

```
GET /api/download/<filename>
```

Downloads an image.

### Delete Image

```
DELETE /api/delete/<filename>
```

Deletes an image.

## 🖥️ Application Pages

### Dashboard

Displays image count, storage usage, recent uploads, and storage status.

### Gallery

Displays stored images with search, format filters, preview, download, and delete options.

### Upload Images

Provides the image upload interface.

### Settings

Provides application-related settings.

## 🧪 Hands-On Testing

The project was tested hands-on with Azure Blob Storage, including:

- Creating an Azure Storage Account
- Creating the `images` Blob container
- Connecting Flask to Azure Blob Storage
- Uploading images through the website
- Verifying images inside Azure Blob Storage
- Displaying Azure-stored images in the Gallery
- Testing multiple image uploads
- Downloading images
- Deleting images
- Verifying Azure connection status
- Testing supported image formats
- Testing the file-size limit
- Testing duplicate filename handling

## 📸 Recommended Screenshots

For project documentation, include:

1. CloudGallery Dashboard
2. CloudGallery Gallery with uploaded images
3. Azure Storage Account
4. Azure `images` container
5. Uploaded images visible inside the Azure container
6. Azure-connected status in CloudGallery

## 💰 Azure Cost Management

This project was created as a learning and portfolio project with a focus on minimizing Azure usage.

For temporary testing environments:

- Use suitable low-cost/free options where available.
- Monitor Azure usage and cost.
- Delete unused Azure resources after testing.
- Do not leave unnecessary cloud resources running.

## 🔒 Credential Safety Checklist

Before pushing to GitHub:

```
[✓] .env is in .gitignore
[✓] .env is NOT committed
[✓] .env.example contains placeholders only
[✓] No Azure key is hardcoded in app.py
[✓] No connection string is published in README.md
[✓] No credentials are stored in frontend files
```

## 🎯 Learning Outcomes

This project provided hands-on experience with:

- Microsoft Azure
- Azure Blob Storage
- Azure Storage Accounts
- Cloud object storage
- Blob containers
- Azure Storage authentication
- Python Flask
- REST APIs
- File upload processing
- Cloud-based file management
- Environment variables
- Cloud credential management
- Git and GitHub
- Azure resource management

## 💼 Resume Description

**CloudGallery – Azure Image Storage & Management**

> Developed a cloud-based image management application using Python Flask and Microsoft Azure Blob Storage, enabling users to upload, view, download, and delete images through a web interface. Integrated Azure Blob Storage using environment-based credentials and implemented cloud-backed image management.

### Technologies

```
Python | Flask | Microsoft Azure | Azure Blob Storage |
HTML | CSS | JavaScript | Git | GitHub
```

## 👨‍💻 Author

**Kartik Sadhu**

MCA – Cloud Computing

## 📄 License

This project is intended for educational, learning, and portfolio purposes.