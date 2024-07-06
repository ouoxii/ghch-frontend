import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
// import './Sidebar.css';
import SidebarTeamInfo from './SidebarTeamInfo';
import Cookies from 'js-cookie';
import settingImg from './img/gear.png';

import { DataContext } from './DataContext';


const Sidebar = ({ toggleSettings, isSidebarOpen, toggleSidebar }) => {

    const { teams, fetcTeamhData, addTeamdata, deleteTeamData } = useContext(DataContext);
    const username = Cookies.get('username');

    return (
        <div className={`h-screen z-10 bg-slate-600 flex flex-col items-start transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <button className="h-10 w-10 text-white" onClick={toggleSidebar}>
                ☰
            </button>
            <div className={`w-[250px] p-1 h-full`}>
                <div className="flex flex-col text-center items-center mb-3">

                    <div className="text-white">{username}</div>
                </div>
                <div className='h-[85%] overflow-auto'>
                    {teams.map(team => (
                        <SidebarTeamInfo team={team} />
                    ))}
                </div>
                <div className="w-[250px] absolute bottom-2 flex items-center ">
                    <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                        <img src={`https://avatars.githubusercontent.com/${username}`} alt="" />
                    </div>
                    <Link to="/"> <button className="w-32 h-11 rounded-2xl bg-buttonBlue text-white shadow-lg ml-2 hover:bg-buttonBlue-light transition">建立新團隊</button></Link>
                    <img className="w-9 h-9 ml-auto mr-4 hover:cursor-pointer" src={settingImg} onClick={toggleSettings} alt=''></img>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
