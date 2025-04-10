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

const router=createBrowserRouter([
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/',
        element: <></>,
        children: [
            { index: true, element: <></> },
        ]
    },
    {
        path: '/admin',
        element: <ProtectRouteAdmin element={<Layout />} />,
        children: [
            { index: true, element: <AdminDashboard /> },
        ]
    },
    {
        path: '/housekeeper',
        element: <ProtectRouteHousekeeper element={<Layout />} />,
        children: [
            { index: true, element: <HousekeeperDashboard /> },
        ]
    },
    {
        path: '/engineer',
        element: <ProtectRouteEngineer element={<Layout />} />,
        children: [
            { index: true, element: <EngineerDashboard /> },
        ]
    },
])

const AppRoutes=() => {
    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}

export default AppRoutes