import React from 'react'
import { Outlet } from 'react-router-dom'
import MainNav from '../components/MainNav'

const Layout=() => {
    return (
        <>
            <MainNav />
            <div className='h-[calc(100vh-64px)] w-full p-4 bg-gray-100'>
                <Outlet />
            </div>
        </>
    )
}
export default Layout