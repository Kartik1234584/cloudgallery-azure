/**
 * CLOUDGALLERY — AZURE IMAGE STORAGE
 * Main Frontend Application Script
 */

document.addEventListener('DOMContentLoaded', () => {

  // Global State
  const state = {
    images: [],
    stats: {},
    selectedFilesQueue: [],
    currentFilter: 'all',
    currentSort: 'newest',
    currentSearch: '',
    viewLayout: localStorage.getItem('cloudgallery_layout') || 'grid',
    activeTab: 'dashboard',
    modalImage: null,
    deleteTargetFilename: null
  };

  // DOM Element References
  const sidebar = document.getElementById('sidebar');
  const mobileToggle = document.getElementById('mobile-toggle');
  const pageTitleText = document.getElementById('page-title-text');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const settingsThemeToggle = document.getElementById('settings-theme-toggle');
  const settingsViewSelect = document.getElementById('settings-view-select');

  // Stats DOM Elements
  const statTotalImages = document.getElementById('stat-total-images');
  const statStorageUsed = document.getElementById('stat-storage-used');
  const statRecentUploads = document.getElementById('stat-recent-uploads');
  const statStorageStatus = document.getElementById('stat-storage-status');

  // Gallery DOM Elements
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const btnGridView = document.getElementById('btn-grid-view');
  const btnListView = document.getElementById('btn-list-view');
  const filterPills = document.querySelectorAll('.filter-pill');
  const mainGalleryGrid = document.getElementById('main-gallery-grid');
  const dashboardRecentGrid = document.getElementById('dashboard-recent-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyUploadBtn = document.getElementById('empty-upload-btn');
  const bannerUploadBtn = document.getElementById('banner-upload-btn');
  const dashViewAllLink = document.getElementById('dash-view-all');

  // Upload DOM Elements
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const queueWrapper = document.getElementById('queue-wrapper');
  const queueList = document.getElementById('queue-list');
  const queueCount = document.getElementById('queue-count');
  const startUploadBtn = document.getElementById('start-upload-btn');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');

  // Lightbox Modal DOM Elements
  const lightboxModal = document.getElementById('lightbox-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalFilename = document.getElementById('modal-filename');
  const modalImgElement = document.getElementById('modal-img-element');
  const modalMetaFilename = document.getElementById('modal-meta-filename');
  const modalMetaType = document.getElementById('modal-meta-type');
  const modalMetaSize = document.getElementById('modal-meta-size');
  const modalMetaDate = document.getElementById('modal-meta-date');
  const modalDownloadBtn = document.getElementById('modal-download-btn');
  const modalDeleteBtn = document.getElementById('modal-delete-btn');

  // Delete Confirmation Modal DOM Elements
  const deleteModal = document.getElementById('delete-modal');
  const deleteTargetName = document.getElementById('delete-target-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const confirmDeleteCancel = document.getElementById('confirm-delete-cancel');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  /* ==========================================================================
     INIT & SETUP
     ========================================================================== */

  function init() {
    initTheme();
    initNavigation();
    initGalleryControls();
    initUploadEngine();
    initModals();
    
    // Load initial data
    refreshData();
  }

  /* ==========================================================================
     THEME MANAGEMENT
     ========================================================================== */

  function initTheme() {
    const savedTheme = localStorage.getItem('cloudgallery_theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      showToast(`Switched to ${nextTheme.toUpperCase()} theme mode`, 'info');
    });

    if (settingsThemeToggle) {
      settingsThemeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        showToast(`Switched to ${nextTheme.toUpperCase()} theme mode`, 'info');
      });
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cloudgallery_theme', theme);
  }

  /* ==========================================================================
     NAVIGATION & SPA ROUTING
     ========================================================================== */

  function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Mobile nav hamburger toggle
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });

    // Banner & CTA nav shortcuts
    if (bannerUploadBtn) bannerUploadBtn.addEventListener('click', () => switchTab('upload'));
    if (emptyUploadBtn) emptyUploadBtn.addEventListener('click', () => switchTab('upload'));
    if (dashViewAllLink) dashViewAllLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('gallery');
    });
  }

  function switchTab(tabId) {
    state.activeTab = tabId;

    // Update Sidebar Navigation UI
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Views
    document.querySelectorAll('.tab-view').forEach(view => {
      if (view.id === `${tabId}-view`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update Page Header Title
    const titleMap = {
      'dashboard': 'Dashboard',
      'gallery': 'Image Gallery',
      'upload': 'Upload Images',
      'settings': 'Settings'
    };
    pageTitleText.textContent = titleMap[tabId] || 'Dashboard';

    // Close mobile sidebar after navigation
    sidebar.classList.remove('mobile-open');
  }

  /* ==========================================================================
     API DATA FETCHING & STATE REFRESH
     ========================================================================== */

  async function refreshData() {
    await fetchStats();
    await fetchImages();
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        state.stats = data;
        renderStatsUI(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  function renderStatsUI(stats) {
    if (statTotalImages) statTotalImages.textContent = stats.total_images || 0;
    if (statStorageUsed) statStorageUsed.textContent = stats.total_storage_formatted || '0 B';
    if (statRecentUploads) statRecentUploads.textContent = stats.recent_uploads || 0;
    if (statStorageStatus) statStorageStatus.textContent = stats.storage_mode || 'Local Demo';
  }

  async function fetchImages() {
    try {
      const response = await fetch('/api/images');
      const data = await response.json();
      if (data.success) {
        state.images = data.images;
        renderDashboardRecent();
        renderGallery();
      }
    } catch (err) {
      console.error('Failed to load images:', err);
      showToast('Error loading images from backend API', 'error');
    }
  }

  /* ==========================================================================
     GALLERY RENDERING & CONTROLS
     ========================================================================== */

  function initGalleryControls() {
    // Search input handler
    searchInput.addEventListener('input', (e) => {
      state.currentSearch = e.target.value.toLowerCase().trim();
      renderGallery();
    });

    // Filter pill click handlers
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentFilter = pill.getAttribute('data-filter');
        renderGallery();
      });
    });

    // Sorting dropdown handler
    sortSelect.addEventListener('change', (e) => {
      state.currentSort = e.target.value;
      renderGallery();
    });

    // View layout toggles (Grid vs List)
    btnGridView.addEventListener('click', () => setViewLayout('grid'));
    btnListView.addEventListener('click', () => setViewLayout('list'));

    if (settingsViewSelect) {
      settingsViewSelect.value = state.viewLayout;
      settingsViewSelect.addEventListener('change', (e) => {
        setViewLayout(e.target.value);
      });
    }

    setViewLayout(state.viewLayout);
  }

  function setViewLayout(layout) {
    state.viewLayout = layout;
    localStorage.setItem('cloudgallery_layout', layout);

    if (layout === 'grid') {
      btnGridView.classList.add('active');
      btnListView.classList.remove('active');
      mainGalleryGrid.classList.remove('list-view');
    } else {
      btnListView.classList.add('active');
      btnGridView.classList.remove('active');
      mainGalleryGrid.classList.add('list-view');
    }

    if (settingsViewSelect) settingsViewSelect.value = layout;
  }

  function getProcessedImages() {
    let list = [...state.images];

    // 1. Search Filter
    if (state.currentSearch) {
      list = list.filter(img => img.filename.toLowerCase().includes(state.currentSearch));
    }

    // 2. Format Category Filter
    if (state.currentFilter !== 'all') {
      list = list.filter(img => {
        const ext = img.extension.toLowerCase();
        if (state.currentFilter === 'jpg') return ext === 'jpg' || ext === 'jpeg';
        return ext === state.currentFilter;
      });
    }

    // 3. Sorting
    switch (state.currentSort) {
      case 'newest':
        list.sort((a, b) => new Date(b.iso_date) - new Date(a.iso_date));
        break;
      case 'oldest':
        list.sort((a, b) => new Date(a.iso_date) - new Date(b.iso_date));
        break;
      case 'name-asc':
        list.sort((a, b) => a.filename.localeCompare(b.filename));
        break;
      case 'name-desc':
        list.sort((a, b) => b.filename.localeCompare(a.filename));
        break;
      case 'size-desc':
        list.sort((a, b) => b.size_bytes - a.size_bytes);
        break;
      case 'size-asc':
        list.sort((a, b) => a.size_bytes - b.size_bytes);
        break;
    }

    return list;
  }

  function renderGallery() {
    const imagesToDisplay = getProcessedImages();

    mainGalleryGrid.innerHTML = '';

    if (imagesToDisplay.length === 0) {
      emptyState.style.display = 'block';
      return;
    } else {
      emptyState.style.display = 'none';
    }

    imagesToDisplay.forEach(img => {
      const card = createGalleryCard(img);
      mainGalleryGrid.appendChild(card);
    });
  }

  function renderDashboardRecent() {
    dashboardRecentGrid.innerHTML = '';
    const recentList = state.images.slice(0, 4);

    if (recentList.length === 0) {
      dashboardRecentGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No images uploaded yet.
        </div>
      `;
      return;
    }

    recentList.forEach(img => {
      const card = createGalleryCard(img);
      dashboardRecentGrid.appendChild(card);
    });
  }

  function createGalleryCard(img) {
    const card = document.createElement('div');
    card.className = 'image-card';

    card.innerHTML = `
      <div class="card-thumb-wrap" data-filename="${img.filename}">
        <img src="${img.url}" alt="${img.filename}" class="card-thumb" loading="lazy">
        <span class="type-badge">${img.type}</span>
      </div>
      <div class="card-body">
        <div class="card-filename" title="${img.filename}">${img.filename}</div>
        <div class="card-meta">
          <span>${img.size_formatted}</span>
          <span>${img.upload_date.split(' ')[0]}</span>
        </div>
        <div class="card-actions">
          <div class="card-btn-group">
            <button class="icon-btn view-btn-action" title="View Image Modal" aria-label="View Image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <a href="${img.download_url}" class="icon-btn" title="Download Image" aria-label="Download Image" download>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </a>
          </div>
          <button class="icon-btn delete delete-btn-action" title="Delete Image" aria-label="Delete Image">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // View Modal Click Listeners
    card.querySelector('.card-thumb-wrap').addEventListener('click', () => openLightbox(img));
    card.querySelector('.view-btn-action').addEventListener('click', () => openLightbox(img));

    // Delete Click Listener
    card.querySelector('.delete-btn-action').addEventListener('click', () => openDeleteConfirm(img.filename));

    return card;
  }

  /* ==========================================================================
     IMAGE UPLOAD ENGINE (DRAG & DROP + PREVIEW QUEUE)
     ========================================================================== */

  function initUploadEngine() {
    // Browse button triggers file input
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      handleFilesSelected(Array.from(e.target.files));
      fileInput.value = ''; // Reset input
    });

    // Drag & Drop handlers
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFilesSelected(droppedFiles);
    });

    // Batch upload action button
    startUploadBtn.addEventListener('click', executeBatchUpload);
  }

  function handleFilesSelected(files) {
    const validFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

    let addedCount = 0;

    files.forEach(file => {
      // Validate File Format
      if (!validFormats.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        showToast(`Invalid file format: ${file.name}. Allowed: JPG, PNG, WEBP, GIF`, 'warning');
        return;
      }

      // Validate File Size
      if (file.size > maxSizeBytes) {
        showToast(`File too large: ${file.name} (exceeds 10 MB limit)`, 'error');
        return;
      }

      // Avoid duplicate queue entries
      if (!state.selectedFilesQueue.some(f => f.name === file.name && f.size === file.size)) {
        state.selectedFilesQueue.push(file);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      renderUploadQueue();
      showToast(`Added ${addedCount} file(s) to upload queue`, 'info');
    }
  }

  function renderUploadQueue() {
    if (state.selectedFilesQueue.length === 0) {
      queueWrapper.style.display = 'none';
      return;
    }

    queueWrapper.style.display = 'block';
    queueCount.textContent = state.selectedFilesQueue.length;
    queueList.innerHTML = '';

    state.selectedFilesQueue.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'queue-item';

      const thumbUrl = URL.createObjectURL(file);

      item.innerHTML = `
        <div class="queue-item-info">
          <img src="${thumbUrl}" class="queue-thumb" alt="Preview">
          <div class="queue-details">
            <div class="queue-name">${file.name}</div>
            <div class="queue-size">${formatBytes(file.size)} • ${file.type.split('/')[1]?.toUpperCase() || 'IMG'}</div>
          </div>
        </div>
        <button class="icon-btn delete remove-queue-btn" title="Remove from queue" data-index="${index}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      item.querySelector('.remove-queue-btn').addEventListener('click', () => {
        state.selectedFilesQueue.splice(index, 1);
        renderUploadQueue();
      });

      queueList.appendChild(item);
    });
  }

  async function executeBatchUpload() {
    if (state.selectedFilesQueue.length === 0) return;

    const formData = new FormData();
    state.selectedFilesQueue.forEach(file => {
      formData.append('images', file);
    });

    // UI Progress State
    startUploadBtn.disabled = true;
    startUploadBtn.textContent = 'Uploading...';
    progressContainer.style.display = 'block';
    progressBar.style.width = '30%';

    try {
      progressBar.style.width = '70%';
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      progressBar.style.width = '100%';

      if (data.success) {
        showToast(data.message, 'success');
        state.selectedFilesQueue = [];
        renderUploadQueue();

        // Refresh stats & gallery list
        await refreshData();
        
        // Auto navigate to gallery tab
        setTimeout(() => {
          switchTab('gallery');
        }, 500);
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('An error occurred during file upload', 'error');
    } finally {
      startUploadBtn.disabled = false;
      startUploadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg> Upload Files
      `;
      setTimeout(() => {
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
      }, 1000);
    }
  }

  /* ==========================================================================
     MODALS & LIGHTBOX ENGINE
     ========================================================================== */

  function initModals() {
    // Lightbox modal close listeners
    modalCloseBtn.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });

    // Keyboard ESC listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        closeDeleteConfirm();
      }
    });

    // Modal action buttons
    modalDeleteBtn.addEventListener('click', () => {
      if (state.modalImage) {
        closeLightbox();
        openDeleteConfirm(state.modalImage.filename);
      }
    });

    // Delete confirmation dialog actions
    confirmDeleteCancel.addEventListener('click', closeDeleteConfirm);
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteConfirm();
    });

    confirmDeleteBtn.addEventListener('click', executeFileDelete);
  }

  function openLightbox(img) {
    state.modalImage = img;
    modalFilename.textContent = img.filename;
    modalImgElement.src = img.url;
    modalMetaFilename.textContent = img.filename;
    modalMetaType.textContent = img.type;
    modalMetaSize.textContent = img.size_formatted;
    modalMetaDate.textContent = img.upload_date;
    modalDownloadBtn.href = img.download_url;

    lightboxModal.classList.add('active');
  }

  function closeLightbox() {
    lightboxModal.classList.remove('active');
    state.modalImage = null;
  }

  function openDeleteConfirm(filename) {
    state.deleteTargetFilename = filename;
    deleteTargetName.textContent = `'${filename}'`;
    deleteModal.classList.add('active');
  }

  function closeDeleteConfirm() {
    deleteModal.classList.remove('active');
    state.deleteTargetFilename = null;
  }

  async function executeFileDelete() {
    if (!state.deleteTargetFilename) return;

    const filename = state.deleteTargetFilename;
    confirmDeleteBtn.disabled = true;

    try {
      const response = await fetch(`/api/delete/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message, 'success');
        closeDeleteConfirm();
        await refreshData();
      } else {
        showToast(data.error || 'Failed to delete file', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error attempting to delete image', 'error');
    } finally {
      confirmDeleteBtn.disabled = false;
    }
  }

  /* ==========================================================================
     TOAST NOTIFICATION ENGINE
     ========================================================================== */

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      'success': `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
      'error': `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
      'warning': `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      'info': `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    toast.innerHTML = `
      ${iconMap[type] || iconMap.info}
      <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Utility Helper: Byte formatter
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Run initialization
  init();

});
