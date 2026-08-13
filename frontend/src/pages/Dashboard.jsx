import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getSessions, createSession, getReport, getLapData, addLapData } from "../services/api";
import { FiPlus, FiFileText, FiX, FiCheck } from "react-icons/fi";

import StressGauge from "../components/StressGauge";
import AudioUpload from "../components/AudioUpload";
import EmotionMetrics from "../components/EmotionMetrics";
import StressTimeline from "../components/StressTimeline";
import LapChart from "../components/LapChart";
import AIInsight from "../components/AIInsight";
import Recommendations from "../components/Recommendations";

function Dashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const sessionIdParam = searchParams.get("sessionId");

    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loadingSession, setLoadingSession] = useState(false);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLapModal, setShowLapModal] = useState(false);

    // Form states (No hardcoded demo values!)
    const [driverNameInput, setDriverNameInput] = useState("");
    const [trackNameInput, setTrackNameInput] = useState("");
    const [creatingSession, setCreatingSession] = useState(false);

    const [lapNumber, setLapNumber] = useState(1);
    const [lapTime, setLapTime] = useState("");
    const [maxSpeed, setMaxSpeed] = useState("");
    const [avgSpeed, setAvgSpeed] = useState("");
    const [brakingEvents, setBrakingEvents] = useState("");
    const [addingLap, setAddingLap] = useState(false);

    useEffect(() => {
        loadSessions();
    }, [sessionIdParam]);

    const loadSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data || []);

            const targetId = sessionIdParam ? Number(sessionIdParam) : null;

            if (data && data.length > 0 && targetId) {
                const found = data.find((s) => s.id === targetId);
                if (found) {
                    selectSession(found);
                    return;
                }
            }

            // Always default to empty session on startup/reload unless explicitly passed via URL
            setActiveSession(null);
            setAnalysis(null);
        } catch (err) {
            console.error("Failed to load sessions:", err);
            setActiveSession(null);
            setAnalysis(null);
        }
    };

    const selectSession = async (session) => {
        if (!session) return;
        setActiveSession(session);
        setAnalysis(null);
        setLoadingSession(true);

        try {
            const report = await getReport(session.id);
            const latest = report?.latest_analysis;
            const laps = report?.lap_data || [];

            if (latest) {
                setAnalysis({
                    session_id: session.id,
                    transcript: { text: latest.transcript },
                    emotion: { emotion: latest.emotion, confidence: latest.emotion_confidence },
                    stress: {
                        score: latest.stress_score,
                        level: latest.stress_score >= 75 ? "High" : latest.stress_score >= 45 ? "Moderate" : "Low",
                        factors: []
                    },
                    audio_features: {
                        pitch_mean: latest.pitch_mean,
                        energy_mean: latest.energy_mean,
                        speaking_ratio: latest.speaking_rate
                    },
                    lap_analysis: { laps: laps },
                    all_analysis_records: report?.all_analysis_records || [],
                    insights: latest.insight || null,
                    recommendations: []
                });
            } else {
                // Session exists, but no audio analysis complete yet
                setAnalysis(laps.length > 0 ? { lap_analysis: { laps: laps } } : null);
            }
        } catch (err) {
            console.log("No existing report for session:", session.id);
            setAnalysis(null);
        } finally {
            setLoadingSession(false);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!driverNameInput.trim()) return;

        try {
            setCreatingSession(true);
            const newSession = await createSession(driverNameInput.trim(), trackNameInput.trim() || "Circuit");
            setSessions([newSession, ...sessions]);
            setActiveSession(newSession);
            setAnalysis(null);
            setShowCreateModal(false);
            setDriverNameInput("");
            setTrackNameInput("");
            setSearchParams({ sessionId: newSession.id });
        } catch (err) {
            console.error("Failed to create session:", err);
        } finally {
            setCreatingSession(false);
        }
    };

    const handleAddLap = async (e) => {
        e.preventDefault();
        if (!activeSession) return;

        try {
            setAddingLap(true);
            await addLapData(activeSession.id, {
                lap_number: Number(lapNumber),
                lap_time: Number(lapTime) || 80.0,
                sector_time: Number(((Number(lapTime) || 80.0) / 3).toFixed(2)),
                max_speed: Number(maxSpeed) || 250.0,
                avg_speed: Number(avgSpeed) || 180.0,
                braking_events: Number(brakingEvents) || 5,
                throttle: 75.0
            });
            setShowLapModal(false);
            setLapTime("");
            setMaxSpeed("");
            setAvgSpeed("");
            setBrakingEvents("");
            selectSession(activeSession);
        } catch (err) {
            console.error("Failed to add lap data:", err);
        } finally {
            setAddingLap(false);
        }
    };

    const handleExportPdf = async () => {
        if (!activeSession) return;
        try {
            const reportData = await getReport(activeSession.id);
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Telemetry_Report_Session_${activeSession.id}.json`;
            a.click();
        } catch (err) {
            console.error("Export report error:", err);
        }
    };

    const currentLapsCount = analysis?.lap_analysis?.laps?.length || 0;

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Top Session Control Header */}
            <div className="top-session-bar">
                <div className="session-info-pill">
                    <span className="driver-tag">
                        <span className="driver-badge">F1</span>
                        {activeSession ? `${activeSession.driver_name} (${activeSession.track_name || "Circuit"})` : "No Active Driver Session"}
                    </span>
                    {activeSession && (
                        <span className="telemetry-status-tag" style={{ fontSize: "0.75rem" }}>
                            <span className={analysis?.stress ? "status-dot-green" : "status-dot-yellow"} />
                            {analysis?.stress ? "ANALYSIS COMPLETE" : "READY FOR AUDIO"}
                        </span>
                    )}
                </div>

                <div className="session-selectors">
                    <select
                        value={activeSession ? activeSession.id : ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                                setActiveSession(null);
                                setAnalysis(null);
                                setSearchParams({});
                                return;
                            }
                            const found = sessions.find((s) => s.id === Number(val));
                            if (found) {
                                selectSession(found);
                                setSearchParams({ sessionId: found.id });
                            }
                        }}
                        className="session-dropdown-select"
                    >
                        <option value="">Select Driver Session...</option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                Session #{s.id} - {s.driver_name} [{s.status || "ACTIVE"}]
                            </option>
                        ))}
                    </select>

                    <button type="button" onClick={() => setShowCreateModal(true)} className="btn-f1-secondary" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FiPlus /> New Session
                    </button>

                    {activeSession && (
                        <button type="button" onClick={() => {
                            setLapNumber(currentLapsCount + 1);
                            setShowLapModal(true);
                        }} className="btn-f1-secondary" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <FiPlus /> Add Lap
                        </button>
                    )}
                </div>
            </div>

            {/* Main Telemetry Grid Workspace */}
            {!activeSession ? (
                /* STARTUP STATE: CREATE NEW SESSION SCREEN */
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                    <div className="telemetry-card" style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", maxWidth: "520px", width: "100%" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: "900", letterSpacing: "2px", color: "#fff", marginBottom: "0.4rem" }}>
                                CREATE NEW SESSION
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#8e95a5", lineHeight: "1.5" }}>
                                Enter driver telemetry information below to create a new session and initialize the Silent Co-Driver workspace.
                            </div>
                        </div>

                        <form onSubmit={handleCreateSession} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div className="form-group">
                                <label style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#cbd5e1", textTransform: "uppercase", marginBottom: "0.4rem", display: "block" }}>
                                    Driver Name *
                                </label>
                                <input
                                    type="text"
                                    value={driverNameInput}
                                    onChange={(e) => setDriverNameInput(e.target.value)}
                                    placeholder="e.g. Max Verstappen"
                                    required
                                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff", fontSize: "0.9rem" }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#cbd5e1", textTransform: "uppercase", marginBottom: "0.4rem", display: "block" }}>
                                    Track Circuit *
                                </label>
                                <input
                                    type="text"
                                    value={trackNameInput}
                                    onChange={(e) => setTrackNameInput(e.target.value)}
                                    placeholder="e.g. Monaco Circuit"
                                    required
                                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff", fontSize: "0.9rem" }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={creatingSession}
                                className="btn-f1-red"
                                style={{ width: "100%", padding: "0.85rem", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "1px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.5rem" }}
                            >
                                <FiPlus size={18} /> {creatingSession ? "CREATING SESSION..." : "CREATE SESSION"}
                            </button>
                        </form>

                        {sessions.length > 0 && (
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem", textAlign: "center" }}>
                                {sessions.length} previous session{sessions.length > 1 ? "s" : ""} saved in history. Use the top dropdown to view a past session.
                            </div>
                        )}
                    </div>
                </div>
            ) : loadingSession ? (
                /* LOADING SESSION STATE */
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                    <div className="telemetry-card" style={{ padding: "3rem 2rem", textAlign: "center", width: "100%", maxWidth: "480px" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#fff", letterSpacing: "1px" }}>LOADING SESSION...</div>
                        <div style={{ fontSize: "0.85rem", color: "#8e95a5", marginTop: "0.5rem" }}>Retrieving telemetry and analysis data for Session #{activeSession.id}</div>
                    </div>
                </div>
            ) : (
                /* ACTIVE SESSION TELEMETRY WORKSPACE */
                <div className="dashboard-workspace">
                    {/* ROW 1: Audio Upload, Overall Stress Assessment, Key Audio Indicators */}
                    <div className="dashboard-row-top">
                        {/* Card 1: 1. AUDIO UPLOAD & WAVEFORM */}
                        <AudioUpload
                            activeSessionId={activeSession ? activeSession.id : null}
                            onAnalysisComplete={setAnalysis}
                            transcriptSnippet={analysis?.transcript?.text}
                        />

                        {/* Card 2: 2. OVERALL STRESS ASSESSMENT */}
                        <StressGauge
                            score={analysis?.stress?.score}
                            level={analysis?.stress?.level}
                            factors={analysis?.stress?.factors}
                            emotion={analysis?.emotion?.emotion}
                            confidence={analysis?.emotion?.confidence}
                        />

                        {/* Card 3: 3. KEY AUDIO INDICATORS */}
                        <EmotionMetrics
                            emotion={analysis?.emotion?.emotion}
                            confidence={analysis?.emotion?.confidence}
                            features={analysis?.audio_features}
                        />
                    </div>

                    {/* ROW 2: Card 4: 4. EMOTION TIMELINE & LAP/STRESS GRAPH */}
                    <div className="dashboard-row-mid">
                        <div className="telemetry-card">
                            <div className="card-title-bar">
                                <span className="card-section-num">4. EMOTION TIMELINE & LAP/STRESS GRAPH</span>
                                <div className="timeline-legend">
                                    <div className="legend-item"><span className="status-dot-red" /> Stress (Red)</div>
                                    <div className="legend-item"><span className="status-dot-green" /> Calm (Green)</div>
                                </div>
                            </div>

                            {/* Top Emotion Timeline Line Chart */}
                            <StressTimeline
                                data={analysis?.timeline}
                                records={analysis?.all_analysis_records || []}
                                stressScore={analysis?.stress?.score}
                            />

                            {/* Sub Header: LAP TIME vs STRESS */}
                            <div className="sub-graph-title">
                                <span>LAP TIME vs STRESS</span>
                                <div className="timeline-legend" style={{ fontSize: "0.7rem" }}>
                                    <div className="legend-item"><span style={{ width: 8, height: 2, background: "#fff", display: "inline-block" }} /> Lap Time (s)</div>
                                    <div className="legend-item"><span style={{ width: 8, height: 2, background: "#ff2800", display: "inline-block" }} /> Stress Score</div>
                                </div>
                            </div>

                            {/* Bottom Dual Axis Chart (Lap Time vs Stress) */}
                            <LapChart
                                lapAnalysis={analysis?.lap_analysis}
                                currentStress={analysis?.stress?.score}
                            />
                        </div>
                    </div>


                    {/* ROW 3: Card 5: 5. AI ENGINEER SUMMARY & RECOMMENDATIONS + Card 6: 6. EXPORT REPORT */}
                    <div className="dashboard-row-bottom">
                        {/* Card 5: 5. AI ENGINEER SUMMARY & RECOMMENDATIONS */}
                        <div className="telemetry-card">
                            <div className="card-title-bar">
                                <span className="card-section-num">5. AI ENGINEER SUMMARY & RECOMMENDATIONS</span>
                            </div>

                            <AIInsight
                                insights={analysis?.insights}
                                context={analysis?.rag_context}
                            />

                            <Recommendations
                                recommendations={analysis?.recommendations}
                            />
                        </div>

                        {/* Card 6: 6. EXPORT REPORT */}
                        <div className="telemetry-card">
                            <div className="card-title-bar">
                                <span className="card-section-num">6. EXPORT REPORT</span>
                            </div>

                            <div className="export-card-body">
                                <button type="button" onClick={handleExportPdf} disabled={!activeSession} className="btn-export-pdf">
                                    <FiFileText size={18} /> EXPORT PDF REPORT
                                </button>
                                <span className="view-details-link" onClick={handleExportPdf}>
                                    View Details
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">CREATE DRIVER SESSION</span>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleCreateSession} className="form-grid-2">
                            <div className="form-group">
                                <label>Driver Name</label>
                                <input
                                    type="text"
                                    value={driverNameInput}
                                    onChange={(e) => setDriverNameInput(e.target.value)}
                                    placeholder="e.g. Max Verstappen"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Track Circuit</label>
                                <input
                                    type="text"
                                    value={trackNameInput}
                                    onChange={(e) => setTrackNameInput(e.target.value)}
                                    placeholder="e.g. Monaco Circuit"
                                    required
                                />
                            </div>
                            <div style={{ gridColumn: "span 2", marginTop: "0.5rem" }}>
                                <button type="submit" disabled={creatingSession} className="btn-f1-red" style={{ width: "100%" }}>
                                    {creatingSession ? "CREATING..." : "START DRIVER SESSION"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Lap Telemetry Modal */}
            {showLapModal && activeSession && (
                <div className="modal-overlay" onClick={() => setShowLapModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">ADD LAP TELEMETRY (SESSION #{activeSession.id})</span>
                            <button className="close-btn" onClick={() => setShowLapModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleAddLap} className="form-grid-2">
                            <div className="form-group">
                                <label>Lap Number</label>
                                <input type="number" value={lapNumber} onChange={(e) => setLapNumber(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Lap Time (sec)</label>
                                <input type="number" step="0.1" value={lapTime} onChange={(e) => setLapTime(e.target.value)} placeholder="e.g. 82.5" required />
                            </div>
                            <div className="form-group">
                                <label>Max Speed (km/h)</label>
                                <input type="number" step="0.1" value={maxSpeed} onChange={(e) => setMaxSpeed(e.target.value)} placeholder="e.g. 290.0" />
                            </div>
                            <div className="form-group">
                                <label>Avg Speed (km/h)</label>
                                <input type="number" step="0.1" value={avgSpeed} onChange={(e) => setAvgSpeed(e.target.value)} placeholder="e.g. 190.0" />
                            </div>
                            <div className="form-group" style={{ gridColumn: "span 2" }}>
                                <label>Braking Events</label>
                                <input type="number" value={brakingEvents} onChange={(e) => setBrakingEvents(e.target.value)} placeholder="e.g. 6" />
                            </div>
                            <div style={{ gridColumn: "span 2", marginTop: "0.5rem" }}>
                                <button type="submit" disabled={addingLap} className="btn-f1-red" style={{ width: "100%" }}>
                                    {addingLap ? "SAVING TELEMETRY..." : "SAVE LAP TELEMETRY"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;