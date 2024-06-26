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
        <div className={`h-screen z-10 bg-slate-100 flex flex-col items-start  transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <button className="h-10 w-10 " onClick={toggleSidebar}>
                ☰
            </button>
            <div className={`w-[250px] p-1 h-full`}>
                <div className="profile-section">
                    <div className="avatar"></div>
                    <div className="profile-text">我的團隊</div>
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
                <div className="settings">
                    <Link to="/"> <button className="create-team-button">建立新團隊</button></Link>
                    <img className="w-10 h-10"  src={settingImg} onClick={toggleSettings}></img>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
