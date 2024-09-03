import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import avatar from './img/avatar.jpg';
import Cookies from 'js-cookie';
const PRDiscussion = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const prNumber = queryParams.get('number');
    const { owner, repo } = location.state || {};
    const [PRData, setPRData] = useState({ number: '', state: '', description: '', head: '', base: '' });
    const token = Cookies.get('token');
    useEffect(() => {
        const fetchPRData = async () => {
            if (!owner || !repo || !prNumber) return;

            try {
                const prResponse = await fetch(`http://localhost:3001/pr/get?owner=${owner}&repo=${repo}&pull_number=${prNumber}&token=${token}`);
                if (!prResponse.ok) {
                    throw new Error('無法獲取PR資料');
                }
                const prData = await prResponse.json();
                setPRData(prData);
            } catch (error) {
                alert(error.message);
            }
        };

        fetchPRData();
    }, [owner, repo, prNumber]);

    return (
        <div className="container flex p-4">
            <div className="flex-grow p-4">
                <h1 className="text-2xl font-bold">
                    {repo} #{prNumber} {PRData.state}
                    {PRData.state === 'open' && (
                        <span className="bg-green-500 text-white text-lg px-3 py-1 rounded ml-3">Open</span>
                    )}
                    {PRData.state === 'closed' && (
                        <span className="bg-gray-500 text-white text-lg px-3 py-1 rounded ml-3">Closed</span>
                    )}
                </h1>

                <div className="flex flex-col w-full mt-5">
                    <div className="flex flex-col h-80 overflow-auto">
                        <div className="flex justify-between items-center mb-2">
                            <div className="w-16 h-16 rounded-full overflow-hidden">
                                <img src={avatar} alt="頭像" />
                            </div>
                            <div className="bg-gray-300 rounded-xl p-4 ml-3 flex-grow">
                                {PRData.description || '（自動生成之PR描述）'}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="bg-gray-300 rounded-xl p-4 mr-3 flex-grow">
                                我覺得...
                            </div>
                            <div className="w-16 h-16 rounded-full overflow-hidden">
                                <img src={avatar} alt="頭像" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col mt-5 w-full">
                        <textarea className="w-full h-24 p-3 mb-3 border border-gray-300 rounded-md" placeholder="文字輸入區"></textarea>
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded self-end w-24">Comment</button>
                    </div>
                </div>
            </div>
            <div className="w-36 flex-shrink-0 flex flex-col items-center bg-gray-700 p-5 rounded-xl">
                <h2 className="text-white mb-3">Reviewers</h2>
                <ul className="list-none p-0 w-full flex flex-col items-center">
                    <li className="bg-green-500 flex items-center justify-center w-12 h-12 rounded-full mb-2 text-white">reviewers1</li>
                    <li className="bg-green-500 flex items-center justify-center w-12 h-12 rounded-full mb-2 text-white">reviewers2</li>
                    <li className="bg-red-600 flex items-center justify-center w-12 h-12 rounded-full mb-2 text-white">reviewers3</li>
                    <li className="bg-gray-300 flex items-center justify-center w-12 h-12 rounded-full cursor-pointer text-black text-2xl">+</li>
                </ul>
            </div>
        </div>
    );
};

export default PRDiscussion;
