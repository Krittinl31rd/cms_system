import React from 'react'
import { Link } from 'react-router-dom'
import useCmsStore from '../store/cmsstore';
import { useNavigate } from 'react-router-dom'

const MainNav=() => {
    const navigate=useNavigate()
    const { member, actionLogout }=useCmsStore((state) => state);

    const handleLogout=() => {
        actionLogout();
        navigate('/login');
    }
    return (
        <nav className="bg-white shadow-xl">
            <div className="mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-4">
                        <Link to={member?.role=='admin'? '/admin':
                            member?.role=='houserkeeper'? '/housekeeper':
                                member?.role=='engineer'? '/engineer':''} className="text-2xl font-bold mr-4">
                            CMS SYSTEM
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <h3 className='font-bold'> {member?.email} | {member?.role} </h3>
                        <div onClick={handleLogout}
                            className="cursor-pointer flex justify-center items-center w-24 h-9 bg-black hover:bg-black/80 text-white font-semibold rounded-lg">
                            <span className="font-semibold">Logout</span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
export default MainNav