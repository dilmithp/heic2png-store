// UI Enhancement and Interaction Handler
class UIManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupMobileNavigation();
    this.setupSmoothScrolling();
    this.setupAnimations();
    this.setupTooltips();
    this.setupKeyboardNavigation();
    this.handleResponsiveFeatures();
  }

  setupMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');

        // Animate hamburger menu
        const spans = navToggle.querySelectorAll('span');
        spans.forEach((span, index) => {
          span.style.transform = navToggle.classList.contains('active')
            ? this.getHamburgerTransform(index)
            : 'none';
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove('active');
          navToggle.classList.remove('active');
          this.resetHamburgerMenu(navToggle);
        }
      });
    }
  }

  getHamburgerTransform(index) {
    const transforms = [
      'rotate(45deg) translate(5px, 5px)',
      'opacity: 0',
      'rotate(-45deg) translate(7px, -6px)'
    ];
    return transforms[index] || 'none';
  }

  resetHamburgerMenu(toggle) {
    const spans = toggle.querySelectorAll('span');
    spans.forEach(span => {
      span.style.transform = 'none';
      span.style.opacity = '1';
    });
  }

  setupSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          const headerHeight = document.querySelector('.header').offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  setupAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .content-card, .faq-item').forEach(el => {
      observer.observe(el);
    });

    // Add CSS for animations
    this.addAnimationStyles();
  }

  addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
            .feature-card, .content-card, .faq-item {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.6s ease-out;
            }
            
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            
            .nav-menu.active {
                display: flex !important;
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                padding: 1rem;
                z-index: 1000;
            }
            
            @media (max-width: 768px) {
                .nav-menu {
                    display: none;
                }
            }
        `;
    document.head.appendChild(style);
  }

  setupTooltips() {
    // Simple tooltip system
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        this.showTooltip(e.target, e.target.dataset.tooltip);
      });

      element.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
        `;

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';

    this.currentTooltip = tooltip;
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  setupKeyboardNavigation() {
    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Escape key to close modals/menus
      if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu.active');
        if (navMenu) {
          navMenu.classList.remove('active');
          document.querySelector('.nav-toggle').classList.remove('active');
        }
      }

      // Enter/Space for file input
      if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'uploadArea') {
        e.preventDefault();
        document.getElementById('fileInput').click();
      }
    });
  }

  handleResponsiveFeatures() {
    // Handle responsive behavior
    const handleResize = () => {
      const width = window.innerWidth;

      // Close mobile menu on desktop
      if (width > 768) {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        if (navMenu) navMenu.classList.remove('active');
        if (navToggle) navToggle.classList.remove('active');
      }

      // Adjust converter layout
      this.adjustConverterLayout(width);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
  }

  adjustConverterLayout(width) {
    const converterLayout = document.querySelector('.converter-layout');
    if (!converterLayout) return;

    if (width <= 768) {
      converterLayout.style.gridTemplateColumns = '1fr';
    } else {
      converterLayout.style.gridTemplateColumns = '2fr 1fr';
    }
  }

  // Utility methods
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;

    // Set background color based on type
    const colors = {
      info: '#3498db',
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c'
    };
    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  updatePageTitle(title) {
    document.title = title;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Performance monitoring
  measurePerformance() {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    }
  }
}

// Initialize UI Manager
document.addEventListener('DOMContentLoaded', () => {
  window.uiManager = new UIManager();
});

// Add scroll-to-top functionality
window.addEventListener('scroll', () => {
  const scrollBtn = document.getElementById('scrollToTop');
  if (window.pageYOffset > 300) {
    if (!scrollBtn) {
      const btn = document.createElement('button');
      btn.id = 'scrollToTop';
      btn.innerHTML = '↑';
      btn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #667eea;
                color: white;
                border: none;
                font-size: 20px;
                cursor: pointer;
                z-index: 1000;
                transition: all 0.3s ease;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            `;
      btn.addEventListener('click', () => window.uiManager.scrollToTop());
      document.body.appendChild(btn);
    }
  } else if (scrollBtn) {
    scrollBtn.remove();
  }
});
