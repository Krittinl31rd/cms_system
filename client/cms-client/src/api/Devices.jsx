import axios from "axios";

export const getAllDevicesAllRooms=async (token) => {
    return await axios.get(import.meta.env.VITE_API_URL+"/get-alldevices", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const sendStatusRoom=async (token, data) => {
    return await axios.post(import.meta.env.VITE_API_URL+"/send-room-status", data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}