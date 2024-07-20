import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import './Sidebar.css';
import SidebarTeamInfo from './SidebarTeamInfo';
import Cookies from 'js-cookie';
import settingImg from './img/gear.png';
import notificationBellImg from './img/notification.png';
import checkImg from './img/check.png';
import closeImg from './img/close.png';
import { DataContext } from './DataContext';

const Sidebar = ({ toggleSettings, isSidebarOpen, toggleSidebar }) => {
    const { teams, notifications, fetchNotifications, autoUpdateNotification, acceptInvitation, rejectInvitation } = useContext(DataContext);
    const username = Cookies.get('username');
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    useEffect(() => {
        const id = autoUpdateNotification();
        return () => {
            if (id) {
                clearInterval(id);
            }
        }
    }, [])
    //autoUpdateNotification();

    const toggleNotification = () => {
        setIsNotificationOpen(!isNotificationOpen);
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
                        <SidebarTeamInfo team={team} />
                    ))}
                </div>
                <div className="w-[250px] absolute bottom-2 flex items-center">
                    <Link to="/">
                        <button className="w-32 h-11 mb-1 rounded-2xl bg-buttonBlue text-white shadow-lg ml-2 hover:bg-buttonBlue-light transition">建立新團隊</button>
                    </Link>
                    <div className="relative w-12 h-11 flex justify-center items-center ml-3">
                        <img src={notificationBellImg} onClick={toggleNotification} className="w-8 h-8 cursor-pointer" alt="通知" />
                        {notifications.length !== 0 && (<span className="bg-red-500 w-4 h-4 rounded-full text-white text-xs flex justify-center items-center absolute -right-1 -top-1">
                            {notifications.length}</span>)}
                    </div>
                    <img className="w-8 h-8 ml-auto mr-4 hover:cursor-pointer" src={settingImg} onClick={toggleSettings} alt="設定" />
                </div>
            </div>
            {isNotificationOpen && (
                <div className="fixed bottom-20 left-4 z-40 w-56 bg-gray-50 rounded-lg shadow-lg px-2 pb-3">
                    <div className="flex flex-col">
                        <div className='flex items-start'>
                            <h2 className="font-bold mt-4 ml-2">團隊邀請</h2>
                            <span className="cursor-pointer ml-auto text-xl" onClick={toggleNotification}>&times;</span>
                        </div>
                        <ul className="">
                            {notifications.map((notification, index) => (
                                <li key={index} className="flex justify-between items-center mt-3">
                                    <div className='ml-2 text-xl w-20 overflow-hidden'>{notification.teamName}</div>
                                    <div className="flex">
                                        {/* <img src={checkImg} alt="接受" className="w-5 h-5 cursor-pointer mr-2" onClick={() => acceptInvitation(notification, notification.id)} />
                                        <img src={closeImg} alt="拒絕" className="w-5 h-5 cursor-pointer" onClick={() => rejectInvitation(notification.id)} /> */}
                                        <button className='bg-blue-500 text-white rounded-md px-2 py-1 mr-1 hover:bg-blue-700' onClick={() => acceptInvitation(notification, notification.id)}>確認</button>
                                        <button className='bg-red-500 text-white rounded-md px-2 py-1 hover:bg-red-700' onClick={() => rejectInvitation(notification, notification.id)}>刪除</button>
                                    </div>
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
