import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { FiGrid, FiList } from "react-icons/fi";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <div className="app-shell">
                {/* Motorsport Sidebar Navigation */}
                <aside className="sidebar">
                    <div className="sidebar-brand">
                        <div className="f1-logo-badge">
                            <div className="f1-red-bar" />
                        </div>
                        <div className="brand-text-group">
                            <span className="brand-title">SILENT CO-DRIVER</span>
                            <span className="brand-subtitle">AI DRIVER TELEMETRY</span>
                        </div>
                    </div>

                    <nav className="sidebar-menu">
                        <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                            <FiGrid className="icon" /> Dashboard
                        </NavLink>
                        <NavLink to="/sessions" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                            <FiList className="icon" /> Sessions
                        </NavLink>
                    </nav>

                    <div className="sidebar-footer">
                        <div className="telemetry-status-tag">
                            <span className="status-dot-green" /> CH-1 TELEMETRY READY
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="main-wrapper">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/sessions" element={<Sessions />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;