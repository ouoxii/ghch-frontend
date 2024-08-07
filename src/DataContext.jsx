import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

export const DataContext = createContext();



export const DataProvider = ({ children }) => {
    const [teams, setTeams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const username = Cookies.get('username');
    const token = Cookies.get('token');
    const navigate = useNavigate();
    const compareAndAcceptInvitations = async (teamId, token) => {
        try {
            const fetchInviteResponse = await fetch(`http://localhost:8081/repo-invitations/${teamId}`, {
                method: 'GET',
            });
            const teamInvitations = await fetchInviteResponse.json();
            const fetchUserInviteResponse = await fetch(`http://localhost:3001/collab/user-invitations?token=${token}`, {
                method: 'GET',
            });
            const userInvitations = await fetchUserInviteResponse.json();

            for (const teamInvite of teamInvitations) {
                for (const userInvite of userInvitations) {
                    if (teamInvite.invitationId === userInvite.invitation_id.toString()) {
                        const acceptInviteResponse = await fetch(`http://localhost:3001/collab/accept?invitation_id=${userInvite.invitation_id}&token=${token}`, {
                            method: 'PATCH',
                        });
                        if (acceptInviteResponse.ok) {
                            console.log(`成功接受邀請 invitation_id: ${userInvite.invitation_id}`);
                        } else {
                            console.error(`接受邀請失敗 invitation_id: ${userInvite.invitation_id}`);
                        }
                        const deleteInviteResponse = await fetch(`http://localhost:8081/repo-invitations?invitationId=${userInvite.invitation_id}`, {
                            method: 'DELETE',
                        });
                        if (deleteInviteResponse.ok) {
                            console.log(`成功刪除cloud邀請ID: ${userInvite.invitation_id}`);
                        } else {
                            console.log(`刪除cloud邀請ID失敗: ${userInvite.invitation_id}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('接受邀請比對流程錯誤: ', error);
        }
    };

    const compareAndDeclineInvitations = async (teamId, token) => {
        try {
            const fetchInviteResponse = await fetch(`http://localhost:8081/repo-invitations/${teamId}`, {
                method: 'GET',
            });
            const teamInvitations = await fetchInviteResponse.json();

            const fetchUserInviteResponse = await fetch(`http://localhost:3001/collab/user-invitations?token=${token}`, {
                method: 'GET',
            });
            const userInvitations = await fetchUserInviteResponse.json();

            for (const teamInvite of teamInvitations) {
                for (const userInvite of userInvitations) {
                    if (teamInvite.invitationId === userInvite.invitation_id.toString()) {
                        const declineInviteResponse = await fetch(`http://localhost:3001/collab/decline?invitation_id=${userInvite.invitation_id}&token=${token}`, {
                            method: 'DELETE',
                        });
                        if (declineInviteResponse.ok) {
                            console.log(`成功拒絕邀請 ID: ${userInvite.invitation_id}`);
                        } else {
                            console.log(`拒絕邀請失敗 ID: ${userInvite.invitation_id}`);
                        }
                        const deleteInviteResponse = await fetch(`http://localhost:8081/repo-invitations?invitationId=${userInvite.invitation_id}`, {
                            method: 'DELETE',
                        });
                        if (deleteInviteResponse.ok) {
                            console.log(`成功刪除cloud邀請ID: ${userInvite.invitation_id}`);
                        } else {
                            console.log(`刪除cloud邀請ID失敗: ${userInvite.invitation_id}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('拒絕邀請比對流程錯誤: ', error);
        }
    };

    const fetchTeamData = async () => {
        try {
            const response = await fetch(`http://localhost:8081/team-members/${username}`);
            if (!response.ok) {
                throw new Error('列出所屬 Team 錯誤');
            }
            const data = await response.json();
            setTeams(data);
        } catch (error) {
            console.error('列出所屬 Team 錯誤: ', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`http://localhost:8081/invitations/${username}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setNotifications([]);
                    throw new Error('沒有邀請');
                } else {
                    throw new Error('查詢邀請失敗');
                }
            }
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('查詢邀請失敗: ', error);
        }
    };

    const autoUpdateNotification = () => {
        fetchNotifications();
        const id = setInterval(fetchNotifications, 15000);
        return id;
    };

    const acceptInvitation = async (notification, invitationId) => {
        const requestData = {
            username: username,
            teamId: notification.teamId,
            teamName: notification.teamName,
        };

        try {
            const response = await fetch(`http://localhost:8081/team-members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            await compareAndAcceptInvitations(notification.teamId, token);
            alert('成功加入團隊');
            fetchTeamData();
            fetchNotifications();
        } catch (error) {
            console.error('接受邀請時出錯:', error);
            alert('接受邀請時出錯');
        }

        try {
            const response = await fetch(`http://localhost:8081/invitations/${invitationId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('刪除邀請時出錯');
            }

            setNotifications(notifications.filter(notification => notification.id !== invitationId));
        } catch (error) {
            console.error('刪除邀請時出錯:', error);
        }
    };

    const rejectInvitation = async (notification, invitationId) => {
        try {
            const response = await fetch(`http://localhost:8081/invitations/${invitationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('刪除邀請時出錯');
            }
            await compareAndDeclineInvitations(notification.teamId, token);
            alert('邀請已拒絕');
            setNotifications(notifications.filter(notification => notification.id !== invitationId));
        } catch (error) {
            console.error('拒絕邀請時出錯:', error);
            alert(error);
        }
    };

    const addTeamData = async (teamName, owner, token) => {
        const teamRequestData = {
            teamName: teamName,
            owner: owner
        };

        try {
            const response = await fetch(`http://localhost:8081/teams?token=${token}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(teamRequestData)
            });

            if (!response.ok) {
                throw new Error('創建團隊失敗');
            }
            alert("成功創建團隊");
            const location = response.headers.get('Location');
            const teamId = location.split('/').pop();
            fetchTeamData();
            navigate(`/teamRepo/?teamId=${teamId}`);
        } catch (error) {
            console.error('創建團隊時出錯:', error);
            alert(error);
        }
    };

    const deleteTeamData = async (teamId, token) => {
        try {
            const response = await fetch(`http://localhost:8081/teams/${teamId}?token=${token}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('刪除團隊時錯誤');
            }

            setTeams(prevTeams => prevTeams.filter(team => team.teamId !== teamId));
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchTeamData();
        fetchNotifications();
    }, [username]);

    return (
        <DataContext.Provider value={{
            teams, notifications, fetchTeamData, addTeamData, deleteTeamData,
            fetchNotifications, autoUpdateNotification, acceptInvitation, rejectInvitation,
            compareAndAcceptInvitations, compareAndDeclineInvitations, isSettingsOpen, setIsSettingsOpen
        }}>
            {children}
        </DataContext.Provider>
    );
};
