import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

const PRDiscussion = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const prNumber = queryParams.get('number');
    const title = queryParams.get('title');
    const { owner, repo, teamName } = location.state || {};
    const [PRData, setPRData] = useState({ number: '', state: '', description: '', head: '', base: '' });
    const [commentData, setCommentData] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [reviewers, setReviewers] = useState([
        { user: 'fakeReviewer1', state: 'APPROVED' },
        { user: 'fakeReviewer2', state: 'CHANGES_REQUESTED' },
        { user: 'fakeReviewer3', state: 'COMMENTED' },
    ]);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [showNewBlock, setShowNewBlock] = useState(false);
    const [selectedReviewers, setSelectedReviewers] = useState([]);
    const token = Cookies.get('token');

    useEffect(() => {
        const fetchPRData = async () => {
            if (!owner || !repo || !prNumber) return;

            setLoading(true);

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

            try {
                const prComments = await fetch(`http://localhost:3001/pr/comments?owner=${owner}&repo=${repo}&pull_number=${prNumber}&token=${token}`);
                if (!prComments.ok) {
                    throw new Error('無法獲取PR comments資料');
                }
                const comments = await prComments.json();
                setCommentData(comments);
            } catch (error) {
                alert(error.message);
            }

            try {
                const prReviews = await fetch(`http://localhost:3001/pr/reviewers?owner=${owner}&repo=${repo}&pull_number=${prNumber}&token=${token}`);
                if (!prReviews.ok) {
                    throw new Error('無法獲取PR reviewers資料');
                }
                const reviewsData = await prReviews.json();

                const reviewersStatus = reviewsData.map((review) => ({
                    user: review.user.login,
                    state: review.state,
                }));
                setReviewers(reviewersStatus);
            } catch (error) {
                alert(error.message);
            }

            try {
                const teamMembersResponse = await fetch(`http://localhost:8081/team-members?teamName=${teamName}`, {});
                setTeamMembers(teamMembersResponse.ok ? await teamMembersResponse.json() : []);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPRData();
    }, [owner, repo, prNumber]);

    const handleCommentSubmit = async () => {
        if (!newComment) {
            alert("評論內容不能為空");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/pr/comment?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    owner,
                    repo,
                    pull_number: prNumber,
                    body: newComment,
                }),
            });

            if (!response.ok) {
                throw new Error('無法提交評論');
            }

            const newCommentData = await response.json();
            setCommentData([...commentData, newCommentData]);
            setNewComment('');
        } catch (error) {
            alert(error.message);
        }
    };

    const handleAddReviewerClick = () => {
        setShowNewBlock(!showNewBlock);
    };

    // 選中 reviewer 的處理函數
    const handleSelectReviewer = (username) => {
        setSelectedReviewers((prevSelected) =>
            prevSelected.includes(username)
                ? prevSelected.filter((reviewer) => reviewer !== username)
                : [...prevSelected, username]
        );
    };

    // 發送邀請請求的處理函數
    const handleRequestReviewers = async () => {
        try {
            const response = await fetch(`http://localhost:3001/pr/invite-reviewer?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    owner,
                    repo,
                    pull_number: prNumber,
                    reviewers: selectedReviewers,
                }),
            });

            if (!response.ok) {
                throw new Error('無法邀請 reviewers');
            }

            alert('成功邀請 reviewers！');
            setSelectedReviewers([]);  // 邀請成功後清空選中的 reviewers
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="container flex p-4">
            {loading ? (
                <div role="status" className="flex justify-center items-center w-full h-full">
                    <svg aria-hidden="true" className="w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                    </svg>
                    <span className="sr-only">Loading...</span>
                </div>
            ) : (
                <div className="flex-grow p-4">
                    <h1 className="text-2xl font-bold">
                        {title} #{prNumber}
                        {PRData.state === 'open' && (
                            <span className="bg-green-500 text-white text-lg px-3 py-1 rounded ml-3">Open</span>
                        )}
                        {PRData.state === 'closed' && (
                            <span className="bg-gray-500 text-white text-lg px-3 py-1 rounded ml-3">Closed</span>
                        )}
                    </h1>

                    <div className="flex flex-col w-full mt-5">
                        <div className="flex flex-col h-80 overflow-auto">
                            {commentData.length > 0 ? (
                                commentData.map(comment => (
                                    <div key={comment.id} className="flex justify-between items-center mb-2">
                                        <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                                            <img src={`https://avatars.githubusercontent.com/${comment.user}`} alt="" />
                                        </div>
                                        <div className="bg-gray-300 rounded-xl p-4 ml-3 flex-grow">
                                            <p><strong>{comment.user}</strong> <span className="text-sm text-gray-500">({new Date(comment.created_at).toLocaleString()})</span></p>
                                            <p>{comment.body}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>尚無評論</p>
                            )}
                        </div>
                        <div className="flex flex-col mt-5 w-full">
                            <textarea
                                className="w-full h-24 p-3 mb-3 border border-gray-300 rounded-md"
                                placeholder="輸入評論"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded self-end w-24"
                                onClick={handleCommentSubmit}
                            >
                                Comment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-36 flex-shrink-0 flex flex-col items-center bg-gray-700 p-5 rounded-xl">
                <h2 className="text-white mb-3">Reviewers</h2>
                <ul className="list-none p-0 w-full flex flex-col items-center">
                    {reviewers.length > 0 ? (
                        reviewers.map((reviewer, index) => (
                            <li
                                key={index}
                                className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center text-white ${reviewer.state === 'APPROVED' ? 'bg-green-500' : reviewer.state === 'CHANGES_REQUESTED' ? 'bg-red-600' : 'bg-yellow-400'
                                    }`}
                            >
                                {reviewer.user}
                            </li>
                        ))
                    ) : (
                        <p>尚無 reviewer</p>
                    )}
                    <li className="bg-gray-300 flex items-center justify-center w-12 h-12 rounded-full cursor-pointer text-black text-2xl" onClick={handleAddReviewerClick}>+</li>
                </ul>
            </div>

            {showNewBlock && (
                <div className="flex-shrink-0 bg-blue-100 p-5 rounded-xl mt-4" style={{ width: '20%' }}>
                    <h3 className="text-xl font-bold">邀請 reviewer</h3>
                    <ul>
                        {teamMembers.map((teamMember) => (
                            <li
                                key={teamMember.id}
                                className={`flex items-center mb-2 p-2 rounded ${selectedReviewers.includes(teamMember.username) ? 'bg-green-200' : ''}`}
                            >
                                <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                                    <img src={`https://avatars.githubusercontent.com/${teamMember.username}`} alt="" />
                                </div>
                                <span className="p-3 ml-2">{teamMember.username}</span>
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 ml-2 rounded"
                                    onClick={() => handleSelectReviewer(teamMember.username)}
                                >
                                    {selectedReviewers.includes(teamMember.username) ? '✔' : '+'}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
                        onClick={handleRequestReviewers}
                        disabled={selectedReviewers.length === 0}  // 如果沒有選中 reviewers，按鈕禁用
                    >
                        REQUEST
                    </button>
                </div>
            )}
        </div>
    );
};

export default PRDiscussion;
