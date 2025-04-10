import axios from "axios";


export const currentAdmin=async (token) =>
    await axios.post(
        import.meta.env.VITE_API_URL+"/current-admin",
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

export const currentHousekeeper=async (token) =>
    await axios.post(
        import.meta.env.VITE_API_URL+"/current-housekeeper",
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

export const currentEngineer=async (token) =>
    await axios.post(
        import.meta.env.VITE_API_URL+"/current-engineer",
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )