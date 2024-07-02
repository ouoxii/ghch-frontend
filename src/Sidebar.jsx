import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import './Sidebar.css';
import TeamInfo from './TeamInfo';
import Cookies from 'js-cookie';
import settingImg from './img/gear.png';


const Sidebar = ({ toggleSettings, isSidebarOpen, toggleSidebar }) => {
    const [teams, setTeam] = useState([]);
    const [error, setError] = useState(null);



    const username = Cookies.get('username');

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const response = await fetch(`http://localhost:8081/team-members/${username}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setTeam(data);
            } catch (error) {
                setError(error);
            }
        };

        fetchTeamMembers();
    }, [username]);


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
                        <TeamInfo team={team} />
                    ))}
                </div>
                <div className="w-[250px] absolute bottom-2 flex items-center ">
                    <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                        <img src={`https://avatars.githubusercontent.com/${username}`} alt="" />
                    </div>
                    <Link to="/"> <button className="w-32 h-11 rounded-2xl bg-buttonBlue text-white shadow-lg ml-2 hover:bg-buttonBlue-light transition">建立新團隊</button></Link>
                    <img className="w-9 h-9 ml-auto mr-4 hover:cursor-pointer" src={settingImg} onClick={toggleSettings}></img>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
