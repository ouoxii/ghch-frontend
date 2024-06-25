import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TeamInfo = ({ teamName, pullrequests }) => {
    const [open, setOpen] = useState(false);

    const toggleItem = () => {
        setOpen(preState => !preState);
    };

    return (
        <div className="block bg-slate-100 rounded-lg p-2 mb-2">
            <div className='flex items-center'>
                <Link to="/team-overview" className='flex-grow mb-1 ml-2'>
                    <div>{teamName}</div>
                </Link>
                {open ? (
                    <img className="ml-auto w-[20px] h-[20px]" src="down-chevron.png" alt="向下" onClick={() => toggleItem()} />
                ) : (
                    <img className="ml-auto w-[20px] h-[20px]" src="right-chevron.png" alt="向右" onClick={() => toggleItem()} />
                )}
            </div>
            {open && (
                <ul className="">
                    {pullrequests.map(pr => (
                        <li key={pr.id}><Link to={`/PRDiscussion`} className='hover:bg-sky-200 p-2 block transition duration-300 ease-in-out rounded-lg'>{pr.name}</Link></li>
                    ))}
                    {/* <div><Link to="/PRDiscussion">Pull request #1 討論區</Link></div>
                    <div><Link to="/PRDiscussion">Pull request #2 討論區</Link></div> */}
                </ul>
            )}
        </div>
    );
};

export default TeamInfo;
