import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [teams, setTeams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const username = Cookies.get('username');
    const token = Cookies.get('token');

    const fetchData = async () => {
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
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const acceptInvitation = async (notification,invitationId) => {
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
            alert('成功加入團隊');
            fetchData();
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
            console.error('拒絕邀請時出錯:', error)
        }
    };

    const rejectInvitation = async (invitationId) => {
        try {
            const response = await fetch(`http://localhost:8081/invitations/${invitationId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('刪除邀請時出錯');
            }
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
            fetchData();
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
        fetchData();
        fetchNotifications();
    }, [username]);

    return (
        <DataContext.Provider value={{ teams, notifications, addTeamData, deleteTeamData, fetchNotifications, acceptInvitation, rejectInvitation }}>
            {children}
        </DataContext.Provider>
    );
};
