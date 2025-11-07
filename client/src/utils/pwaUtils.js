// Service Worker Registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          // Service Worker registered successfully
          
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available - show update prompt
                if (confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          // Service Worker registration failed silently
        });
    });
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Show install prompt
let deferredPrompt;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show custom install prompt
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    // PWA installed successfully
    deferredPrompt = null;
  });
}

function showInstallButton() {
  // Check if already in PWA mode
  if (isPWA()) return;
  
  // Create popup notification
  const popup = document.createElement('div');
  popup.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <img src="/icons/android/android-launchericon-72-72.png" style="width: 40px; height: 40px; border-radius: 8px;" alt="Splitaa" />
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">
          Install Splitaa
        </div>
        <div style="font-size: 12px; color: #666;">
          Quick access & offline mode
        </div>
      </div>
      <div style="display: flex; gap: 6px; align-items: center;">
        <button id="pwa-install-btn" style="
          padding: 6px 14px;
          background-color: #22C55E;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
        ">
          Install
        </button>
        <button id="pwa-close-btn" style="
          background: none;
          border: none;
          font-size: 20px;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 28px;
          height: 28px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
    </div>
  `;
  
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    max-width: 420px;
    width: calc(100% - 40px);
    background: white;
    border-radius: 10px;
    padding: 12px 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
    will-change: transform, opacity;
    -webkit-transform: translateX(-50%) translateY(-100px);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  `;
  
  document.body.appendChild(popup);
  
  // Animate in
  setTimeout(() => {
    popup.style.transform = 'translateX(-50%) translateY(0)';
    popup.style.opacity = '1';
  }, 100);
  
  // Handle install button click
  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Clear the prompt
    deferredPrompt = null;
    
    // Remove popup with animation
    popup.style.transform = 'translateX(-50%) translateY(-100px)';
    popup.style.opacity = '0';
    setTimeout(() => popup.remove(), 300);
  });
  
  // Handle dismiss button
  const dismissPopup = () => {
    popup.style.transform = 'translateX(-50%) translateY(-100px)';
    popup.style.opacity = '0';
    setTimeout(() => popup.remove(), 300);
  };
  
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', dismissPopup);
  document.getElementById('pwa-close-btn').addEventListener('click', dismissPopup);
}

// Check if app is running as PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

// Prevent zoom on iOS
export function preventZoom() {
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });
  
  document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
  });
  
  document.addEventListener('gestureend', function (e) {
    e.preventDefault();
  });
}
