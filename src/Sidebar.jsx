import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import TeamInfo from './TeamInfo';
import Cookies from 'js-cookie';
import settingImg from './img/gear.png';

const pullrequests = [
    { id: 1, name: 'fix: homepage loading #4' },
    { id: 2, name: 'feature: add homepage #3' }
];

const teamname = 'ghch';

const Sidebar = ({ toggleSettings, isSidebarOpen, toggleSidebar}) => {
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
                console.log(teams)
            } catch (error) {
                setError(error);
            }
        };

        fetchTeamMembers();
    }, [username]);


    return (
        <div className={`h-screen z-10 bg-gradient-to-b from-slate-200 to-indigo-100 flex flex-col items-start transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <button className="h-10 w-10 " onClick={toggleSidebar}>
                ☰
            </button>
            <div className={`w-[250px] p-1 h-full`}>
                <div className="flex flex-col text-center items-center mb-3">
                    <div className="w-14 h-14 rounded-full border-2 mb-3 border-black"></div>
                    <div className="text-black">我的團隊</div>
                </div>
                {teams.map(team => (
                    <TeamInfo teamName={teamname} pullrequests={pullrequests} team={team}/>
                ))}
                {/* <Link to="/team-overview" className="menu-item">
                    <div className="menu-title" onClick={() => toggleItem(1)}>
                        專案1
                        {openIndexes.includes(1) ? (
                            <img className="menu-right" src="down-chevron.png" alt="向下" />
                        ) : (
                            <img className="menu-right" src="right-chevron.png" alt="向右" />
                        )}
                    </div>
                    {openIndexes.includes(1) && (
                        <div className="submenu">
                            <div><Link to="/PRDiscussion">Pull request #1 討論區</Link></div>
                            <div><Link to="/PRDiscussion">Pull request #2 討論區</Link></div>

                        </div>
                    )}
                </Link> */}
                <div className="w-[250px] absolute bottom-3 flex ">
                    <Link to="/"> <button className="w-40 h-11 rounded-2xl bg-blue-800  text-white bg-opacity-70 shadow-lg ml-3 hover:bg-opacity-100">建立新團隊</button></Link>
                    <img className="w-10 h-10 ml-auto mr-4 mt-2 hover:cursor-pointer"  src={settingImg} onClick={toggleSettings}></img>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
