/**
 * OCHOMBA.DEV Site Integration Script
 * Add this script to your client websites to enable automatic blocking/unblocking
 * 
 * Usage:
 * 1. Add this script to your website's HTML before closing </body> tag
 * 2. Replace 'YOUR_DOMAIN' with your actual domain
 * 3. Replace 'YOUR_API_KEY' with your killswitch API key
 * 
 * <script src="https://your-dashboard-domain.com/site-integration.js"></script>
 * <script>
 *   OCHOMBASiteIntegration.init({
 *     domain: 'yourdomain.com',
 *     apiKey: 'your-api-key',
 *     dashboardUrl: 'https://your-dashboard-domain.com'
 *   });
 * </script>
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiEndpoint: '/api/killswitch',
    checkInterval: 30000, // Check every 30 seconds
    retryAttempts: 3,
    retryDelay: 5000
  };

  // Site Integration Class
  class OCHOMBASiteIntegration {
    constructor(options) {
      this.domain = options.domain;
      this.apiKey = options.apiKey;
      this.dashboardUrl = options.dashboardUrl;
      this.isBlocked = false;
      this.retryCount = 0;
      this.checkInterval = null;
      this.blockOverlay = null;
      
      this.init();
    }

    init() {
      console.log('OCHOMBA.DEV Site Integration initialized for:', this.domain);
      this.createBlockOverlay();
      this.startStatusCheck();
      this.setupVisibilityChangeListener();
    }

    createBlockOverlay() {
      // Create overlay HTML
      const overlayHTML = `
        <div id="ochomba-block-overlay" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          z-index: 999999;
          display: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: white;
            text-align: center;
            padding: 20px;
          ">
            <div style="
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              max-width: 500px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
              <div style="
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                animation: pulse 2s infinite;
              ">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              
              <h1 style="
                font-size: 28px;
                font-weight: 700;
                margin: 0 0 16px;
                background: linear-gradient(45deg, #fff, #f0f0f0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              ">
                Website Temporarily Unavailable
              </h1>
              
              <p style="
                font-size: 16px;
                margin: 0 0 24px;
                opacity: 0.9;
                line-height: 1.5;
              ">
                Your website access has been temporarily suspended. This is usually due to a payment issue or maintenance.
              </p>
              
              <div style="margin-bottom: 24px;">
                <button id="ochomba-contact-support" style="
                  background: rgba(255, 255, 255, 0.2);
                  border: 2px solid rgba(255, 255, 255, 0.3);
                  color: white;
                  padding: 12px 24px;
                  border-radius: 50px;
                  font-size: 16px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  margin-right: 12px;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                  📞 Contact Support
                </button>
                
                <button id="ochomba-check-status" style="
                  background: transparent;
                  border: 2px solid rgba(255, 255, 255, 0.5);
                  color: white;
                  padding: 12px 24px;
                  border-radius: 50px;
                  font-size: 16px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                " onmouseover="this.style.borderColor='rgba(255,255,255,0.8)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.5)'">
                  🔄 Check Status
                </button>
              </div>
              
              <p style="
                font-size: 14px;
                opacity: 0.7;
                margin: 0;
              ">
                Domain: ${this.domain}
              </p>
            </div>
          </div>
        </div>
        
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          #ochomba-block-overlay {
            animation: fadeIn 0.5s ease-out;
          }
        </style>
      `;

      // Add to page
      document.body.insertAdjacentHTML('beforeend', overlayHTML);
      this.blockOverlay = document.getElementById('ochomba-block-overlay');
      
      // Add event listeners
      document.getElementById('ochomba-contact-support').addEventListener('click', () => {
        this.openSupportModal();
      });
      
      document.getElementById('ochomba-check-status').addEventListener('click', () => {
        this.checkStatus(true);
      });
    }

    openSupportModal() {
      // Create support modal
      const modalHTML = `
        <div id="ochomba-support-modal" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        ">
          <div style="
            background: white;
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
          ">
            <button id="ochomba-close-modal" style="
              position: absolute;
              top: 15px;
              right: 15px;
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #666;
            ">×</button>
            
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Contact Support</h2>
            
            <form id="ochomba-support-form">
              <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Your Message</label>
                <textarea id="ochomba-message" style="
                  width: 100%;
                  padding: 12px;
                  border: 2px solid #e1e5e9;
                  border-radius: 10px;
                  font-size: 16px;
                  resize: vertical;
                  min-height: 120px;
                  font-family: inherit;
                " placeholder="Please describe your issue or question..."></textarea>
              </div>
              
              <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Your Email (Optional)</label>
                <input type="email" id="ochomba-email" style="
                  width: 100%;
                  padding: 12px;
                  border: 2px solid #e1e5e9;
                  border-radius: 10px;
                  font-size: 16px;
                " placeholder="your@email.com">
              </div>
              
              <button type="submit" style="
                width: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 15px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                Send Message
              </button>
            </form>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      const modal = document.getElementById('ochomba-support-modal');
      const closeBtn = document.getElementById('ochomba-close-modal');
      const form = document.getElementById('ochomba-support-form');
      
      // Close modal
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
      
      // Handle form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendSupportMessage();
      });
    }

    async sendSupportMessage() {
      const message = document.getElementById('ochomba-message').value;
      const email = document.getElementById('ochomba-email').value;
      
      if (!message.trim()) {
        alert('Please enter a message');
        return;
      }

      try {
        const response = await fetch(`${this.dashboardUrl}/api/support-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: this.domain,
            message: message.trim(),
            email: email || null,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        });

        if (response.ok) {
          alert('Message sent successfully! We\'ll get back to you soon.');
          document.getElementById('ochomba-support-modal').remove();
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending support message:', error);
        alert('Failed to send message. Please try again or contact us directly.');
      }
    }

    async checkStatus(force = false) {
      if (!force && this.retryCount >= CONFIG.retryAttempts) {
        console.log('Max retry attempts reached');
        return;
      }

      try {
        const response = await fetch(`${this.dashboardUrl}${CONFIG.apiEndpoint}?domain=${encodeURIComponent(this.domain)}&apiKey=${this.apiKey}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.blocked) {
          this.showBlockOverlay(data.reason || 'Website access suspended');
        } else {
          this.hideBlockOverlay();
        }

        this.retryCount = 0; // Reset retry count on success
        
      } catch (error) {
        console.error('Error checking status:', error);
        this.retryCount++;
        
        if (this.retryCount < CONFIG.retryAttempts) {
          setTimeout(() => this.checkStatus(), CONFIG.retryDelay);
        }
      }
    }

    showBlockOverlay(reason) {
      if (!this.isBlocked) {
        this.isBlocked = true;
        this.blockOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log('Website blocked:', reason);
      }
    }

    hideBlockOverlay() {
      if (this.isBlocked) {
        this.isBlocked = false;
        this.blockOverlay.style.display = 'none';
        document.body.style.overflow = '';
        console.log('Website unblocked');
      }
    }

    startStatusCheck() {
      // Initial check
      this.checkStatus();
      
      // Periodic checks
      this.checkInterval = setInterval(() => {
        this.checkStatus();
      }, CONFIG.checkInterval);
    }

    setupVisibilityChangeListener() {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.checkInterval) {
          // Page became visible, check status immediately
          this.checkStatus();
        }
      });
    }

    destroy() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
      if (this.blockOverlay) {
        this.blockOverlay.remove();
      }
    }
  }

  // Global initialization function
  window.OCHOMBASiteIntegration = {
    init: function(options) {
      if (!options.domain || !options.apiKey || !options.dashboardUrl) {
        console.error('OCHOMBA.DEV Site Integration: Missing required options (domain, apiKey, dashboardUrl)');
        return;
      }
      
      return new OCHOMBASiteIntegration(options);
    }
  };

  // Auto-initialize if config is provided
  if (window.OCHOMBA_CONFIG) {
    window.OCHOMBASiteIntegration.init(window.OCHOMBA_CONFIG);
  }

})();
