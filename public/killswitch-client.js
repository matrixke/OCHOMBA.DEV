(function() {
  'use strict';

  // Configuration
  const config = window.killSwitchConfig || {
    apiUrl: 'https://your-dashboard-domain.com/api/killswitch',
    apiKey: 'your-api-key-here',
    checkInterval: 30000, // Check every 30 seconds
    retryAttempts: 3
  };

  let retryCount = 0;
  let isBlocked = false;

  // Function to check kill switch status
  async function checkKillSwitch() {
    try {
      const domain = window.location.hostname;
      const response = await fetch(`${config.apiUrl}?domain=${domain}&apiKey=${config.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.blocked && !isBlocked) {
        showBlockedMessage(data.reason);
        isBlocked = true;
        return true; // Stop checking
      } else if (!data.blocked && isBlocked) {
        hideBlockedMessage();
        isBlocked = false;
        retryCount = 0; // Reset retry count on success
        return false;
      } else if (!data.blocked) {
        retryCount = 0; // Reset retry count on success
        return false;
      }

      return isBlocked; // Continue current state

    } catch (error) {
      console.error('Kill switch check failed:', error);
      retryCount++;
      
      if (retryCount >= config.retryAttempts) {
        console.error('Max retry attempts reached. Stopping kill switch checks.');
        return true; // Stop checking
      }
      
      return isBlocked; // Continue current state
    }
  }

  // Function to show blocked message
  function showBlockedMessage(reason) {
    // Remove existing message if any
    hideBlockedMessage();

    // Create blocked message overlay
    const overlay = document.createElement('div');
    overlay.id = 'killswitch-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const message = document.createElement('div');
    message.style.cssText = `
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      text-align: center;
      max-width: 500px;
      margin: 1rem;
      animation: fadeIn 0.3s ease-in-out;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    message.innerHTML = `
      <div style="color: #ef4444; font-size: 4rem; margin-bottom: 1rem;">🚫</div>
      <h1 style="color: #1f2937; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
        Website Access Restricted
      </h1>
      <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">
        ${reason || 'This website is currently unavailable due to payment issues.'}
      </p>
      <p style="color: #9ca3af; font-size: 0.875rem;">
        Please contact your service provider to restore access.
      </p>
      <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem; font-size: 0.875rem; color: #6b7280;">
        <strong>Need Help?</strong><br>
        Contact: support@ochomba.dev<br>
        Phone: +254 700 000 000
      </div>
    `;

    overlay.appendChild(message);
    document.body.appendChild(overlay);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Add escape key handler
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // Don't allow closing with escape key
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Function to hide blocked message
  function hideBlockedMessage() {
    const overlay = document.getElementById('killswitch-overlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.3s ease-in-out';
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  }

  // Start checking kill switch status
  function startKillSwitchCheck() {
    // Check immediately
    checkKillSwitch().then(shouldStop => {
      if (!shouldStop) {
        // Set up interval for periodic checks
        const interval = setInterval(() => {
          checkKillSwitch().then(shouldStop => {
            if (shouldStop) {
              clearInterval(interval);
            }
          });
        }, config.checkInterval);
      }
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startKillSwitchCheck);
  } else {
    startKillSwitchCheck();
  }

  // Expose functions for manual control (optional)
  window.killSwitch = {
    check: checkKillSwitch,
    show: showBlockedMessage,
    hide: hideBlockedMessage
  };

})();