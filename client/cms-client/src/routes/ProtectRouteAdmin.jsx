import React, { useState, useEffect } from "react";
import useCmsStore from "../store/cmsstore";
import { currentAdmin } from "../api/auth";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteAdmin=({ element }) => {
    const [status, setStatus]=useState(false);
    const { member, token }=useCmsStore((state) => state);

    useEffect(() => {
        if (member&&token) {
            currentAdmin(token)
                .then(() => setStatus(true))
                .catch(() => setStatus(false));
        }
    }, []);

    return status? element:<LoadingToRedirect />;
};
export default ProtectRouteAdmin