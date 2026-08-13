import React from "react";
import { FiTool, FiActivity, FiUserCheck, FiClock } from "react-icons/fi";

function Recommendations({ recommendations = [] }) {
    const icons = [<FiTool key="1" />, <FiActivity key="2" />, <FiUserCheck key="3" />, <FiClock key="4" />];

    if (!recommendations || recommendations.length === 0) {
        return (
            <div style={{ marginTop: "0.75rem" }}>
                <div className="recommendations-title">RECOMMENDATIONS</div>
                <p style={{ fontSize: "0.8rem", color: "#8e95a5", margin: "0.25rem 0 0 0" }}>
                    No recommendations generated for this session yet.
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "0.75rem" }}>
            <div className="recommendations-title">RECOMMENDATIONS</div>
            <div className="recommendations-grid">
                {recommendations.map((recItem, idx) => {
                    const recText = typeof recItem === "string" ? recItem : recItem.text;
                    return (
                        <div key={idx} className="rec-card-tile">
                            <span className="rec-num-badge">{idx + 1}.</span>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                                <span style={{ color: "#ff2800", marginTop: "2px", fontSize: "0.75rem" }}>
                                    {icons[idx % icons.length]}
                                </span>
                                <span className="rec-content-text">{recText}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Recommendations;