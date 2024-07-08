import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { DataContext } from './DataContext';

const TeamRepo = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const teamId = queryParams.get('teamId');
    const token = Cookies.get('token');
    const username = Cookies.get('username');

    const [teamData, setTeamData] = useState({ owner: '', teamName: '', repoName: '' });
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

    const { teams, fetchTeamData, addTeamdata, deleteTeamData } = useContext(DataContext);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const teamResponse = await fetch(`http://localhost:8081/teams/${teamId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!teamResponse.ok) throw new Error('無法獲取團隊資料');
                const teamData = await teamResponse.json();
                setTeamData(teamData);

                const repoResponse = await fetch(`http://localhost:8081/team-repos/${teamData.teamName}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const reposData = repoResponse.ok ? await repoResponse.json() : [];
                setRepos(reposData);

                const inviteResponse = await fetch(`http://localhost:8081/invitations/${username}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setInvitations(inviteResponse.ok ? await inviteResponse.json() : []);

                const teamMembersResponse = await fetch(`http://localhost:8081/team-members/${username}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setTeamMembers(teamMembersResponse.ok ? await teamMembersResponse.json() : []);
            } catch (error) {
                console.error('獲取資料時出錯:', error);
                alert('獲取資料時出錯');
            }
        };

        fetchTeamData();
    }, [teamId, token, username]);

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
            const repoResponse = await fetch(`http://localhost:3001/repo/create?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(repoRequestData)
            });
            if (!repoResponse.ok) throw new Error('創建GitHub儲存庫失敗');

            const teamRepoResponse = await fetch(`http://localhost:8081/team-repos?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamRepoRequestData)
            });
            if (!teamRepoResponse.ok) throw new Error('創建團隊儲存庫失敗');

            alert('成功創建儲存庫');
            fetchTeamData();
            navigate(`/team-overview/?teamId=${teamId}&teamName=${teamData.teamName}&repoName=${inputData.repoName}`);
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
            const inviteResponse = await fetch(`http://localhost:8081/invitations?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteRequestData)
            });
            if (!inviteResponse.ok) throw new Error('邀請失敗');

            alert('邀請成功');
            setInviteData({ invitee: '' });
            const inviteRefreshResponse = await fetch(`http://localhost:8081/invitations/${username}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setInvitations(inviteRefreshResponse.ok ? await inviteRefreshResponse.json() : []);
        } catch (error) {
            console.error('邀請時出錯:', error);
            alert('邀請時出錯');
        }
    };

    const deleteInvitation = async (id) => {
        try {
            const response = await fetch(`http://localhost:8081/invitations/${id}?token=${token}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('刪除邀請時出錯');

            alert('成功刪除邀請');
            setInvitations(invitations.filter(invitation => invitation.id !== id));
        } catch (error) {
            console.error('刪除邀請時出錯:', error);
            alert('刪除邀請時出錯');
        }
    };

    const deleteTeam = async () => {
        try {
            const repoResponse = await fetch(`http://localhost:8081/team-repos/${teamData.teamName}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const repos = repoResponse.ok ? await repoResponse.json() : [];

            for (const repo of repos) {
                const deleteRepoResponse = await fetch(`http://localhost:8081/team-repos/${repo.id}?token=${token}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!deleteRepoResponse.ok) throw new Error('刪除儲存庫時出錯');
            }

            const deleteTeamMembersResponse = await fetch(`http://localhost:8081/team-members?token=${token}&teamId=${teamId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!deleteTeamMembersResponse.ok) throw new Error('刪除team-members時出錯');

            deleteTeamData(teamId, token);

            alert('成功刪除團隊及其所有儲存庫');
            navigate('/');
        } catch (error) {
            console.error('刪除過程中出錯:', error);
            alert('刪除過程中出錯');
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
            <div className="flex h-full">
                <div className="w-3/4 p-4 border-r border-gray-300">
                    <div className="mb-4">
                        {repos.map(repo => (
                            <div key={repo.id} className="p-4 bg-blue-50 rounded-lg shadow-md mb-4 h-24">
                                <Link to={`/team-overview/?repoId=${repo.id}&repoName=${repo.repoName}&teamName=${teamData.teamName}`}>
                                    <p className="text-xl font-semibold">{repo.repoName}</p>
                                </Link>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleCreateClick} className="p-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
                        建立新儲存庫
                    </button>
                </div>
                <div className="w-1/4 p-4">
                    <h2 className="text-xl font-bold mb-4">成員列表</h2>
                    <ul className="mb-4">
                        {teamMembers.map(teamMember => (
                            <li key={teamMember.id} className="flex items-center mb-2">
                                <div className="w-12 h-12 rounded-full border-2 ml-1 border-white overflow-hidden">
                                    <img src={`https://avatars.githubusercontent.com/${username}`} alt="" />
                                </div>
                                <span className="p-3 ml-2">{teamMember.username}</span>
                            </li>
                        ))}
                        {invitations.map(invite => (
                            <li key={invite.id} className="flex items-center mb-2">
                                <span className="bg-gray-400 h-8 w-8 rounded-full inline-block"></span>
                                <span className="p-3 ml-2">{invite.username}</span>
                                <button onClick={() => deleteInvitation(invite.id)} className="ml-auto bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">刪除邀請</button>
                            </li>
                        ))}
                    </ul>
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
                    </form>
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
                <div className="fixed fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="flex flex-col w-[35%] h-[80%] rounded-xl shadow-lg overflow-hidden bg-white">
                        <div className='flex flex-col h-full relative'>
                            <div className="p-3 m-3 flex border-b">
                                <h2>團隊設定</h2>
                                <button className='ml-auto' onClick={handleCloseSettings}>✕</button>
                            </div>
                            <div className='p-5'>
                                <button onClick={handleDeleteClick} className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                    刪除團隊
                                </button></div>

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
