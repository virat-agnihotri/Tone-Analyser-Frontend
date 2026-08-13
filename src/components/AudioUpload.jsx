import React, { useState, useRef, useEffect } from "react";
import { uploadAudioForSession, analyzeSession } from "../services/api";
import { FiUploadCloud, FiPlay, FiPause, FiAlertCircle } from "react-icons/fi";
import Transcript from "./Transcript";

function AudioUpload({ activeSessionId, onAnalysisComplete, transcriptSnippet }) {
    const [file, setFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState("");

    const audioRef = useRef(null);

    // Reset audio state whenever active session changes
    useEffect(() => {
        setFile(null);
        setAudioUrl(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setStatusMessage("");
        setError("");
    }, [activeSessionId]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError("");
            const url = URL.createObjectURL(selectedFile);
            setAudioUrl(url);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            setFile(selectedFile);
            setError("");
            const url = URL.createObjectURL(selectedFile);
            setAudioUrl(url);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.duration) {
                setDuration(audioRef.current.duration);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleScrub = (e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const clickPos = (e.clientX - bounds.left) / bounds.width;
        const newTime = clickPos * (duration || 1);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const formatTime = (secs) => {
        if (!secs || isNaN(secs)) return "00:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleUploadAndAnalyze = async () => {
        if (!activeSessionId) {
            setError("Please select or create an active driver session first.");
            return;
        }

        if (!file) {
            setError("Please select an audio file to analyze.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setStatusMessage("UPLOADING DRIVER RADIO...");

            await uploadAudioForSession(activeSessionId, file);
            setStatusMessage("PROCESSING WHISPER ASR & ACOUSTICS...");
            const analysisResult = await analyzeSession(activeSessionId);

            setStatusMessage("ANALYSIS COMPLETE");
            if (onAnalysisComplete) {
                onAnalysisComplete(analysisResult);
            }
        } catch (err) {
            console.error("Upload/Analysis error:", err);
            const detail = err.response?.data?.detail || err.message || "Session analysis failed.";
            setError(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="telemetry-card">
            <div className="card-title-bar">
                <span className="card-section-num">1. AUDIO UPLOAD & WAVEFORM</span>
                {activeSessionId && (
                    <span className="driver-badge">SESSION #{activeSessionId}</span>
                )}
            </div>

            {/* Native audio element */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {/* Drag and Drop Zone */}
            <div
                className="upload-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById("audio-file-input")?.click()}
            >
                <input
                    type="file"
                    id="audio-file-input"
                    accept="audio/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    disabled={loading || !activeSessionId}
                />
                <div className="dropzone-label">
                    <FiUploadCloud size={18} />
                    <span>{file ? "CLICK TO CHANGE AUDIO FILE" : "DRAG AND DROP AUDIO FILE"}</span>
                </div>
            </div>

            {file && (
                <div className="selected-filename">
                    {file.name}
                </div>
            )}

            {/* Waveform Visualizer — only displayed if file is present */}
            {file && (
                <div className="waveform-box">
                    <svg className="waveform-svg" viewBox="0 0 300 40">
                        {[
                            4, 8, 14, 22, 10, 6, 18, 30, 24, 16, 8, 28, 36, 12, 6, 20,
                            32, 26, 14, 8, 22, 38, 30, 18, 10, 24, 34, 16, 8, 20, 28, 14,
                            6, 18, 26, 32, 22, 12, 24, 36, 18, 10, 16, 28, 20, 14, 8, 4
                        ].map((height, idx) => {
                            const progressRatio = currentTime / (duration || 1);
                            const barRatio = idx / 48;
                            const isPlayed = barRatio <= progressRatio;
                            return (
                                <rect
                                    key={idx}
                                    x={idx * 6.2 + 2}
                                    y={20 - height / 2}
                                    width="3.5"
                                    height={height}
                                    rx="1.5"
                                    fill={isPlayed ? "#ff2800" : "#2a2f45"}
                                />
                            );
                        })}
                    </svg>
                </div>
            )}

            {/* Audio Scrubber & Controls — displayed when file exists */}
            {file && (
                <div className="audio-controls-bar">
                    <button type="button" className="play-btn" onClick={togglePlay} disabled={!audioUrl}>
                        {isPlaying ? <FiPause /> : <FiPlay />}
                    </button>
                    <div className="progress-scrubber" onClick={handleScrub}>
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min(100, ((currentTime / (duration || 1)) * 100))}%` }}
                        >
                            <div className="progress-dot" />
                        </div>
                    </div>
                    <span className="audio-timer">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>
            )}

            {/* Subtitle / Radio Transcript */}
            <Transcript transcript={transcriptSnippet || null} />

            {/* Action Button & Status */}
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                <button
                    type="button"
                    onClick={handleUploadAndAnalyze}
                    disabled={loading || !file || !activeSessionId}
                    className="btn-f1-red"
                    style={{ width: "100%" }}
                >
                    {loading ? statusMessage || "ANALYZING..." : "UPLOAD & ANALYZE AUDIO"}
                </button>
            </div>

            {error && (
                <div className="radio-subtitle-box" style={{ borderColor: "#ff2800", color: "#ff2800", marginTop: "0.5rem" }}>
                    <FiAlertCircle style={{ marginRight: "4px" }} /> {error}
                </div>
            )}
        </div>
    );
}

export default AudioUpload;