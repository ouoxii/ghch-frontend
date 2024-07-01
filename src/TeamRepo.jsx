import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const TeamRepo = () => {
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
    const [inviteData, setInviteData] = useState({
        invitee: ''
    });
    const [errors, setErrors] = useState({});
    const [repos, setRepos] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const teamResponse = await fetch(`http://localhost:8081/teams/${teamId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!teamResponse.ok) {
                    throw new Error('無法獲取團隊資料');
                }

                const teamData = await teamResponse.json();
                setTeamData(teamData);

                const repoResponse = await fetch(`http://localhost:8081/team-repos/${teamData.teamName}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (repoResponse.ok) {
                    const repoData = await repoResponse.json();
                    setRepos(repoData);
                } else {
                    setRepos([]);
                }

                const inviteResponse = await fetch(`http://localhost:8081/invitations/${username}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (inviteResponse.ok) {
                    const inviteData = await inviteResponse.json();
                    setInvitations(inviteData);
                } else {
                    setInvitations([]);
                }
            } catch (error) {
                console.error('獲取資料時出錯:', error);
                alert('獲取資料時出錯');
            }
        };

        fetchTeamData();
    }, [teamId, token, username]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleInviteChange = (e) => {
        const { name, value } = e.target;
        setInviteData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!inputData.repoName) {
            newErrors.repoName = '儲存庫名稱是必填項';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

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
            // Create GitHub repository
            const repoResponse = await fetch(`http://localhost:3001/repo/create?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(repoRequestData)
            });

            if (!repoResponse.ok) {
                throw new Error('Network response was not ok');
            }

            // Create Cloud team repository
            const teamRepoResponse = await fetch(`http://localhost:8081/team-repos?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(teamRepoRequestData)
            });

            if (!teamRepoResponse.ok) {
                throw new Error('Network response was not ok');
            }

            const createdRepoData = await repoResponse.json();
            console.log('成功創建儲存庫:', createdRepoData);
            alert('成功創建儲存庫');

        } catch (error) {
            console.error('創建儲存庫時出錯:', error);
            alert('創建儲存庫時出錯');
        }
    };

    const handleInviteSubmit = async (event) => {
        event.preventDefault();

        const inviteRequestData = {
            teamId: teamId,
            username: inviteData.invitee,
            teamName: teamData.teamName
        };

        try {
            const inviteResponse = await fetch(`http://localhost:8081/invitations?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(inviteRequestData)
            });

            if (!inviteResponse.ok) {
                throw new Error('邀請失敗');
            }

            alert('邀請成功');
            setInviteData({ invitee: '' });

            // Refresh invitations list
            const inviteRefreshResponse = await fetch(`http://localhost:8081/invitations/${username}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (inviteRefreshResponse.ok) {
                const inviteRefreshData = await inviteRefreshResponse.json();
                setInvitations(inviteRefreshData);
            } else {
                setInvitations([]);
            }

        } catch (error) {
            console.error('邀請時出錯:', error);
            alert('邀請時出錯');
        }
    };

    const deleteInvitation = async (id) => {
        try {
            const response = await fetch(`http://localhost:8081/invitations/${id}?token=${token}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('刪除邀請時出錯');
            }

            alert('成功刪除邀請');
            setInvitations(invitations.filter(invitation => invitation.id !== id));
        } catch (error) {
            console.error('刪除邀請時出錯:', error);
            alert('刪除邀請時出錯');
        }
    };

    const deleteTeam = async () => {
        try {
            // Fetch all team repos
            const repoResponse = await fetch(`http://localhost:8081/team-repos/${teamData.teamName}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            let repos = [];
            if (repoResponse.ok) {
                repos = await repoResponse.json();
            }

            // Delete all repos if any
            if (repos.length > 0) {
                for (const repo of repos) {
                    const deleteRepoResponse = await fetch(`http://localhost:8081/team-repos/${repo.id}?token=${token}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!deleteRepoResponse.ok) {
                        throw new Error('刪除儲存庫時出錯');
                    }
                }
            }

            // Delete team members
            const deleteTeamMembersResponse = await fetch(`http://localhost:8081/team-members?token=${token}&teamId=${teamId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!deleteTeamMembersResponse.ok) {
                throw new Error('刪除team-members時出錯');
            }

            // Delete team
            const deleteTeamResponse = await fetch(`http://localhost:8081/teams/${teamId}?token=${token}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!deleteTeamResponse.ok) {
                throw new Error('刪除團隊時出錯');
            }

            alert('成功刪除團隊及其所有儲存庫');
            navigate('/'); // Redirect to home page
        } catch (error) {
            console.error('刪除過程中出錯:', error);
            alert('刪除過程中出錯');
        }
    };

    const handleDeleteClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleConfirmDelete = () => {
        deleteTeam();
        setIsModalOpen(false);
    };

    return (
        <div style={{ display: 'flex' }}>
            <div className="form-container">
                <form id="createTeamForm" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            name="repoName"
                            value={inputData.repoName}
                            onChange={handleInputChange}
                            placeholder="儲存庫名稱"
                        />
                        {errors.repoName && <span className="error">{errors.repoName}</span>}
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            name="description"
                            value={inputData.description}
                            onChange={handleInputChange}
                            placeholder="儲存庫描述"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            name="homepage"
                            value={inputData.homepage}
                            onChange={handleInputChange}
                            placeholder="主頁URL"
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                name="auto_init"
                                checked={inputData.auto_init}
                                onChange={() => setInputData(prevState => ({
                                    ...prevState,
                                    auto_init: !prevState.auto_init
                                }))}
                            />
                            自動初始化
                        </label>
                    </div>
                    <button type="submit" className="submit-button">創建儲存庫</button>
                </form>
                <form id="inviteForm" onSubmit={handleInviteSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            name="invitee"
                            value={inviteData.invitee}
                            onChange={handleInviteChange}
                            placeholder="邀請成員"
                        />
                    </div>
                    <button type="submit" className="submit-button">發送邀請</button>
                </form>
                <button onClick={handleDeleteClick} className="delete-button">刪除團隊</button>
            </div>
            {repos.length > 0 && (
                <div className="repo-list">
                    <h2>儲存庫列表</h2>
                    {repos.map(repo => (
                        <div key={repo.id} className="repo">
                            <Link to={`/team-overview/?repoId=${repo.id}&teamId=${teamId}`} > <p>儲存庫名稱: {repo.repoName}</p></Link>
                        </div>
                    ))}
                </div>
            )}
            {invitations.length > 0 && (
                <div className="invite-list">
                    <h2>邀請列表</h2>
                    {invitations.map(invite => (
                        <div key={invite.id} className="invite">
                            <p>邀請成員: {invite.username}</p>
                            <button onClick={() => deleteInvitation(invite.id)} className="delete-button">刪除邀請</button>
                        </div>
                    ))}
                </div>
            )}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={handleCloseModal}>&times;</span>
                        <h2>確認刪除</h2>
                        <p>確定要刪除這個團隊嗎？</p>
                        <button onClick={handleConfirmDelete} className="confirm-button">確認</button>
                        <button onClick={handleCloseModal} className="cancel-button">取消</button>
                    </div>
                </div>
            )}
        </div >
    );
};

export default TeamRepo;
