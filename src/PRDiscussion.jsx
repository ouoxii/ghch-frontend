import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import merge from './img/merge.png';
import AssistnatBox from './AssistantBox';

const PRDiscussion = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const prNumber = queryParams.get('number');
    const title = queryParams.get('title');
    const { owner, repo, teamName } = location.state || {};
    const [PRData, setPRData] = useState({ number: '', state: '', description: '', head: '', base: '', creator: '', created_at: '' });
    const [commentData, setCommentData] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [reviewers, setReviewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [showNewBlock, setShowNewBlock] = useState(false);
    const [userVote, setUserVote] = useState(null);
    const [selectedReviewers, setSelectedReviewers] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [reviewerState, setReviewerState] = useState(null);
    const token = Cookies.get('token');

    useEffect(() => {
        const fetchPRData = async () => {
            if (!owner || !repo || !prNumber || !teamName) return;

            setLoading(true);

            try {
                const prResponse = await fetch(`http://localhost:3001/pr/get?owner=${owner}&repo=${repo}&pull_number=${prNumber}&token=${token}`);
                if (!prResponse.ok) {
                    throw new Error('無法獲取PR資料');
                }
                const prData = await prResponse.json();
                console.log('PR Creator:', prData.creator);
                setPRData(prData); // 設置狀態

                // 檢查更新時間
                const updatedAtResponse = await fetch(`http://localhost:3001/pr/check-updated-at?owner=${owner}&repo=${repo}&pull_number=${prNumber}&token=${token}`);
                if (!updatedAtResponse.ok) {
                    throw new Error('無法檢查更新時間');
                }
                const updatedAtData = await updatedAtResponse.json();

                // 使用prData來進行更新時間的比較
                if (prData.created_at !== updatedAtData.updated_at) {
                    // alert('Contributor 已修改此分支，請重新投票！');

                    // // 將所有reviewers的status改成pending
                    // const updateReviewersResponse = await fetch(`http://localhost:3001/pr/reviewers/update-status?owner=${owner}&repo=${repo}&pull_number=${prNumber}&token=${token}`, {
                    //     method: 'PUT',
                    //     headers: {
                    //         'Content-Type': 'application/json',
                    //     },
                    //     body: JSON.stringify({ state: 'PENDING' }) // 將所有reviewers的狀態改成PENDING
                    // });

                    // if (!updateReviewersResponse.ok) {
                    //     throw new Error('無法更新reviewers狀態');
                    // }

                    // console.log('所有reviewers狀態已更新為PENDING');
                }

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
                    user: review.user,
                    state: review.state,
                    review_id: review.review_id,
                }));

                console.log('Reviewers:', reviewersStatus);
                setReviewers(reviewersStatus);

                const currentReviewer = reviewersStatus.find(
                    (reviewer) => reviewer.user === Cookies.get('username')
                );
                if (currentReviewer) {
                    setReviewerState(currentReviewer.state);
                }
            } catch (error) {
                alert(error.message);
            }


            try {
                // 獲取 PR 評論
                const prComments = await fetch(`http://localhost:3001/pr/comments?owner=${owner}&repo=${repo}&pull_number=${prNumber}&token=${token}`);
                if (!prComments.ok) {
                    throw new Error('無法獲取PR comments資料');
                }
                const comments = await prComments.json();

                const aiCommentResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/reviews/search?&repoName=${repo}&pullNumber=${prNumber}`);
                if (!aiCommentResponse.ok) {
                    throw new Error('無法獲取AI PR comments資料');
                }
                const aiComment = await aiCommentResponse.json();

                const combinedComments = [];
                const reviewers = []; // 確保 reviewers 在此重新初始化

                for (const comment of comments) {
                    combinedComments.push({
                        id: comment.id,
                        user: comment.user.login,
                        created_at: comment.created_at,
                        body: comment.body,
                    });
                }

                if (aiComment) {
                    // 在這裡推入 AI reviewer 的資料
                    combinedComments.push({
                        id: aiComment.id || "AI-001",
                        user: "AI Reviewer",
                        created_at: aiComment.createdAt || new Date().toISOString(),
                        body: (aiComment.mergeApproval ? "Approved the changes" : "Requested changes"),
                    });
                    combinedComments.push({
                        id: aiComment.id || "AI-001",
                        user: "AI Reviewer",
                        created_at: aiComment.createdAt || new Date().toISOString(),
                        body: aiComment.content,
                    });

                    // 確保 AI reviewer 的資料被正確加入 reviewers 陣列
                    reviewers.push({ user: "AI Reviewer", state: aiComment.mergeApproval });
                }

                // 在此設置 review 和 comment 資料
                setReviewers(prevReviewers => [...prevReviewers, ...reviewers]);
                setCommentData(combinedComments);
            } catch (error) {
                alert(error.message);
            }


            try {
                console.log(teamName)
                const teamMembersResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/team-members?teamName=${teamName}`, {});
                setTeamMembers(teamMembersResponse.ok ? await teamMembersResponse.json() : []);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPRData();

    }, [owner, repo, prNumber]);
    useEffect(() => {
        const getUserRole = () => {


            if (PRData.creator === Cookies.get('username')) return 'Contributor';
            if (owner === Cookies.get('username')) return 'Admin';
            if (reviewers.some(reviewer => reviewer.user === Cookies.get('username'))) return 'Reviewer';

            return 'Commenter';
        };

        const role = getUserRole();
        setUserRole(role);
        console.log('User Role:', role);
    }, [reviewers, PRData]);

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

    const handleSelectReviewer = (username) => {
        setSelectedReviewers((prevSelected) =>
            prevSelected.includes(username)
                ? prevSelected.filter((reviewer) => reviewer !== username)
                : [...prevSelected, username]
        );
    };
    const isReviewerOrAuthor = (username) => {
        return username === PRData.creator || reviewers.some(reviewer => reviewer.user === username);
    };

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
            setSelectedReviewers([]);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleVote = async (vote) => {
        try {
            // 提交投票請求
            const voteResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/pr-votes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    repoOwner: owner,
                    repoName: repo,
                    pullNumber: prNumber,
                    reviewer: Cookies.get('username'),  // 用戶名稱
                    accept: vote,
                }),
            });

            if (!voteResponse.ok) {
                throw new Error('無法提交投票');
            }

            // 如果投票成功，接著創建審查 (Review)
            const reviewResponse = await fetch(`http://localhost:3001/pr/create-review?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    owner,
                    repo,
                    pull_number: prNumber,  // PR 編號
                    body: vote ? "Approved the changes" : "Requested changes", // 根據投票結果提交不同的審查內容
                    event: vote ? "APPROVE" : "REQUEST_CHANGES" // 審查類型 (APPROVE 或 REQUEST_CHANGES)
                }),
            });

            if (!reviewResponse.ok) {
                throw new Error('無法創建審查');
            }

            const reviewResult = await reviewResponse.json();
            console.log('審查已創建成功:', reviewResult);

            alert(`您已${vote ? '同意' : '拒絕'}此 PR 並提交了審查！`);
            setUserVote(vote);  // 記錄用戶的投票狀態
            setReviewerState(vote ? 'APPROVED' : 'CHANGES_REQUESTED');  // 更新 reviewer 狀態
        } catch (error) {
            alert(error.message);
        }
    };

    // 新增合併 PR 的事件處理函數
    const handleMergePR = async () => {
        try {
            const mergeResponse = await fetch(`http://localhost:3001/pr/merge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    owner,
                    repo,
                    pull_number: prNumber,
                    commit_title: `Merged PR #${prNumber}: ${PRData.title}`,  // Commit 標題
                    commit_message: 'This merge was performed using the GHCH.',  // Commit 訊息
                    token: token
                }),
            });

            if (!mergeResponse.ok) {
                throw new Error('無法合併 PR');
            }

            const mergeResult = await mergeResponse.json();
            console.log('合併結果:', mergeResult);

            const uploadBranchRes = await fetch(`http://localhost:8080/branch/upload/${owner}/${repo}?branch=${PRData.head}`, {
                method: 'POST'
            });
            if (!uploadBranchRes.ok) {
                throw new Error('更新分支到雲端資料時出錯');
            }

            alert(`成功合併 PR #${prNumber}！`);
            setPRData({ ...PRData, state: 'closed' });  // 更新 PR 狀態為 closed
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteBranch = async () => {
        try {
            const deleteBranchRes = await fetch(`http://localhost:3001/branch/delete?token=${token}&owner=${owner}&repo=${repo}&ref=${PRData.head}`, {
                method: 'POST'
            });

            if (!deleteBranchRes.ok) {
                throw new Error('刪除分支失敗');
            }

            alert(`成功刪除分支:${PRData.head}`);
        } catch (error) {
            alert(error.message);
        }
    };

    const checkReviewer = () => {
        return reviewers.every(reviewer => reviewer.state === 'APPROVED') ? 1 : 0;
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
                <div className="flex-grow p-4 relative">
                    <h1 className="text-2xl font-bold flex">
                        {title} #{prNumber} created_at {new Date(PRData.created_at).toLocaleString()}
                        {PRData.state === 'open' && (
                            <span className="flex items-center bg-green-500 text-white text-lg px-3 py-1 rounded-2xl ml-3 max-w-max">
                                <img className="w-4 h-4 mr-2" src={merge} alt="Merge icon" />
                                Open
                            </span>
                        )}
                        {PRData.state === 'closed' && (
                            <span className="bg-gray-500 text-white text-lg px-3 py-1 rounded-2xl ml-3 max-w-max">
                                Closed
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 mt-2"> {PRData.creator} 希望將 {PRData.head} 合併到 {PRData.base} </p>
                    {/* 新增合併 PR 按鈕 */}
                    {userRole === 'Contributor' && PRData.state === 'open' && reviewers.every(reviewer => reviewer.state === 'APPROVED') ?
                        (
                            <div className="flex mt-3">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-3"
                                    onClick={handleMergePR}
                                >
                                    合併 PR
                                </button>
                            </div>
                        ) : userRole === 'Contributor' && PRData.state === 'closed' ?
                            (
                                <div className="flex mt-3">
                                    <button
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-3"
                                        onClick={handleDeleteBranch}
                                    >
                                        刪除分支
                                    </button>
                                </div>
                            ) : null
                    }
                    {/* 新增投票按鈕 */}
                    {reviewerState === 'PENDING' ? (userRole === 'Reviewer' && PRData.state === 'open' && (
                        < div className="flex mt-3">
                            <button
                                className={`bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded mr-3`}
                                onClick={() => handleVote(true)}
                                disabled={reviewerState !== 'PENDING'}
                            >
                                同意
                            </button>
                            <button
                                className={`bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded mr-3`}
                                onClick={() => handleVote(false)}
                                disabled={reviewerState !== 'PENDING'}
                            >
                                拒絕
                            </button>
                        </div>
                    )) : (
                        < div className="flex">
                            {reviewerState === "CHANGES_REQUESTED" ? "您已經拒絕了" : ""}
                            {reviewerState === "APPROVED" ? "您已經同意了" : ""}
                        </div>
                    )}
                    <div className="flex flex-col w-full h-3/5 overflow-auto mt-3">
                        <div className="flex flex-col ">
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
                    </div>
                    <div className="flex flex-col w-1/2 ml-14">
                        <textarea
                            className="w-full h-20 p-3 mb-3 border border-gray-300 rounded-md mt-3"
                            placeholder="輸入評論"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button
                            className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-5 py-2.5 text-center me-2 mb-2 rounded-md self-end "
                            onClick={handleCommentSubmit}
                        >
                            Comment
                        </button>
                    </div>
                    <div className='absolute bottom-6 right-10'>
                        {userRole === 'Contributor' && reviewers.length === 1 && reviewers[0].user === 'AI Reviewer' ? (<AssistnatBox text="請新增reviwer對PR進行檢視。" />)
                            : userRole === 'Contributor' && PRData.state === 'closed' ? (<AssistnatBox text="PR已合併完畢請刪除分支。" />)
                                : userRole === 'Contributor' && checkReviewer() ? (<AssistnatBox text="所有reviewer已同意PR合併，請按下合併按鈕。" />)
                                    : userRole === 'Contributor' ? (<AssistnatBox text="等待所有reviewer同意PR合併。" />)
                                        : userRole === 'Reviewer' && reviewerState === 'PENDING' ? (<AssistnatBox text="請在檢視PR後決定是否同意合併。" />)
                                            : userRole === 'Reviewer' ? (<AssistnatBox text="您已投票完畢，可以在評論區發表你的看法。" />)
                                                : null
                        }

                    </div>
                </div>
            )}

            <div className="w-45 flex-shrink-0 flex flex-col items-center bg-gray-700 p-5 rounded-xl">
                <h2 className="text-white mb-3">Reviewers</h2>
                <ul className="list-none p-0 w-full flex flex-col items-center">
                    {reviewers.length > 0 ? (
                        reviewers.map((reviewer, index) => (
                            <li
                                key={index}
                                className="flex items-center mb-2"
                            >
                                {/* 左側審查者頭像 */}
                                <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                                    <img src={`https://avatars.githubusercontent.com/${reviewer.user}`} alt={reviewer.user} />
                                </div>

                                {/* 審查者名稱與狀態 */}
                                <div className="flex items-center ml-3">
                                    <span className="font-bold">{reviewer.user}</span>
                                    <div
                                        className={`ml-2 w-4 h-4 rounded-full ${reviewer.state === 'APPROVED'
                                            ? 'bg-green-500'
                                            : reviewer.state === 'CHANGES_REQUESTED'
                                                ? 'bg-red-600'
                                                : 'bg-yellow-400'}`}
                                    >
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <p>尚無 reviewer</p>
                    )}
                    {userRole === 'Contributor' && (
                        <li className="bg-gray-300 flex items-center justify-center w-12 h-12 rounded-full cursor-pointer text-black text-2xl" onClick={handleAddReviewerClick}>+</li>)}
                </ul>
            </div>

            {
                showNewBlock && (
                    <div className="absolute right-64 top-32 w-52 h-72 bg-blue-100 p-5 rounded-xl mt-4 shadow-lg overflow-auto justify-center">
                        <h3 className="text-xl font-bold">邀請 reviewer</h3>
                        <ul>
                            {teamMembers
                                .filter((teamMember) => teamMember.username !== PRData.creator) // 過濾掉創建者
                                .filter((teamMember) => !reviewers.some(reviewer => reviewer.user === teamMember.username)) // 過濾掉已經是 reviewer 的成員
                                .map((teamMember) => (
                                    <li
                                        key={teamMember.id}
                                        className={`flex items-center mb-2 p-2 rounded cursor-pointer ${isReviewerOrAuthor(teamMember.username) || selectedReviewers.includes(teamMember.username) ? 'bg-green-200' : ''}`}
                                        onClick={() => handleSelectReviewer(teamMember.username)}  // 將選取功能移到整個 li
                                        disabled={isReviewerOrAuthor(teamMember.username)} // 若為創建者或已是 reviewer 則不觸發事件
                                    >
                                        <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                                            <img src={`https://avatars.githubusercontent.com/${teamMember.username}`} alt="" />
                                        </div>
                                        <span className="p-3 ml-2">{teamMember.username}</span>

                                    </li>

                                ))}
                        </ul>
                        {userRole === 'Contributor' && selectedReviewers.length > 0 && (
                            <button
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
                                onClick={handleRequestReviewers}
                            >
                                REQUEST
                            </button>
                        )}
                    </div>

                )
            }
        </div >
    );
};

export default PRDiscussion;
