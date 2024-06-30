import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import downChevron from './img/down-chevron.png';
import rightChevron from './img/right-chevron.png';


const TeamInfo = ({pullrequests, team }) => {
    const [open, setOpen] = useState(false);

    const toggleItem = () => {
        setOpen(preState => !preState);
    };
    console.log(team)


    return (
        <div className="block bg-white bg-opacity-60 rounded-xl p-0 mb-2 mx-1 shadow-sm border-gray-300 border">
            <div className='flex items-center p-1.5 rounded-xl hover:bg-indigo-200'>
                <Link to={`/team-overview/?teamId=${team.teamId}`} className='flex-grow ml-2 font-red-hat'>
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
                        <li key={pr.id}><Link to={`/PRDiscussion?prId=id`} className=' hover:bg-indigo-200 py-1 pl-4 pr-2 block rounded-xl'>{pr.name}</Link></li>
                    ))}
                    {/* <div><Link to="/PRDiscussion">Pull request #1 討論區</Link></div>
                    <div><Link to="/PRDiscussion">Pull request #2 討論區</Link></div> */}
                </ul>
            )}
        </div>
    );
};

export default TeamInfo;
