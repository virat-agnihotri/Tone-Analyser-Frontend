import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSessions, getReport } from "../services/api";
import { FiExternalLink, FiUser, FiMapPin, FiClock, FiActivity, FiSmile } from "react-icons/fi";

function Sessions() {
    const navigate = useNavigate();
    const [sessionsData, setSessionsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await getSessions();
            const list = data || [];

            // Enrich sessions with analysis details if available
            const enriched = await Promise.all(
                list.map(async (s) => {
                    try {
                        const report = await getReport(s.id);
                        const latest = report?.latest_analysis;
                        return {
                            ...s,
                            stressScore: latest?.stress_score !== undefined ? latest.stress_score : null,
                            emotion: latest?.emotion || null
                        };
                    } catch (err) {
                        return { ...s, stressScore: null, emotion: null };
                    }
                })
            );

            setSessionsData(enriched);
        } catch (error) {
            console.error("Error loading sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSession = (sessionId) => {
        navigate(`/?sessionId=${sessionId}`);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "Recent Session";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1440px", margin: "0 auto", flex: 1 }}>
            <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "1px", color: "#fff", textTransform: "uppercase" }}>
                    DRIVER SESSIONS DIRECTORY
                </div>
                <div style={{ fontSize: "0.8rem", color: "#8e95a5", marginTop: "4px" }}>
                    Select a driver session to load full voice tone analysis, lap stress correlations, and telemetry into the Dashboard.
                </div>
            </div>

            {loading ? (
                <div className="telemetry-card">
                    <p style={{ color: "#8e95a5", fontSize: "0.85rem" }}>Loading driver sessions...</p>
                </div>
            ) : sessionsData.length === 0 ? (
                <div className="telemetry-card">
                    <p style={{ color: "#8e95a5", fontSize: "0.85rem" }}>No driver sessions recorded yet.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                    {sessionsData.map((session) => (
                        <div key={session.id} className="telemetry-card" style={{ justifyContent: "space-between" }}>
                            <div>
                                <div className="card-title-bar">
                                    <span className="card-section-num">
                                        SESSION #{session.id} - {session.track_name || "Circuit"}
                                    </span>
                                    <span className="driver-badge">{(session.status || "ACTIVE").toUpperCase()}</span>
                                </div>

                                <div style={{ fontSize: "0.85rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.5rem", margin: "0.5rem 0 1rem 0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FiUser style={{ color: "#ff2800" }} />
                                        <strong style={{ color: "#fff" }}>Driver:</strong> {session.driver_name}
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FiMapPin style={{ color: "#ff2800" }} />
                                        <strong style={{ color: "#fff" }}>Track:</strong> {session.track_name || "Circuit"}
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FiClock style={{ color: "#8e95a5" }} />
                                        <strong style={{ color: "#fff" }}>Date/Time:</strong> {formatDate(session.created_at)}
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FiActivity style={{ color: session.stressScore !== null ? (session.stressScore >= 75 ? "#ff2800" : session.stressScore >= 45 ? "#ffb400" : "#00e676") : "#8e95a5" }} />
                                        <strong style={{ color: "#fff" }}>Stress Score:</strong>{" "}
                                        {session.stressScore !== null ? `${session.stressScore}%` : "N/A"}
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FiSmile style={{ color: "#8e95a5" }} />
                                        <strong style={{ color: "#fff" }}>Emotion:</strong>{" "}
                                        {session.emotion ? session.emotion : "N/A"}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleOpenSession(session.id)}
                                className="btn-f1-red"
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}
                            >
                                <FiExternalLink /> OPEN IN DASHBOARD
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Sessions;