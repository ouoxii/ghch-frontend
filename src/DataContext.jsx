import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [teams, setTeams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const username = Cookies.get('username');
    const token = Cookies.get('token');
    const navigate = useNavigate();
    const fetchTeamData = async () => {
        try {
            const response = await fetch(`http://localhost:8081/team-members/${username}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setTeams(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`http://localhost:8081/invitations/${username}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setNotifications([]);
                    throw new Error('No notification');
                } else {
                    throw new Error('Network response was not ok');
                }
            }
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const autoUpdateNotification = () => {
        fetchNotifications();
        const id = setInterval(fetchNotifications, 15000);
        return id;
    }

    const acceptInvitation = async (notification, invitationId) => {
        async function compareAndAcceptInvitations(teamId, token) {
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
                                console.log(`Successfully accepted invitation with ID: ${userInvite.invitation_id}`);
                            } else {
                                console.error(`Failed to accept invitation with ID: ${userInvite.invitation_id}`);
                            }
                            const deleteInviteResponse = await fetch(`http://localhost:8081/repo-invitations?invitationId=${userInvite.invitation_id}`, {
                                method: 'DELETE',
                            });
                            if (deleteInviteResponse.ok) {
                                alert(`Successfully delete invitation with ID: ${userInvite.invitation_id}`);
                            } else {
                                alert(`Failed to delete invitation with ID: ${userInvite.invitation_id}`);
                            }

                        }
                    }
                }


            } catch (error) {
                console.error('Error comparing and accepting invitations:', error);
            }
        }
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
            compareAndAcceptInvitations(notification.teamId, token);
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
            console.error('刪除邀請時出錯:', error)
        }
    };
    const rejectInvitation = async (notification, invitationId) => {
        async function compareAndDeclineInvitations(teamId, token) {
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
                                alert(`Successfully declined invitation with ID: ${userInvite.invitation_id}`);
                            } else {
                                alert(`Failed to decline invitation with ID: ${userInvite.invitation_id}`);
                            }
                            const deleteInviteResponse = await fetch(`http://localhost:8081/repo-invitations?invitationId=${userInvite.invitation_id}`, {
                                method: 'DELETE',
                            });
                            if (deleteInviteResponse.ok) {
                                alert(`Successfully delete invitation with ID: ${userInvite.invitation_id}`);
                            } else {
                                alert(`Failed to delete invitation with ID: ${userInvite.invitation_id}`);
                            }
                        }
                    }
                }


            } catch (error) {
                console.error('Error comparing and declining invitations:', error);
            }
        }
        try {
            const response = await fetch(`http://localhost:8081/invitations/${invitationId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('刪除邀請時出錯');
            }
            compareAndDeclineInvitations(notification.teamId, token);
            alert('邀請已拒絕');
            setNotifications(notifications.filter(notification => notification.id !== invitationId));
        } catch (error) {
            console.error('拒絕邀請時出錯:', error);
            alert('拒絕邀請時出錯');
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
                throw new Error('Network response was not ok');
            }
            alert("成功創建團隊");
            const location = response.headers.get('Location');
            const teamId = location.split('/').pop();
            fetchTeamData();
            navigate(`/teamRepo/?teamId=${teamId}`);
        } catch (error) {
            console.error('創建團隊時出錯:', error);
            alert('創建團隊時出錯');
        }
    };

    const deleteTeamData = async (teamId, token) => {
        try {
            const response = await fetch(`http://localhost:8081/teams/${teamId}?token=${token}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('刪除團隊時出錯');
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
            fetchNotifications, autoUpdateNotification, acceptInvitation, rejectInvitation
        }}>
            {children}
        </DataContext.Provider>
    );
};
