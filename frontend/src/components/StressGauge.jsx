import React from "react";

function StressGauge({ score = null, level = null, factors = [], emotion = null, confidence = null }) {
    const hasScore = score !== null && score !== undefined;
    const numericScore = hasScore ? Math.min(100, Math.max(0, Math.round(Number(score) || 0))) : 0;

    let statusClass = "";
    let statusText = "NO ANALYSIS";

    if (!hasScore) {
        statusClass = "";
        statusText = "NO STRESS DATA";
    } else if (numericScore >= 75) {
        statusClass = "high";
        statusText = "HIGH STRESS";
    } else if (numericScore >= 45) {
        statusClass = "medium";
        statusText = "MODERATE STRESS";
    } else {
        statusClass = "low";
        statusText = "LOW STRESS";
    }

    // Needle rotation angle (-90deg to 90deg for semi-circle arc)
    const needleAngle = -90 + (numericScore / 100) * 180;
    const confidencePct = (confidence !== null && confidence !== undefined) ? Math.round(confidence * 100) : null;
    const emotionDisplay = emotion || "—";

    return (
        <div className="telemetry-card">
            <div className="card-title-bar">
                <span className="card-section-num">2. OVERALL STRESS ASSESSMENT</span>
            </div>

            <div className="stress-gauge-wrapper">
                <div className="gauge-svg-container">
                    <svg viewBox="0 0 200 120" style={{ width: "100%", height: "100%" }}>
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00e676" />
                                <stop offset="50%" stopColor="#ffb400" />
                                <stop offset="100%" stopColor="#ff2800" />
                            </linearGradient>
                        </defs>

                        {/* Background Track Arc */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#1b1f2e"
                            strokeWidth="16"
                            strokeLinecap="round"
                        />

                        {/* Colored Gradient Arc */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke={hasScore ? "url(#gaugeGradient)" : "#222636"}
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeDasharray="251.2"
                            strokeDashoffset={hasScore ? 251.2 - (251.2 * numericScore) / 100 : 251.2}
                            style={{ transition: "stroke-dashoffset 0.8s ease" }}
                        />

                        {/* Center Text */}
                        <text x="100" y="65" textAnchor="middle" fill="#8e95a5" fontSize="8" fontWeight="800" letterSpacing="0.5">
                            OVERALL
                        </text>
                        <text x="100" y="77" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" letterSpacing="0.5">
                            DRIVER STRESS
                        </text>

                        {/* Needle */}
                        {hasScore && (
                            <g transform={`translate(100, 100) rotate(${needleAngle})`}>
                                <polygon points="-3,0 0,-70 3,0" fill="#ff2800" />
                                <circle cx="0" cy="0" r="7" fill="#ffffff" stroke="#141722" strokeWidth="3" />
                            </g>
                        )}

                        {/* Gauge Value Text */}
                        <text x="155" y="98" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
                            {hasScore ? `${numericScore}%` : "—"}
                        </text>
                    </svg>
                </div>

                <div className={`stress-value-title ${statusClass}`}>
                    {hasScore ? `${statusText} (${numericScore}%)` : statusText}
                </div>

                <div className="emotion-subtext">
                    PREDICTED EMOTION: <strong style={{ color: "#ffffff" }}>{emotionDisplay}</strong>
                    {confidencePct !== null ? ` (Confidence: ${confidencePct}%)` : " (Confidence: —)"}
                </div>
            </div>
        </div>
    );
}

export default StressGauge;