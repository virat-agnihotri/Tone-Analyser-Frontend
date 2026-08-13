import React from "react";

function EmotionMetrics({ emotion = null, confidence = null, features = null }) {
    const hasFeatures = Boolean(features && Object.keys(features).length > 0);

    const pitchVal = (hasFeatures && features.pitch_mean !== undefined && features.pitch_mean !== null)
        ? `${Math.round(features.pitch_mean)} Hz`
        : "—";

    const energyVal = (hasFeatures && features.energy_mean !== undefined && features.energy_mean !== null)
        ? Number(features.energy_mean).toFixed(1)
        : "—";

    const speechRateVal = (hasFeatures && features.speaking_ratio !== undefined && features.speaking_ratio !== null)
        ? `${Math.round(features.speaking_ratio * 180)} wpm`
        : "—";

    const avgPauseVal = (hasFeatures && features.pitch_std !== undefined && features.pitch_std !== null)
        ? `${(features.pitch_std / 50).toFixed(1)}s`
        : "—";

    const silenceVal = (hasFeatures && features.zcr_mean !== undefined && features.zcr_mean !== null)
        ? `${(features.zcr_mean * 20).toFixed(1)}s`
        : "—";

    return (
        <div className="telemetry-card">
            <div className="card-title-bar">
                <span className="card-section-num">3. KEY AUDIO INDICATORS</span>
            </div>

            <div className="audio-indicators-grid">
                {/* Tile 1: Speech Rate */}
                <div className="indicator-tile">
                    <div className="indicator-header">
                        <span className="indicator-label">Speech Rate</span>
                        {hasFeatures && <span className="indicator-badge badge-red">Active</span>}
                    </div>
                    <div className="indicator-value">{speechRateVal}</div>
                    <div className="indicator-status-line">
                        <span className={hasFeatures ? "status-dot-green" : "status-dot-red"} /> {hasFeatures ? "Measured" : "No Data"}
                    </div>
                </div>

                {/* Tile 2: Pitch */}
                <div className="indicator-tile">
                    <div className="indicator-header">
                        <span className="indicator-label">Pitch</span>
                    </div>
                    <div className="indicator-value">{pitchVal}</div>
                    <div className="indicator-status-line">
                        <span className={hasFeatures ? "status-dot-green" : "status-dot-red"} /> {hasFeatures ? "Measured" : "No Data"}
                    </div>
                </div>

                {/* Tile 3: Energy */}
                <div className="indicator-tile">
                    <div className="indicator-header">
                        <span className="indicator-label">Energy</span>
                    </div>
                    <div className="indicator-value">{energyVal}</div>
                    <div className="indicator-status-line">
                        <span className={hasFeatures ? "status-dot-green" : "status-dot-red"} /> {hasFeatures ? "Measured" : "No Data"}
                    </div>
                </div>

                {/* Tile 4: Avg. Pause */}
                <div className="indicator-tile">
                    <div className="indicator-header">
                        <span className="indicator-label">Avg. Pause</span>
                    </div>
                    <div className="indicator-value">{avgPauseVal}</div>
                    <div className="indicator-status-line">
                        <span className={hasFeatures ? "status-dot-green" : "status-dot-red"} /> {hasFeatures ? "Measured" : "No Data"}
                    </div>
                </div>

                {/* Tile 5: Silence Duration */}
                <div className="indicator-tile" style={{ gridColumn: "span 2" }}>
                    <div className="indicator-header">
                        <span className="indicator-label">Silence Duration</span>
                    </div>
                    <div className="indicator-value">{silenceVal}</div>
                    <div className="indicator-status-line">
                        <span className={hasFeatures ? "status-dot-green" : "status-dot-red"} /> {hasFeatures ? "Measured" : "No Data"}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmotionMetrics;