import React from "react";

function AIInsight({ insights = null, context = [] }) {
    if (!insights) {
        return (
            <div className="ai-summary-block" style={{ borderLeftColor: "#5c6275" }}>
                <div>
                    <span className="ai-alert-label" style={{ color: "#8e95a5" }}>INFO:</span>
                    <span className="ai-summary-text" style={{ color: "#8e95a5" }}>
                        No AI summary available for this session. Complete an audio analysis to generate engineer insights.
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-summary-block">
            <div>
                <span className="ai-alert-label">ALERT:</span>
                <span className="ai-summary-text">{insights}</span>
            </div>
            {context && context.length > 0 && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#8e95a5", borderTop: "1px dashed #222636", paddingTop: "0.4rem" }}>
                    <strong>RAG Telemetry Context:</strong> {context.join(" | ")}
                </div>
            )}
        </div>
    );
}

export default AIInsight;