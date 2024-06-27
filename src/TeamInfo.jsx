import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import downChevron from './img/down-chevron.png';
import rightChevron from './img/right-chevron.png';


const TeamInfo = ({ teamName, pullrequests, team }) => {
    const [open, setOpen] = useState(false);

    const toggleItem = () => {
        setOpen(preState => !preState);
    };
    console.log(team)


    return (
        <div className="block bg-slate-50 rounded-lg p-0 mb-2 mx-1 border shadow-sm">
            <div className='flex items-center p-2 rounded-lg hover:bg-zinc-200'>
                <Link to={`/team-overview/?teamId=${team.teamId}`} className='flex-grow  mb-1 ml-2 '>
                    <div>{team.teamName}</div>
                </Link>
                {open ? (
                    <img className="ml-auto w-[20px] h-[20px]" src={downChevron} alt="向下" onClick={() => toggleItem()} />
                ) : (
                    <img className="ml-auto w-[20px] h-[20px]" src={rightChevron} alt="向右" onClick={() => toggleItem()} />
                )}
            </div>
            {open && (
                <ul >
                    {pullrequests.map(pr => (
                        <li key={pr.id} className><Link to={`/PRDiscussion?prId=id`} className=' hover:bg-blue-200 p-2 block rounded-lg'>{pr.name}</Link></li>
                    ))}
                    {/* <div><Link to="/PRDiscussion">Pull request #1 討論區</Link></div>
                    <div><Link to="/PRDiscussion">Pull request #2 討論區</Link></div> */}
                </ul>
            )}
        </div>
    );
};

export default TeamInfo;
