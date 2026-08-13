import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { FiCheckCircle, FiInfo } from "react-icons/fi";

function CustomLapTooltip({ active, payload, isEstimated }) {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div style={{ background: "#0e111a", border: `1px solid ${isEstimated ? "#ffab00" : "#ff2800"}`, padding: "8px 12px", borderRadius: 6, fontSize: 11, color: "#fff" }}>
                <div style={{ fontWeight: "700", color: isEstimated ? "#ffab00" : "#fff", marginBottom: 4 }}>
                    {item.lap} {isEstimated ? "(Estimate)" : ""}
                </div>
                <div>Lap Time: <strong style={{ color: "#fff" }}>{item.lapTime}s</strong></div>
                <div>Stress Score: <strong style={{ color: "#ff2800" }}>{item.stressScore} / 100</strong></div>
                {isEstimated && (
                    <div style={{ marginTop: 4, fontSize: "0.65rem", color: "#8e95a5", maxWidth: 200 }}>
                        Estimated performance trend derived from vocal stress. This is not actual vehicle telemetry.
                    </div>
                )}
            </div>
        );
    }
    return null;
}

function LapChart({
    activeSession = null,
    hasAudio = false,
    isProcessing = false,
    lapAnalysis = {},
    allAnalysisRecords = [],
    currentStress = null
}) {
    // STATE 1: No active session
    if (!activeSession) {
        return (
            <div className="empty-telemetry-notice">
                <div className="notice-title" style={{ color: "#ff2800" }}>NO ACTIVE SESSION</div>
                <div className="notice-sub">Create or select a driver session to begin telemetry analysis.</div>
            </div>
        );
    }

    // STATE 3: Analysis in progress
    if (isProcessing) {
        return (
            <div className="empty-telemetry-notice">
                <div className="notice-title" style={{ color: "#ffab00" }}>ANALYSIS IN PROGRESS</div>
                <div className="notice-sub">Processing Whisper ASR, emotion classification, and stress analysis...</div>
            </div>
        );
    }

    const laps = lapAnalysis?.laps || [];
    const segments = (allAnalysisRecords || []).filter(r => r && typeof r.timestamp === "number");


    // STATE 6: Actual LapData available (HIGHEST PRIORITY TELEMETRY)
    if (laps.length > 0) {
        const chartData = laps.map((lap, idx) => {
            let lapStress = currentStress !== null ? Number(currentStress) : 0;
            if (segments.length > 0) {
                const segIdx = Math.min(idx, segments.length - 1);
                if (segments[segIdx] && segments[segIdx].stress_score !== undefined) {
                    lapStress = Number(segments[segIdx].stress_score);
                }
            }

            return {
                lap: `Lap ${lap.lap_number || idx + 1}`,
                lapNumber: lap.lap_number || idx + 1,
                lapTime: lap.lap_time !== undefined && lap.lap_time !== null ? Number(lap.lap_time) : 0,
                stressScore: Math.round(lapStress * 10) / 10
            };
        });

        return (
            <div style={{ width: "100%", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span className="telemetry-badge-actual" style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 4, background: "#00e676", color: "#000", fontWeight: "800", letterSpacing: "1px", display: "inline-flex", alignItems: "center" }}>
                        <FiCheckCircle style={{ marginRight: 4 }} />
                        ACTUAL TELEMETRY
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#8e95a5" }}>Real Lap Data ({laps.length} Laps)</span>
                </div>

                <div style={{ width: "100%", height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#1f2334" vertical={false} />
                            <XAxis dataKey="lapNumber" stroke="#5c6275" fontSize={11} tickLine={false} />
                            <YAxis yAxisId="left" stroke="#5c6275" fontSize={10} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                            <YAxis yAxisId="right" orientation="right" stroke="#ff2800" fontSize={10} tickLine={false} domain={[0, 100]} />
                            <Tooltip content={<CustomLapTooltip isEstimated={false} />} />
                            <Line yAxisId="left" type="monotone" dataKey="lapTime" stroke="#ffffff" strokeWidth={2} dot={{ r: 4, fill: "#ffffff", stroke: "#141722", strokeWidth: 2 }} name="Lap Time (s)" />
                            <Line yAxisId="right" type="monotone" dataKey="stressScore" stroke="#ff2800" strokeWidth={2} dot={{ r: 4, fill: "#ff2800", stroke: "#141722", strokeWidth: 2 }} name="Stress Score" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    // STATE 2: Session exists, no audio analysis and no lap data
    if (!hasAudio && segments.length === 0) {
        return (
            <div className="empty-telemetry-notice">
                <div className="notice-title" style={{ color: "#e2e8f0" }}>NO AUDIO ANALYSIS</div>
                <div className="notice-sub">Upload driver radio audio or add lap telemetry to view performance charts.</div>
            </div>
        );
    }

    // STATE 5: Segment-level stress available, no actual lap telemetry
    if (segments.length > 1) {
        const baselineLapTime = 80.0;

        const chartData = segments.map((seg, idx) => {
            const segStress = seg.stress_score !== undefined && seg.stress_score !== null ? Number(seg.stress_score) : 50.0;
            const normStress = Math.min(1.0, Math.max(0.0, segStress / 100.0));

            // Smooth non-linear performance impact function (0% to ~8% lap time impact)
            const perfImpact = 0.08 * ((normStress + Math.pow(normStress, 2)) / 2.0);
            const estLapTime = Number((baselineLapTime * (1.0 + perfImpact)).toFixed(2));

            return {
                lap: `Segment ${idx + 1} (${seg.timestamp}s)`,
                lapNumber: idx + 1,
                lapTime: estLapTime,
                stressScore: Math.round(segStress * 10) / 10,
                isEstimated: true
            };
        });

        return (
            <div style={{ width: "100%", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 4, background: "rgba(255,171,0,0.15)", border: "1px solid #ffab00", color: "#ffab00", fontWeight: "800", letterSpacing: "1px", display: "inline-flex", alignItems: "center" }}>
                        <FiInfo style={{ marginRight: 4 }} />
                        STRESS-BASED PERFORMANCE ESTIMATE
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#8e95a5" }}>
                        Estimated — no actual lap telemetry available.
                    </span>
                </div>

                <div style={{ width: "100%", height: 150 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#1f2334" vertical={false} />
                            <XAxis dataKey="lapNumber" stroke="#5c6275" fontSize={11} tickLine={false} />
                            <YAxis yAxisId="left" stroke="#ffab00" fontSize={10} tickLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                            <YAxis yAxisId="right" orientation="right" stroke="#ff2800" fontSize={10} tickLine={false} domain={[0, 100]} />
                            <Tooltip content={<CustomLapTooltip isEstimated={true} />} />
                            <Line yAxisId="left" type="monotone" dataKey="lapTime" stroke="#ffab00" strokeDasharray="4 4" strokeWidth={2} dot={{ r: 4, fill: "#ffab00", stroke: "#141722", strokeWidth: 2 }} name="Est. Lap Time (s)" />
                            <Line yAxisId="right" type="monotone" dataKey="stressScore" stroke="#ff2800" strokeWidth={2} dot={{ r: 4, fill: "#ff2800", stroke: "#141722", strokeWidth: 2 }} name="Stress Score" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ fontSize: "0.65rem", color: "#5c6275", marginTop: "4px", fontStyle: "italic", textAlign: "center" }}>
                    "Estimated performance trend derived from vocal stress. This is not actual vehicle telemetry."
                </div>
            </div>
        );
    }

    // STATE 4 / STATE D / STATE 7: Single stress record & no lap data
    return (
        <div className="empty-telemetry-notice">
            <div className="notice-title" style={{ color: "#00e676" }}>
                OVERALL STRESS: {currentStress !== null ? Number(currentStress).toFixed(1) : "N/A"} / 100
            </div>
            <div className="notice-sub">
                Only one analysis point available. Insufficient data for performance trend. Add lap telemetry to enable lap performance tracking.
            </div>
        </div>
    );

}

export default LapChart;