import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useCmsStore from "../store/cmsstore";;

const LoadingToRedirect=() => {
    const { member }=useCmsStore((state) => state);
    const [count, setCount]=useState(2);
    const [redirect, setRedirect]=useState(false);

    useEffect(() => {
        const interval=setInterval(() => {
            setCount((current) => {
                if (current==1) {
                    clearInterval(interval);
                    setRedirect(true);
                }
                return current-1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (redirect) {
        if (member?.role=="admin") {
            return <Navigate to={"/admin"} />;
        } else if (member?.role=="housekeeper") {
            return <Navigate to={"/housekeeper"} />;
        } else if (member?.role=="engineer") {
            return <Navigate to={"/engineer"} />;
        }
        else {
            return <Navigate to={"/login"} />;
        }
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center space-x-2">
                <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                <span className="text-lg">Redirecting in {count}...</span>
            </div>
        </div>
    );
};

export default LoadingToRedirect;