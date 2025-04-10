import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const cmsStore=(set) => ({
    member: null,
    token: null,
    actionLogin: async (form) => {
        const res=await axios.post(import.meta.env.VITE_API_URL+"/login", form);
        set({
            member: res.data.payload,
            token: res.data.token,
        });
        return res;
    },
    actionLogout: async () => {
        set({
            member: null,
            token: null,
        });
    },
});

const usePersist={
    name: "cms-store",
    storage: createJSONStorage(() => localStorage),
};

const useCmsStore=create(
    persist(cmsStore, usePersist)
);

export default useCmsStore;