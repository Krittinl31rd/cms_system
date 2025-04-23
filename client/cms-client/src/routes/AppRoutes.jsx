import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from '../layouts/Layout'
import Login from '../pages/Login'
import ProtectRouteAdmin from '../routes/ProtectRouteAdmin'
import ProtectRouteHousekeeper from '../routes/ProtectRouteHousekeeper'
import ProtectRouteEngineer from '../routes/ProtectRouteEngineer'
import AdminDashboard from '../pages/admin/AdminDashboard'
import HousekeeperDashboard from '../pages/housekeeper/HousekeeperDashboard'
import EngineerDashboard from '../pages/engineer/EngineerDashboard'
import AdminLogs from '../pages/admin/AdminLogs'

const router=createBrowserRouter([
    {
        path: import.meta.env.VITE_BASE_URL + '/login',
        element: <Login />
    },
    {
        path: import.meta.env.VITE_BASE_URL+'/',
        element: <></>,
        children: [
            { index: true, element: <></> },
        ]
    },
    {
        path: import.meta.env.VITE_BASE_URL+'/admin',
        element: <ProtectRouteAdmin element={<Layout />} />,
        children: [
            { index: true, element: <AdminDashboard /> },
            { path: "logs", element: <AdminLogs/> },
        ]
    },
    {
        path: import.meta.env.VITE_BASE_URL+'/housekeeper',
        element: <ProtectRouteHousekeeper element={<Layout />} />,
        children: [
            { index: true, element: <HousekeeperDashboard /> },
        ]
    },
    {
        path: import.meta.env.VITE_BASE_URL+'/engineer',
        element: <ProtectRouteEngineer element={<Layout />} />,
        children: [
            { index: true, element: <EngineerDashboard /> },
        ]
    },
],
)

const AppRoutes=() => {
    return (
        <>
            <RouterProvider router={router} basename={import.meta.env.VITE_BASE_URL} />
        </>
    )
}

export default AppRoutes