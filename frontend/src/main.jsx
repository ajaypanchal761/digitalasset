import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./App.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AppStateProvider } from "./context/AppStateContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import App from "./App.jsx";

// Prevent zoom in webview - disable pinch zoom gestures
if (typeof window !== 'undefined') {
  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Prevent pinch zoom
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });

  document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
  });

  document.addEventListener('gestureend', function (e) {
    e.preventDefault();
  });

  // Prevent wheel zoom (Ctrl + scroll)
  document.addEventListener('wheel', function (e) {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent keyboard zoom (Ctrl + Plus/Minus)
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
      e.preventDefault();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
    }
  });

  // Force viewport scale to 1.0
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no');
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppStateProvider>
            <AdminProvider>
              <App />
            </AdminProvider>
          </AppStateProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
