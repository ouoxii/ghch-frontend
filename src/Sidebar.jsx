import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import TeamInfo from './TeamInfo';
import Cookies from 'js-cookie';

const pullrequests = [
    { id: 1, name: 'fix: homepage loading #4' },
    { id: 2, name: 'feature: add homepage #3' }
];

const teamname = 'ghch';

const Sidebar = ({ toggleSettings }) => {
    const [openIndexes, setOpenIndexes] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [teams, setTeam] = useState([]);
    const [error, setError] = useState(null);

    const toggleItem = (index) => {
        setOpenIndexes(prevIndexes =>
            prevIndexes.includes(index)
                ? prevIndexes.filter(i => i !== index)
                : [...prevIndexes, index]
        );
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

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
        <>
            <button className="menu-icon" onClick={toggleSidebar}>
                ☰
            </button>
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="profile-section">
                    <div className="avatar"></div>
                    <div className="profile-text">我的團隊</div>
                </div>
                {teams.map(team => (
                    <TeamInfo teamName={teamname} pullrequests={pullrequests} team={team}/>
                ))}
                <Link to="/team-overview" className="menu-item">
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
                </Link>
                {/* <Link to="#" className="menu-item" onClick={() => toggleItem(2)}>
                    <div className="menu-title">
                        專案2
                        {openIndexes.includes(2) ? (
                            <img className="menu-right" src="down-chevron.png" alt="向下" />
                        ) : (
                            <img className="menu-right" src="right-chevron.png" alt="向右" />
                        )}
                    </div>
                    {openIndexes.includes(2) && (
                        <div className="submenu">
                            <div>Pull request #1 討論區</div>
                            <div>Pull request #2 討論區</div>
                        </div>
                    )}
                </Link> */}
                <div className="settings">
                    <Link to="/"> <button className="create-team-button">建立新團隊</button></Link>
                    <div className="settings-icon" onClick={toggleSettings}></div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
