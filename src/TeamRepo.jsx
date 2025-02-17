import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { DataContext } from './DataContext';
import AssistnatBox from './AssistantBox';

const TeamRepo = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const teamId = queryParams.get('teamId');
    const token = Cookies.get('token');
    const username = Cookies.get('username');

    const [teamData, setTeamData] = useState({ owner: '', teamName: '', id: '' });
    const [inputData, setInputData] = useState({
        repoName: '',
        description: '',
        homepage: '',
        auto_init: true
    });
    const [inviteData, setInviteData] = useState({ invitee: '' });
    const [errors, setErrors] = useState({});
    const [repos, setRepos] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [intervalId, setIntervalId] = useState(null);

    const { teams, fetchTeamData, addTeamdata, deleteTeamData } = useContext(DataContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const teamResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/teams/${teamId}`, {

                });
                if (!teamResponse.ok) throw new Error('無法獲取團隊資料');
                const teamData = await teamResponse.json();
                setTeamData(teamData);

                const repoResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/team-repos/${teamData.id}`, {

                });
                const reposData = repoResponse.ok ? await repoResponse.json() : [];
                setRepos(reposData);

                const inviteResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/invitations?teamId=${teamData.id}`, {

                });
                setInvitations(inviteResponse.ok ? await inviteResponse.json() : []);

                const teamMembersResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/team-members?teamName=${teamData.teamName}`, {

                });
                setTeamMembers(teamMembersResponse.ok ? await teamMembersResponse.json() : []);
            } catch (error) {
                console.error('獲取資料時出錯:', error);
                alert('獲取資料時出錯');
                navigate('/');
            }
        };

        fetchData();
    }, [teamId, token, username]);

    useEffect(() => {
        const getTeamMembers = async () => {
            const teamMembersResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/team-members?teamName=${teamData.teamName}`);
            setTeamMembers(teamMembersResponse.ok ? await teamMembersResponse.json() : []);
        }

        const id = setInterval(getTeamMembers, 15000);

        return () => {
            if (id) {
                clearInterval(id);
            }
        };
    }, [teamData.teamName])

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleInviteChange = (e) => {
        const { name, value } = e.target;
        setInviteData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSettingsClick = () => setIsSettingsOpen(!isSettingsOpen);
    const handleCreateClick = () => setIsCreateOpen(!isCreateOpen);
    const handleCreateSettings = () => setIsCreateOpen(false);
    const handleCloseSettings = () => setIsSettingsOpen(false);

    const validateForm = () => {
        const newErrors = {};
        if (!inputData.repoName) newErrors.repoName = '儲存庫名稱是必填項';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        const repoRequestData = {
            name: inputData.repoName,
            description: inputData.description,
            homepage: inputData.homepage,
            auto_init: inputData.auto_init
        };

        const teamRepoRequestData = {
            teamId: teamId,
            teamName: teamData.teamName,
            repoName: inputData.repoName
        };

        try {
            console.log("test")
            const repoResponse = await fetch(`http://localhost:3001/repo/create?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(repoRequestData)
            });
            if (!repoResponse.ok) throw new Error('創建GitHub儲存庫失敗');

            const teamRepoResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/team-repos?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamRepoRequestData)
            });
            if (!teamRepoResponse.ok) throw new Error('創建團隊儲存庫失敗');

            await Promise.all(teamMembers.map(async (teamMember) => {
                if (teamMember.username !== username) {
                    const collabResponse = await fetch(`http://localhost:3001/collab/add?owner=${username}&repo=${teamRepoRequestData.repoName}&username=${teamMember.username}&token=${token}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (!collabResponse.ok) throw new Error(`Failed to add collaborator to repo: ${teamRepoRequestData.repoName}`);
                    const responseData = await collabResponse.json();
                    const id = responseData.data.id;
                    console.log(id);
                    const GitinviteRequestData = {
                        teamId: teamId,
                        repoName: inputData.repoName,
                        teamName: teamData.teamName,
                        invitationId: id
                    };
                    const inviteResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/repo-invitations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(GitinviteRequestData)
                    });
                    if (!inviteResponse.ok) throw new Error('新增失敗');
                }
            }));

            //組長clone repo到本地端user/GHCH
            const cloneRepoResponse = await fetch(`http://localhost:8080/git-repo/clone?repoOwner=${teamData.owner}&repoName=${teamRepoRequestData.repoName}`,
                {
                    method: 'POST',
                    haerders: { 'Content-Type': 'application/json' }
                }
            );
            if (!cloneRepoResponse.ok) {
                throw new Error('clone repo fail');
            } else {
                const locationHeader = cloneRepoResponse.headers.get('Location');
                console.log(locationHeader);
            }
            //獲取main分支資料
            const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=${username}&repo=${teamRepoRequestData.repoName}`);
            // const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=ntou01057042&repo=github-flow-tutor`);//指定repo
            if (!chartDataResponse.ok) {
                if (chartDataResponse.status === 404) {
                    throw new Error('沒有本地端分支資料');
                } else {
                    throw new Error('獲取本地端分支資料失敗');
                }
            }
            //上傳雲端
            const postGraphBranchResponse = await fetch(`http://localhost:8080/graph/upload?owner=${username}&repo=${teamRepoRequestData.repoName}`,
                {
                    method: 'POST'
                }
            );
            if (!postGraphBranchResponse.ok) {
                throw new Error('上傳分支圖失敗');
            }

            const location = teamRepoResponse.headers.get('Location');
            const repoId = location.split('/').pop();
            alert('成功創建儲存庫');
            fetchTeamData();
            navigate(`/team-overview/?teamId=${teamId}&teamName=${teamData.teamName}&repoId=${repoId}&repoName=${inputData.repoName}`);
        } catch (error) {
            console.error('創建儲存庫時出錯:', error);
            alert('創建儲存庫時出錯');
        }
    };

    const handleInviteSubmit = async (event) => {
        event.preventDefault();

        if (!inviteData.invitee) {
            setErrors(prevState => ({ ...prevState, invitee: '成員名不可空白' }));
            return;
        }


        const inviteRequestData = {
            teamId: teamId,
            username: inviteData.invitee,
            teamName: teamData.teamName
        };

        try {
            const inviteeResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/app-users?username=${inviteData.invitee}`, {});
            if (!inviteeResponse.ok) throw new Error('此成員不存在');

            const inviteResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/invitations?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteRequestData)
            });
            if (!inviteResponse.ok) throw new Error('邀請失敗');

            alert('邀請成功');

            setInviteData({ invitee: '' });
            if (repos.length > 0) {
                try {
                    await Promise.all(repos.map(async (repo) => {
                        const repoResponse = await fetch(`http://localhost:3001/collab/add?owner=${username}&repo=${repo.repoName}&username=${inviteRequestData.username}&token=${token}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                        });
                        if (!repoResponse.ok) throw new Error(`Failed to add collaborator to repo: ${repo.repoName}`);
                        const responseData = await repoResponse.json();
                        const id = responseData.data.id;
                        console.log(id);
                        const GitinviteRequestData = {
                            teamId: teamId,
                            repoName: repo.repoName,
                            teamName: teamData.teamName,
                            invitationId: id
                        };
                        const inviteResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/repo-invitations`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(GitinviteRequestData)
                        });
                        if (!inviteResponse.ok) throw new Error('新增失敗');

                    }));
                    alert('成功寄出GitHub協作邀請 ');
                } catch (error) {
                    console.error('寄出協作邀請失敗', error);
                    alert('寄出協作邀請失敗');
                }
            }
            const inviteRefreshResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/invitations/${username}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setInvitations(inviteRefreshResponse.ok ? await inviteRefreshResponse.json() : []);
        } catch (error) {
            console.error('邀請時錯誤:', error);
            alert(error);
        }
    };

    const deleteInvitation = async (id) => {
        try {
            const response = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/invitations/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('刪除邀請時錯誤');

            alert('成功刪除邀請');
            setInvitations(invitations.filter(invitation => invitation.id !== id));
        } catch (error) {
            console.error('刪除邀請時出錯:', error);
            alert(error);
        }
    };

    const deleteTeam = async () => {
        try {

            for (const invite of invitations) {
                await deleteInvitation(invite.id);
            }

            const repoResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/team-repos/${teamData.id}`, {
                method: 'GET',
            });
            const repos = repoResponse.ok ? await repoResponse.json() : [];

            for (const repo of repos) {
                const deleteRepoResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/team-repos/${repo.id}`, {
                    method: 'DELETE',
                });
                if (!deleteRepoResponse.ok) throw new Error('刪除Cloud儲存庫時出錯');

                const deleteGitResponse = await fetch(`http://localhost:3001/repo/delete?owner=${username}&repo=${repo.repoName}&token=${token}`, {
                    method: 'POST'
                });
                if (!deleteGitResponse.ok) throw new Error('刪除Git儲存庫時出錯');
            }

            const deleteTeamMembersResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/team-members?token=${token}&teamId=${teamId}`, {
                method: 'DELETE',
            });
            if (!deleteTeamMembersResponse.ok) throw new Error('刪除team-members時出錯');

            deleteTeamData(teamId, token);

            alert('成功刪除團隊及其所有儲存庫');
            navigate('/');
        } catch (error) {
            console.error('刪除過程中出錯:', error);
            alert(error);
        }
    };


    const handleDeleteClick = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);
    const handleConfirmDelete = () => {
        deleteTeam();
        setIsModalOpen(false);
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-300">
                <h1 className="text-xl font-bold">{teamData.teamName}</h1>
                <button onClick={handleSettingsClick} className="text-blue-500">團隊設定</button>
            </div>
            <div className="flex h-full ">
                <div className="relative w-3/4 p-4 mt-5 h-5/6 border-r border-gray-300  overflow-auto">
                    <div className="mb-4">
                        {repos.map(repo => (
                            <div key={repo.id} className="p-4 bg-blue-50 rounded-lg shadow-md mb-4 h-24">
                                <Link to={`/team-overview/?teamId=${teamId}&teamName=${teamData.teamName}&repoId=${repo.id}&repoName=${repo.repoName}`}>
                                    <p className="text-xl font-semibold">{repo.repoName}</p>
                                </Link>
                            </div>
                        ))}
                    </div>
                    {teamData.owner === username && (
                        <button onClick={handleCreateClick} className="p-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
                            建立新儲存庫
                        </button>
                    )}

                </div>
                <div className='absolute bottom-10 right-10'>
                    <AssistnatBox text="團隊內可創建儲存庫，每個儲存庫單獨對應到一個GitHub儲存庫。" />
                </div>
                <div className="w-1/4 p-4">
                    <h2 className="text-xl font-bold mb-4">成員列表</h2>
                    <ul className="mb-4">
                        {teamMembers.map(teamMember => (
                            <li key={teamMember.id} className="flex items-center mb-2">
                                <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                                    <img src={`https://avatars.githubusercontent.com/${teamMember.username}`} alt="" />
                                </div>
                                <span className="p-3 ml-2">{teamMember.username}</span>
                            </li>
                        ))}
                        {invitations.map(invite => (
                            <li key={invite.id} className="flex items-center mb-2">
                                <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                                    <img src={`https://avatars.githubusercontent.com/${invite.username}`} alt="" />
                                </div>
                                <span className="p-3 ml-2">{invite.username}</span>
                                <button onClick={() => deleteInvitation(invite.id)} className="ml-auto bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">刪除邀請</button>
                            </li>
                        ))}
                    </ul>
                    {teamData.owner === username && (
                        <form id="inviteForm" onSubmit={handleInviteSubmit} className="mb-4 flex">
                            <input
                                type="text"
                                name="invitee"
                                value={inviteData.invitee}
                                onChange={handleInviteChange}
                                placeholder="邀請成員"
                                className="flex-grow p-2 border rounded mr-2"
                            />
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                發送邀請
                            </button>
                        </form>)}
                    {errors.invitee && <span className="error text-red-500">{errors.invitee}</span>}
                </div>
            </div>
            {isModalOpen && (
                <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
                    <div className="modal-content bg-white p-8 rounded">
                        <span className="close-button cursor-pointer absolute top-2 right-2" onClick={handleCloseModal}>&times;</span>
                        <h2 className="text-2xl font-bold mb-4">確認刪除</h2>
                        <p className="mb-4">確定要刪除這個團隊嗎？</p>
                        <button onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2">確認</button>
                        <button onClick={handleCloseModal} className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2">取消</button>
                    </div>
                </div>
            )}
            {isSettingsOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="flex flex-col w-[35%] h-[80%] rounded-xl shadow-lg overflow-hidden bg-white">
                        <div className='flex flex-col h-full relative'>
                            <div className="p-3 m-3 flex border-b">
                                <h2>團隊設定</h2>
                                <button className='ml-auto' onClick={handleCloseSettings}>✕</button>
                            </div>
                            <div className='p-5'>
                                {teamData.owner === username && (
                                    <button onClick={handleDeleteClick} className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                        刪除團隊
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
            {isCreateOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="flex flex-col w-[35%] h-[80%] rounded-xl shadow-lg overflow-hidden bg-white">
                        <div className='flex flex-col h-full relative'>
                            <div className="p-3 m-3 flex border-b">
                                <h2>創建儲存庫</h2>
                                <button className='ml-auto' onClick={handleCreateSettings}>✕</button>
                            </div>
                            <form id="createTeamForm" onSubmit={handleSubmit}>
                                <div className="p-3 form-group mb-2">
                                    <input
                                        type="text"
                                        name="repoName"
                                        value={inputData.repoName}
                                        onChange={handleInputChange}
                                        placeholder="儲存庫名稱"
                                        className="w-full p-2 border rounded"
                                    />
                                    {errors.repoName && <span className="error text-red-500">{errors.repoName}</span>}
                                </div>
                                <div className="p-3 form-group mb-2">
                                    <input
                                        type="text"
                                        name="description"
                                        value={inputData.description}
                                        onChange={handleInputChange}
                                        placeholder="儲存庫描述"
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div className="p-3 form-group mb-2">
                                    <input
                                        type="text"
                                        name="homepage"
                                        value={inputData.homepage}
                                        onChange={handleInputChange}
                                        placeholder="主頁URL"
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div className="p-3 form-group mb-2">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            name="auto_init"
                                            checked={inputData.auto_init}
                                            onChange={() => setInputData(prevState => ({
                                                ...prevState,
                                                auto_init: !prevState.auto_init
                                            }))}
                                            className="form-checkbox"
                                        />
                                        <span className="p-3 ml-2">自動初始化</span>
                                    </label>
                                </div>
                                <div className="p-3 form-group mb-2">
                                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
                                        創建儲存庫
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeamRepo;
