import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TeamInfo from './TeamInfo';
import Cookies from 'js-cookie';
import settingImg from './img/gear.png';
import notificationBellImg from './img/notification.png';
import { DataContext } from './DataContext';

const Sidebar = ({ toggleSettings, isSidebarOpen, toggleSidebar }) => {
    const { teams, notifications, fetchNotifications } = useContext(DataContext);
    const username = Cookies.get('username');
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const toggleNotification = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen) {
            fetchNotifications();
        }
    };

    return (
        <div className={`h-screen z-10 bg-slate-600 flex flex-col items-start transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <button className="h-10 w-10 text-white" onClick={toggleSidebar}>
                ☰
            </button>
            <div className={`w-[250px] p-1 h-full`}>
                <div className="flex flex-col text-center items-center mb-3">
                    <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                        <img src={`https://avatars.githubusercontent.com/${username}`} alt="" />
                    </div>
                    <div className="text-white">{username}</div>
                </div>
                <div className='h-[85%] overflow-auto'>
                    {teams.map(team => (
                        <TeamInfo key={team.id} team={team} />
                    ))}
                </div>
                <div className="w-[250px] absolute bottom-2 flex items-center">
                    <Link to="/">
                        <button className="w-32 h-11 rounded-2xl bg-buttonBlue text-white shadow-lg ml-2 hover:bg-buttonBlue-light transition">建立新團隊</button>
                    </Link>
                    <div className="relative w-12 h-12 flex justify-center items-center ml-2">
                        <img src={notificationBellImg} onClick={toggleNotification} className="w-8 h-8 cursor-pointer" alt="通知" />
                        <span className="bg-red-500 w-4 h-4 rounded-full text-white text-xs flex justify-center items-center absolute -right-1 -top-1">{notifications.length}</span>
                    </div>
                    <img className="w-9 h-9 ml-auto mr-4 hover:cursor-pointer" src={settingImg} onClick={toggleSettings} alt="設定" />
                </div>
            </div>
            {isNotificationOpen && (
                <div className="fixed bottom-20 right-4 z-40 bg-white rounded shadow-lg p-4">
                    <div className="relative">
                        <span className="close-button cursor-pointer absolute top-2 right-2" onClick={toggleNotification}>&times;</span>
                        <h2 className="text-2xl font-bold mb-4">通知</h2>
                        <ul className="notification-list">
                            {notifications.map((notification, index) => (
                                <li key={index} className="mb-2">
                                    {notification.teamName}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
