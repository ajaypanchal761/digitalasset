import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AppStateProvider } from "./context/AppStateContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppStateProvider>
          <AdminProvider>
            <App />
          </AdminProvider>
        </AppStateProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
