// Google Analytics and Custom Analytics
class AnalyticsManager {
  constructor() {
    this.events = [];
    this.sessionStart = Date.now();
    this.pageViews = 0;
    this.conversions = 0;
    this.init();
  }

  init() {
    this.setupGoogleAnalytics();
    this.trackPageView();
    this.setupCustomTracking();
    this.trackUserBehavior();
    this.setupConversionTracking();
  }

  setupGoogleAnalytics() {
    // Initialize Google Analytics if not already done
    if (typeof gtag === 'undefined') {
      console.warn('Google Analytics not loaded');
      return;
    }

    // Enhanced ecommerce tracking setup
    gtag('config', 'GA_MEASUREMENT_ID', {
      custom_map: {
        'custom_parameter_1': 'conversion_type',
        'custom_parameter_2': 'file_count',
        'custom_parameter_3': 'file_size'
      }
    });

    // Set custom dimensions
    gtag('config', 'GA_MEASUREMENT_ID', {
      'custom_map': {
        'dimension1': 'user_type',
        'dimension2': 'conversion_success',
        'dimension3': 'device_type'
      }
    });
  }

  trackPageView() {
    this.pageViews++;

    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        'page_title': document.title,
        'page_location': window.location.href,
        'custom_parameter': 'heic_converter_page'
      });
    }

    this.logEvent('page_view', {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    });
  }

  setupCustomTracking() {
    // Track scroll depth
    this.trackScrollDepth();

    // Track time on page
    this.trackTimeOnPage();

    // Track clicks on important elements
    this.trackElementClicks();

    // Track form interactions
    this.trackFormInteractions();
  }

  trackScrollDepth() {
    const scrollDepths = [25, 50, 75, 90, 100];
    const trackedDepths = new Set();

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      scrollDepths.forEach(depth => {
        if (scrollPercent >= depth && !trackedDepths.has(depth)) {
          trackedDepths.add(depth);

          if (typeof gtag !== 'undefined') {
            gtag('event', 'scroll_depth', {
              'custom_parameter': depth,
              'event_category': 'engagement'
            });
          }

          this.logEvent('scroll_depth', { depth: depth });
        }
      });
    });
  }

  trackTimeOnPage() {
    const intervals = [30, 60, 120, 300, 600]; // seconds
    const trackedIntervals = new Set();

    setInterval(() => {
      const timeOnPage = Math.round((Date.now() - this.sessionStart) / 1000);

      intervals.forEach(interval => {
        if (timeOnPage >= interval && !trackedIntervals.has(interval)) {
          trackedIntervals.add(interval);

          if (typeof gtag !== 'undefined') {
            gtag('event', 'time_on_page', {
              'custom_parameter': interval,
              'event_category': 'engagement'
            });
          }

          this.logEvent('time_on_page', { seconds: interval });
        }
      });
    }, 10000); // Check every 10 seconds
  }

  trackElementClicks() {
    // Track clicks on important elements
    const elementsToTrack = [
      { selector: '.browse-btn', name: 'browse_button' },
      { selector: '.download-btn', name: 'download_button' },
      { selector: '.convert-more-btn', name: 'convert_more_button' },
      { selector: '.nav-menu a', name: 'navigation_link' },
      { selector: '.read-more', name: 'read_more_link' },
      { selector: '.feature-card', name: 'feature_card' }
    ];

    elementsToTrack.forEach(({ selector, name }) => {
      document.addEventListener('click', (e) => {
        if (e.target.matches(selector) || e.target.closest(selector)) {
          if (typeof gtag !== 'undefined') {
            gtag('event', 'element_click', {
              'event_category': 'interaction',
              'event_label': name,
              'custom_parameter': name
            });
          }

          this.logEvent('element_click', {
            element: name,
            text: e.target.textContent?.trim().substring(0, 50)
          });
        }
      });
    });
  }

  trackFormInteractions() {
    // Track file input interactions
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const fileCount = e.target.files.length;
        const totalSize = Array.from(e.target.files).reduce((sum, file) => sum + file.size, 0);

        if (typeof gtag !== 'undefined') {
          gtag('event', 'file_upload_attempt', {
            'event_category': 'conversion',
            'custom_parameter': fileCount,
            'value': Math.round(totalSize / 1024 / 1024) // MB
          });
        }

        this.logEvent('file_upload_attempt', {
          fileCount: fileCount,
          totalSizeMB: Math.round(totalSize / 1024 / 1024)
        });
      });
    }
  }

  setupConversionTracking() {
    // Track conversion funnel
    this.trackConversionFunnel();

    // Track conversion success/failure
    this.trackConversionOutcome();
  }

  trackConversionFunnel() {
    const funnelSteps = [
      { element: '#uploadArea', step: 'upload_area_view' },
      { element: '#progressArea', step: 'conversion_started' },
      { element: '#downloadArea', step: 'conversion_completed' }
    ];

    // Use Intersection Observer to track funnel steps
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const step = funnelSteps.find(s => entry.target.matches(s.element));
          if (step) {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'funnel_step', {
                'event_category': 'conversion_funnel',
                'event_label': step.step,
                'custom_parameter': step.step
              });
            }

            this.logEvent('funnel_step', { step: step.step });
          }
        }
      });
    });

    funnelSteps.forEach(({ element }) => {
      const el = document.querySelector(element);
      if (el) observer.observe(el);
    });
  }

  trackConversionOutcome() {
    // Listen for conversion events from the converter
    document.addEventListener('conversionComplete', (e) => {
      this.conversions++;
      const { fileCount, totalSize, processingTime } = e.detail;

      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion_success', {
          'event_category': 'conversion',
          'event_label': 'heic_to_png',
          'custom_parameter': fileCount,
          'value': fileCount
        });

        // Enhanced ecommerce event
        gtag('event', 'purchase', {
          'transaction_id': this.generateTransactionId(),
          'value': 0, // Free service
          'currency': 'USD',
          'items': [{
            'item_id': 'heic_to_png_conversion',
            'item_name': 'HEIC to PNG Conversion',
            'category': 'Image Conversion',
            'quantity': fileCount,
            'price': 0
          }]
        });
      }

      this.logEvent('conversion_success', {
        fileCount: fileCount,
        totalSizeMB: Math.round(totalSize / 1024 / 1024),
        processingTimeMs: processingTime
      });
    });

    document.addEventListener('conversionError', (e) => {
      const { error, fileCount } = e.detail;

      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion_error', {
          'event_category': 'conversion',
          'event_label': error,
          'custom_parameter': fileCount
        });
      }

      this.logEvent('conversion_error', {
        error: error,
        fileCount: fileCount
      });
    });
  }

  trackUserBehavior() {
    // Track device and browser info
    this.trackDeviceInfo();

    // Track user preferences
    this.trackUserPreferences();

    // Track performance metrics
    this.trackPerformanceMetrics();
  }

  trackDeviceInfo() {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      language: navigator.language,
      platform: navigator.platform
    };

    if (typeof gtag !== 'undefined') {
      gtag('event', 'device_info', {
        'event_category': 'technical',
        'custom_parameter': `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
        'custom_parameter_2': deviceInfo.platform
      });
    }

    this.logEvent('device_info', deviceInfo);
  }

  trackUserPreferences() {
    // Track if user prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.logEvent('user_preference', { colorScheme: 'dark' });
    }

    // Track if user prefers reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.logEvent('user_preference', { reducedMotion: true });
    }
  }

  trackPerformanceMetrics() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if ('performance' in window) {
          const perfData = performance.getEntriesByType('navigation')[0];
          const metrics = {
            loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
            domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
            firstPaint: this.getFirstPaint(),
            largestContentfulPaint: this.getLCP()
          };

          if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metrics', {
              'event_category': 'technical',
              'custom_parameter': metrics.loadTime,
              'value': metrics.loadTime
            });
          }

          this.logEvent('performance_metrics', metrics);
        }
      }, 1000);
    });
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? Math.round(firstPaint.startTime) : null;
  }

  getLCP() {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(Math.round(lastEntry.startTime));
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  }

  // Utility methods
  logEvent(eventName, data) {
    const event = {
      name: eventName,
      data: data,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      url: window.location.href
    };

    this.events.push(event);

    // Store in localStorage for offline analysis
    this.storeEventLocally(event);

    console.log('Analytics Event:', event);
  }

  storeEventLocally(event) {
    const storageKey = 'analytics_events';
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push(event);

    // Keep only last 500 events
    if (existing.length > 500) {
      existing.splice(0, existing.length - 500);
    }

    localStorage.setItem(storageKey, JSON.stringify(existing));
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return this.sessionId;
  }

  generateTransactionId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Reporting methods
  getSessionReport() {
    return {
      sessionId: this.getSessionId(),
      sessionStart: new Date(this.sessionStart).toISOString(),
      sessionDuration: Date.now() - this.sessionStart,
      pageViews: this.pageViews,
      conversions: this.conversions,
      events: this.events.length,
      conversionRate: this.pageViews > 0 ? (this.conversions / this.pageViews * 100).toFixed(2) : 0
    };
  }

  exportAnalyticsData() {
    const data = {
      session: this.getSessionReport(),
      events: this.events,
      localStorage: JSON.parse(localStorage.getItem('analytics_events') || '[]')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Real-time analytics dashboard
  startRealTimeDashboard() {
    setInterval(() => {
      console.log('Real-time Analytics:', this.getSessionReport());
    }, 30000); // Every 30 seconds
  }
}

// Initialize Analytics Manager
const analyticsManager = new AnalyticsManager();

// Expose to global scope
window.analyticsManager = analyticsManager;

// Start real-time dashboard in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  analyticsManager.startRealTimeDashboard();
}

// Send analytics data before page unload
window.addEventListener('beforeunload', () => {
  // Send any pending analytics data
  if (typeof gtag !== 'undefined') {
    gtag('event', 'session_end', {
      'event_category': 'engagement',
      'custom_parameter': Math.round((Date.now() - analyticsManager.sessionStart) / 1000)
    });
  }
});
