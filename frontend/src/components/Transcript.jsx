import React from "react";
import { FiRadio } from "react-icons/fi";

function Transcript({ transcript = null, segments = [] }) {
    if (!transcript && (!segments || segments.length === 0)) {
        return (
            <div className="radio-subtitle-box">
                <FiRadio style={{ marginRight: "6px", color: "#8e95a5" }} />
                <span style={{ color: "#8e95a5" }}>No transcript available for this driver session.</span>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "0.5rem" }}>
            {segments && segments.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {segments.map((seg, idx) => (
                        <div key={idx} className="radio-subtitle-box" style={{ marginTop: 0 }}>
                            <span className="radio-timestamp">
                                [{seg.start !== undefined && seg.start !== null ? Number(seg.start).toFixed(1) : "0.0"}s]
                            </span>
                            <span className="radio-quote">"{seg.text}"</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="radio-subtitle-box" style={{ marginTop: 0 }}>
                    <span className="radio-timestamp">[DRIVER RADIO]</span>
                    <span className="radio-quote">"{transcript}"</span>
                </div>
            )}
        </div>
    );
}

export default Transcript;