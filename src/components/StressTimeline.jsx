import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div style={{ background: "#0e111a", border: "1px solid #ff2800", padding: "8px 12px", borderRadius: 6, fontSize: 11, color: "#fff" }}>
                <div style={{ fontWeight: "700", color: "#ff2800", marginBottom: 2 }}>Time: {item.time}</div>
                <div>Stress Score: <strong>{item.stress}</strong> / 100</div>
                {item.emotion && (
                    <div>Emotion: <strong style={{ color: "#00e676", textTransform: "capitalize" }}>{item.emotion}</strong></div>
                )}
                {item.confidence && (
                    <div style={{ color: "#8e95a5" }}>Confidence: {item.confidence}</div>
                )}
            </div>
        );
    }
    return null;
}

function StressTimeline({ records = [], data = null }) {
    const analysisRecords = Array.isArray(records) && records.length > 0 ? records : (Array.isArray(data) ? data : []);

    if (analysisRecords.length === 0) {
        return (
            <div style={{ padding: "1.25rem 0", textAlign: "center", color: "#8e95a5", fontSize: "0.8rem", background: "rgba(14,17,26,0.5)", borderRadius: 6, margin: "0.5rem 0" }}>
                No stress timeline data available for this session.
            </div>
        );
    }

    // Deduplicate or filter valid timestamped records
    const validRecords = analysisRecords.filter(r => r && typeof r.timestamp === "number");

    // Single analysis record state (Requirement 3)
    if (validRecords.length <= 1) {
        const rec = validRecords[0] || analysisRecords[0];
        const stressVal = rec?.stress_score !== undefined && rec?.stress_score !== null ? Number(rec.stress_score.toFixed(1)) : "N/A";
        const emotionVal = rec?.emotion || "neutral";
        const confVal = rec?.emotion_confidence ? `${(rec.emotion_confidence * 100).toFixed(1)}%` : null;

        return (
            <div style={{ padding: "1rem 1.25rem", textAlign: "left", color: "#8e95a5", background: "rgba(14,17,26,0.6)", border: "1px solid #2a2f45", borderRadius: 6, margin: "0.5rem 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <div style={{ fontWeight: "700", color: "#e2e8f0", fontSize: "0.85rem", marginBottom: "2px" }}>
                        SINGLE ANALYSIS POINT (Time: 0s)
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#8e95a5" }}>
                        Stress Score: <strong style={{ color: "#ff2800" }}>{stressVal} / 100</strong> | Emotion: <strong style={{ color: "#00e676", textTransform: "capitalize" }}>{emotionVal}</strong> {confVal ? `(${confVal})` : ""}
                    </div>
                </div>
                <span style={{ fontSize: "0.65rem", padding: "3px 8px", borderRadius: 4, background: "rgba(255,40,0,0.15)", border: "1px solid #ff2800", color: "#ff2800", fontWeight: "700", letterSpacing: "0.5px" }}>
                    ONLY ONE ANALYSIS POINT AVAILABLE
                </span>
            </div>
        );
    }

    // Multiple analysis records state (Requirement 4)
    const chartData = validRecords.map((seg, idx) => ({
        time: `${seg.timestamp}s`,
        timestamp: seg.timestamp,
        stress: seg.stress_score !== undefined && seg.stress_score !== null ? Number(seg.stress_score.toFixed(1)) : 0,
        emotion: seg.emotion || "neutral",
        confidence: seg.emotion_confidence ? `${(seg.emotion_confidence * 100).toFixed(1)}%` : null
    }));

    return (
        <div style={{ width: "100%", marginTop: "0.5rem" }}>
            <div style={{ width: "100%", height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff2800" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ff2800" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 2" stroke="#1f2334" vertical={false} />
                        <XAxis dataKey="time" stroke="#5c6275" fontSize={10} tickLine={false} />
                        <YAxis stroke="#5c6275" fontSize={9} tickLine={false} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="stress" stroke="#ff2800" strokeWidth={2} fillOpacity={1} fill="url(#stressGrad)" name="Stress" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Segment Emotion Timeline Indicators */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                {chartData.map((seg, idx) => (
                    <span
                        key={idx}
                        style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#141722",
                            border: "1px solid #2a2f45",
                            color: seg.emotion === "angry" || seg.emotion === "fear" ? "#ff2800" : seg.emotion === "happy" ? "#00e676" : "#8e95a5"
                        }}
                    >
                        {seg.time}: <strong style={{ textTransform: "capitalize" }}>{seg.emotion}</strong> ({seg.stress} stress)
                    </span>
                ))}
            </div>
        </div>
    );
}


export default StressTimeline;