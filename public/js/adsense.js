// AdSense Optimization and Management
class AdSenseManager {
  constructor() {
    this.adUnits = [];
    this.performanceData = {};
    this.init();
  }

  init() {
    this.waitForPageLoad();
    this.setupAdUnits();
    this.trackAdPerformance();
    this.handleAdErrors();
    this.optimizeAdPlacement();
  }

  waitForPageLoad() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onPageReady());
    } else {
      this.onPageReady();
    }
  }

  onPageReady() {
    this.addAdLabels();
    this.setupLazyLoading();
    this.trackAdVisibility();
    this.initializeAds();
  }

  setupAdUnits() {
    const adContainers = document.querySelectorAll('.ad-container');
    adContainers.forEach((container, index) => {
      const adUnit = {
        id: `ad-unit-${index}`,
        container: container,
        loaded: false,
        visible: false,
        clicks: 0,
        impressions: 0,
        position: this.getAdPosition(container)
      };
      this.adUnits.push(adUnit);
    });
  }

  getAdPosition(container) {
    if (container.classList.contains('top-banner')) return 'top-banner';
    if (container.classList.contains('sidebar-ad')) return 'sidebar';
    if (container.classList.contains('in-content')) return 'in-content';
    if (container.classList.contains('bottom-banner')) return 'bottom-banner';
    return 'unknown';
  }

  addAdLabels() {
    const adContainers = document.querySelectorAll('.ad-container');
    adContainers.forEach(container => {
      if (!container.querySelector('.ad-label')) {
        const label = document.createElement('div');
        label.className = 'ad-label';
        label.textContent = 'Advertisement';
        container.insertBefore(label, container.firstChild);
      }
    });
  }

  initializeAds() {
    // Initialize AdSense ads
    if (typeof adsbygoogle !== 'undefined') {
      const ads = document.querySelectorAll('.adsbygoogle');
      ads.forEach(ad => {
        if (!ad.hasAttribute('data-adsbygoogle-status')) {
          try {
            (adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            console.warn('AdSense initialization failed:', e);
          }
        }
      });
    }
  }

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const lazyAdObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadAd(entry.target);
            lazyAdObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '100px'
      });

      // Observe ads marked for lazy loading
      document.querySelectorAll('.adsbygoogle[data-lazy="true"]').forEach(ad => {
        lazyAdObserver.observe(ad);
      });
    }
  }

  loadAd(adElement) {
    if (!adElement.hasAttribute('data-loaded')) {
      adElement.removeAttribute('data-lazy');
      adElement.setAttribute('data-loaded', 'true');

      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('Failed to load ad:', e);
      }
    }
  }

  trackAdVisibility() {
    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const adUnit = this.findAdUnit(entry.target);
          if (adUnit) {
            if (entry.isIntersecting) {
              adUnit.visible = true;
              adUnit.impressions++;
              this.logAdImpression(adUnit);
            } else {
              adUnit.visible = false;
            }
          }
        });
      }, {
        threshold: 0.5
      });

      document.querySelectorAll('.adsbygoogle').forEach(ad => {
        visibilityObserver.observe(ad);
      });
    }
  }

  findAdUnit(element) {
    return this.adUnits.find(unit =>
      unit.container.contains(element)
    );
  }

  logAdImpression(adUnit) {
    // Track ad impressions
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ad_impression', {
        'custom_parameter': `heic_converter_${adUnit.id}`,
        'ad_position': adUnit.position,
        'value': 1
      });
    }

    // Store performance data
    this.storePerformanceData('impression', adUnit);
    console.log(`Ad impression: ${adUnit.id} at ${adUnit.position}`);
  }

  trackAdPerformance() {
    // Track ad clicks
    document.addEventListener('click', (e) => {
      const adContainer = e.target.closest('.ad-container');
      if (adContainer) {
        const adUnit = this.findAdUnit(adContainer);
        if (adUnit) {
          adUnit.clicks++;
          this.logAdClick(adUnit);
        }
      }
    });

    // Track ad load events
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => this.checkAdLoadStatus(), 3000);
    });
  }

  logAdClick(adUnit) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ad_click', {
        'custom_parameter': `heic_converter_${adUnit.id}`,
        'ad_position': adUnit.position,
        'value': 1
      });
    }

    this.storePerformanceData('click', adUnit);
    console.log(`Ad click: ${adUnit.id} at ${adUnit.position}`);
  }

  storePerformanceData(event, adUnit) {
    const timestamp = new Date().toISOString();
    const data = {
      timestamp,
      event,
      adUnitId: adUnit.id,
      position: adUnit.position,
      sessionId: this.getSessionId()
    };

    // Store in localStorage for later analysis
    const storageKey = 'adsense_performance';
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push(data);

    // Keep only last 1000 events
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000);
    }

    localStorage.setItem(storageKey, JSON.stringify(existing));
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return this.sessionId;
  }

  checkAdLoadStatus() {
    const ads = document.querySelectorAll('.adsbygoogle');
    ads.forEach((ad, index) => {
      const adUnit = this.adUnits[index];
      if (adUnit) {
        const status = ad.getAttribute('data-adsbygoogle-status');
        adUnit.loaded = status === 'done';

        if (!adUnit.loaded) {
          console.warn(`Ad failed to load: ${adUnit.id}`);
          this.handleAdLoadFailure(adUnit);
        }
      }
    });
  }

  handleAdLoadFailure(adUnit) {
    // Hide failed ad container
    adUnit.container.style.display = 'none';

    // Track failure
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ad_load_failure', {
        'custom_parameter': `heic_converter_${adUnit.id}`,
        'ad_position': adUnit.position
      });
    }
  }

  handleAdErrors() {
    window.addEventListener('error', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('adsbygoogle')) {
        console.warn('AdSense ad error:', e.target);
        this.handleAdLoadError(e.target);
      }
    });

    // Handle AdSense specific errors
    window.addEventListener('adsbygoogle-error', (e) => {
      console.warn('AdSense error event:', e.detail);
    });
  }

  handleAdLoadError(adElement) {
    const container = adElement.closest('.ad-container');
    if (container) {
      container.style.display = 'none';
      console.log('Hidden failed ad container');
    }
  }

  optimizeAdPlacement() {
    // Hide ads during conversion process
    const conversionArea = document.getElementById('progressArea');
    if (conversionArea) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.target.style.display !== 'none') {
            document.body.classList.add('converting');
            this.pauseAds();
          } else {
            document.body.classList.remove('converting');
            this.resumeAds();
          }
        });
      });

      observer.observe(conversionArea, {
        attributes: true,
        attributeFilter: ['style']
      });
    }

    // Optimize ad refresh based on user engagement
    this.setupAdRefresh();
  }

  pauseAds() {
    // Reduce ad visibility during conversion
    this.adUnits.forEach(unit => {
      if (unit.position === 'sidebar') {
        unit.container.style.opacity = '0.5';
        unit.container.style.pointerEvents = 'none';
      }
    });
  }

  resumeAds() {
    // Restore ad visibility after conversion
    this.adUnits.forEach(unit => {
      unit.container.style.opacity = '1';
      unit.container.style.pointerEvents = 'auto';
    });
  }

  setupAdRefresh() {
    // Refresh ads every 30 seconds for better revenue
    setInterval(() => {
      this.refreshAds();
    }, 30000);
  }

  refreshAds() {
    this.adUnits.forEach(unit => {
      if (unit.visible && !unit.loaded) {
        const adElement = unit.container.querySelector('.adsbygoogle');
        if (adElement && !adElement.hasAttribute('data-adsbygoogle-status')) {
          this.loadAd(adElement);
        }
      }
    });
  }

  // Analytics and reporting
  getPerformanceReport() {
    const report = {
      totalAdUnits: this.adUnits.length,
      totalImpressions: this.adUnits.reduce((sum, unit) => sum + unit.impressions, 0),
      totalClicks: this.adUnits.reduce((sum, unit) => sum + unit.clicks, 0),
      ctr: this.calculateCTR(),
      adUnits: this.adUnits.map(unit => ({
        id: unit.id,
        position: unit.position,
        impressions: unit.impressions,
        clicks: unit.clicks,
        loaded: unit.loaded,
        visible: unit.visible
      }))
    };

    return report;
  }

  calculateCTR() {
    const totalImpressions = this.adUnits.reduce((sum, unit) => sum + unit.impressions, 0);
    const totalClicks = this.adUnits.reduce((sum, unit) => sum + unit.clicks, 0);
    return totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
  }

  exportPerformanceData() {
    const data = localStorage.getItem('adsense_performance');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adsense_performance_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // A/B testing for ad positions
  runAdPositionTest() {
    const testVariant = Math.random() < 0.5 ? 'A' : 'B';

    if (testVariant === 'B') {
      // Move sidebar ad to different position
      const sidebarAd = document.querySelector('.sidebar-ad');
      const contentSection = document.querySelector('.content-section');

      if (sidebarAd && contentSection) {
        contentSection.appendChild(sidebarAd);
        sidebarAd.classList.add('test-variant-b');
      }
    }

    // Track test variant
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ad_test_variant', {
        'custom_parameter': testVariant
      });
    }
  }
}

// Initialize AdSense Manager
const adSenseManager = new AdSenseManager();

// Expose to global scope for debugging
window.adSenseManager = adSenseManager;

// Performance monitoring
setInterval(() => {
  const report = adSenseManager.getPerformanceReport();
  console.log('AdSense Performance Report:', report);
}, 300000); // Every 5 minutes

// Export performance data daily
if (localStorage.getItem('last_export_date') !== new Date().toDateString()) {
  adSenseManager.exportPerformanceData();
  localStorage.setItem('last_export_date', new Date().toDateString());
}
