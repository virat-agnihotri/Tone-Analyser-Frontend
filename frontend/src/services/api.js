import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

export const createSession = async (driverName, trackName) => {
    const response = await api.post("/sessions/", {
        driver_name: driverName,
        track_name: trackName
    });
    return response.data;
};

export const getSessions = async () => {
    const response = await api.get("/sessions/");
    return response.data;
};

export const getSession = async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
};

export const addLapData = async (sessionId, lapData) => {
    const response = await api.post(`/sessions/${sessionId}/laps`, lapData);
    return response.data;
};

export const getLapData = async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/laps`);
    return response.data;
};

export const uploadAudioForSession = async (sessionId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/audio/upload/${sessionId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
};

export const uploadAudio = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/audio/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
};

export const analyzeSession = async (sessionId) => {
    const response = await api.post(`/analysis/${sessionId}`);
    return response.data;
};

export const getReport = async (sessionId) => {
    const response = await api.get(`/reports/${sessionId}`);
    return response.data;
};

export default api;