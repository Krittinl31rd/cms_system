import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from "react-toastify";
import useCmsStore from '../store/cmsstore';

const login=() => {
    const navigate=useNavigate()
    const { actionLogin }=useCmsStore((state) => state);

    const [form, setForm]=useState({
        username: "",
        password: "",
    });

    const handelOnChage=(e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handelSubmit=async (e) => {
        e.preventDefault();
        try {
            const res=await actionLogin(form);
            const role=res.data.payload.role;
            roleRedirect(role);
            toast.success(`${res.data?.message} | Welcome ${res.data?.payload?.username}`);
        } catch (err) {
            const errMsg=err.response?.data?.message;
            toast.error(errMsg);
        }
    }

    const roleRedirect=(role) => {
        if (role=="admin") {
            navigate(import.meta.env.VITE_BASE_URL+"/admin");
        } else if (role=="housekeeper") {
            navigate(import.meta.env.VITE_BASE_URL+"/housekeeper");
        } else if (role=="engineer") {
            navigate(import.meta.env.VITE_BASE_URL+"/engineer");
        }
    };

    return (
        <main className=" bg-gray-100 flex items-center justify-center h-[calc(100vh)]">
            <div className="bg-white rounded-2xl w-96 shadow-xl">
                <div className="p-4 mx-auto">
                    <h1 className="text-2xl font-bold mb-5">CMS | Login</h1>
                    <form className="flex flex-col gap-3" onSubmit={handelSubmit}>
                        <div className="flex flex-col items-start justify-center gap-1">
                            <h1 className="text-gray-600 font-semibold">Username</h1>
                            <input
                                onChange={handelOnChage}
                                autoComplete="username"
                                name="username"
                                type="text"
                                placeholder="you@example.com"
                                className="w-full border border-black rounded-xl py-3 px-4"
                                required
                            />
                        </div>
                        <div className="flex flex-col items-start justify-center gap-1">
                            <h1 className="text-gray-600 font-semibold">Password</h1>
                            <input
                                onChange={handelOnChage}
                                autoComplete="current-password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                className="w-full border border-black rounded-xl py-3 px-4"
                                required
                            />
                        </div>

                        <button className="bg-black hover:bg-black/90 text-white font-semibold w-full h-12 rounded-xl mt-2">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </main>
    )
}
export default login