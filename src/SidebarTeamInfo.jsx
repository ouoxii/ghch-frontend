import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import downChevron from './img/down-chevron.png';
import rightChevron from './img/right-chevron.png';


const SidebarTeamInfo = ({ team }) => {
    const [open, setOpen] = useState(false);
    const [repos, setRepos] = useState([]);
    // console.log(repos)

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                // console.log(team)
                const response = await fetch(`http://localhost:8081/team-repos/${team.teamId}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setRepos([]); // 清空 repos
                        throw new Error('Team repos not found');
                    } else {
                        throw new Error('Network response was not ok');
                    }
                }
                const data = await response.json();
                setRepos(data);
            } catch (error) {
                console.log(error);
            }
        };

        fetchTeamMembers();
    }, [team]);

    const toggleItem = () => {
        setOpen(preState => !preState);
    };


    return (
        <div className="flex-col bg-slate-100 rounded-xl p-0 mb-2 mx-1 shadow-sm border">
            <div className='flex items-center p-1.5 rounded-xl hover:bg-zinc-300'>
                <Link to={`/teamRepo/?teamId=${team.teamId}`} className='flex-grow  mb-1 ml-2 font-red-hat'>

                    <div className='w-40 overflow-hidden'>{team.teamName}</div>
                </Link>
                {open ? (
                    <img className="ml-auto w-[20px] h-[20px]" src={downChevron} alt="向下" onClick={() => toggleItem()} />
                ) : (
                    <img className="ml-auto w-[20px] h-[20px]" src={rightChevron} alt="向右" onClick={() => toggleItem()} />
                )}
            </div>
            {open && (
                <ul>
                    {repos.map(repo => (
                        <li key={repo.id}><Link to={`/team-overview/?repoId=${repo.id}&repoName=${repo.repoName}&teamName=${repo.teamName}&teamId=${team.teamId}`} className=' hover:bg-zinc-300 py-1 px-4 mb-1 mx-1 block rounded-xl font-red-hat'>{repo.repoName}</Link></li>
                    ))}
                    {/* <div><Link to="/PRDiscussion">Pull request #1 討論區</Link></div>
                    <div><Link to="/PRDiscussion">Pull request #2 討論區</Link></div> */}
                </ul>
            )}
        </div>
    );
};

export default SidebarTeamInfo;
