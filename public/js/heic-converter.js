// HEIC to PNG Converter - Core Functionality
class HEICConverter {
  constructor() {
    this.convertedFiles = [];
    this.isConverting = false;
    this.totalFiles = 0;
    this.processedFiles = 0;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.loadHEICLibrary();
  }

  async loadHEICLibrary() {
    try {
      // Load heic2any library dynamically
      if (!window.heic2any) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
        script.onload = () => {
          console.log('HEIC library loaded successfully');
        };
        script.onerror = () => {
          console.error('Failed to load HEIC library');
          this.showError('Failed to load conversion library. Please refresh the page.');
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Error loading HEIC library:', error);
      this.showError('Conversion library failed to load.');
    }
  }

  setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const downloadBtn = document.getElementById('downloadBtn');
    const convertMoreBtn = document.getElementById('convertMoreBtn');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    if (uploadArea) {
      uploadArea.addEventListener('click', () => fileInput?.click());
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadFiles());
    }

    if (convertMoreBtn) {
      convertMoreBtn.addEventListener('click', () => this.resetConverter());
    }
  }

  setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');

    if (!uploadArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => this.highlight(uploadArea), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => this.unhighlight(uploadArea), false);
    });

    uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  highlight(element) {
    element.classList.add('drag-over');
    element.style.borderColor = '#764ba2';
    element.style.backgroundColor = 'rgba(118, 75, 162, 0.1)';
  }

  unhighlight(element) {
    element.classList.remove('drag-over');
    element.style.borderColor = '#667eea';
    element.style.backgroundColor = '#f8f9ff';
  }

  handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    this.processFiles(files);
  }

  handleFileSelect(e) {
    const files = e.target.files;
    this.processFiles(files);
  }

  async processFiles(files) {
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles = Array.from(files).filter(file => this.isValidHEICFile(file));

    if (validFiles.length === 0) {
      this.showError('Please select valid HEIC files (.heic or .heif)');
      return;
    }

    if (validFiles.length > 50) {
      this.showError('Maximum 50 files allowed per batch');
      return;
    }

    this.totalFiles = validFiles.length;
    this.processedFiles = 0;
    this.convertedFiles = [];
    this.isConverting = true;

    this.showProgress();
    this.updateProgress(0, `Starting conversion of ${this.totalFiles} files...`);

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        await this.convertFile(file, i + 1);
      }

      this.showDownload();
      this.trackConversion('success', this.totalFiles);
    } catch (error) {
      console.error('Conversion error:', error);
      this.showError('Conversion failed. Please try again.');
      this.trackConversion('error', this.totalFiles);
    } finally {
      this.isConverting = false;
    }
  }

  isValidHEICFile(file) {
    const validTypes = ['image/heic', 'image/heif'];
    const validExtensions = ['.heic', '.heif'];

    return validTypes.includes(file.type) ||
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  async convertFile(file, index) {
    try {
      this.updateProgress(
        ((index - 1) / this.totalFiles) * 100,
        `Converting ${file.name} (${index}/${this.totalFiles})...`
      );

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error(`File ${file.name} is too large (max 50MB)`);
      }

      // Convert HEIC to PNG using heic2any library
      const pngBlob = await heic2any({
        blob: file,
        toType: 'image/png',
        quality: 1.0
      });

      // Create converted file object
      const convertedFile = {
        name: file.name.replace(/\.(heic|heif)$/i, '.png'),
        blob: Array.isArray(pngBlob) ? pngBlob[0] : pngBlob,
        originalSize: file.size,
        convertedSize: (Array.isArray(pngBlob) ? pngBlob[0] : pngBlob).size
      };

      this.convertedFiles.push(convertedFile);
      this.processedFiles++;

      this.updateProgress(
        (this.processedFiles / this.totalFiles) * 100,
        `Converted ${this.processedFiles}/${this.totalFiles} files`
      );

    } catch (error) {
      console.error(`Error converting ${file.name}:`, error);
      throw new Error(`Failed to convert ${file.name}: ${error.message}`);
    }
  }

  showProgress() {
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('progressArea').style.display = 'block';
    document.getElementById('downloadArea').style.display = 'none';
  }

  updateProgress(percentage, message) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const conversionStats = document.getElementById('conversionStats');

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = message;
    }

    if (conversionStats && this.convertedFiles.length > 0) {
      const totalOriginalSize = this.convertedFiles.reduce((sum, file) => sum + file.originalSize, 0);
      const totalConvertedSize = this.convertedFiles.reduce((sum, file) => sum + file.convertedSize, 0);

      conversionStats.innerHTML = `
                <div>Original size: ${this.formatFileSize(totalOriginalSize)}</div>
                <div>Converted size: ${this.formatFileSize(totalConvertedSize)}</div>
                <div>Files processed: ${this.processedFiles}/${this.totalFiles}</div>
            `;
    }
  }

  showDownload() {
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('progressArea').style.display = 'none';
    document.getElementById('downloadArea').style.display = 'block';

    // Update download button text with file count
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.innerHTML = `
                <span class="btn-icon">⬇️</span>
                Download ${this.convertedFiles.length} PNG File${this.convertedFiles.length > 1 ? 's' : ''}
            `;
    }
  }

  async downloadFiles() {
    if (this.convertedFiles.length === 0) return;

    try {
      if (this.convertedFiles.length === 1) {
        // Single file download
        const file = this.convertedFiles[0];
        this.downloadSingleFile(file.blob, file.name);
      } else {
        // Multiple files - create ZIP
        await this.downloadAsZip();
      }

      this.trackDownload(this.convertedFiles.length);
    } catch (error) {
      console.error('Download error:', error);
      this.showError('Download failed. Please try again.');
    }
  }

  downloadSingleFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async downloadAsZip() {
    // Load JSZip library if not already loaded
    if (!window.JSZip) {
      await this.loadJSZip();
    }

    const zip = new JSZip();

    // Add all converted files to ZIP
    this.convertedFiles.forEach(file => {
      zip.file(file.name, file.blob);
    });

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    this.downloadSingleFile(zipBlob, `heic-to-png-converted-${timestamp}.zip`);
  }

  async loadJSZip() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  resetConverter() {
    this.convertedFiles = [];
    this.isConverting = false;
    this.totalFiles = 0;
    this.processedFiles = 0;

    // Reset UI
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('progressArea').style.display = 'none';
    document.getElementById('downloadArea').style.display = 'none';

    // Clear file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
    }

    // Clear progress
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      progressFill.style.width = '0%';
    }
  }

  showError(message) {
    // Create or update error message
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'errorMessage';
      errorDiv.className = 'error-message';
      errorDiv.style.cssText = `
                background: #fee;
                color: #c33;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                border: 1px solid #fcc;
                text-align: center;
                font-weight: 600;
            `;

      const converterBox = document.querySelector('.converter-box');
      if (converterBox) {
        converterBox.insertBefore(errorDiv, converterBox.firstChild);
      }
    }

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }, 5000);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Analytics tracking
  trackConversion(status, fileCount) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'heic_conversion', {
        'event_category': 'converter',
        'event_label': status,
        'value': fileCount
      });
    }
  }

  trackDownload(fileCount) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'file_download', {
        'event_category': 'converter',
        'event_label': 'png_files',
        'value': fileCount
      });
    }
  }

  // Public API methods
  getConversionStats() {
    return {
      totalFiles: this.totalFiles,
      processedFiles: this.processedFiles,
      convertedFiles: this.convertedFiles.length,
      isConverting: this.isConverting
    };
  }

  getSupportedFormats() {
    return {
      input: ['heic', 'heif'],
      output: ['png']
    };
  }
}

// Initialize converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.heicConverter = new HEICConverter();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HEICConverter;
}
