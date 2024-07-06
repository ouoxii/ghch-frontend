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

    const fetchNotifications = async (token) => {
        try {
            const response = await fetch(`http://localhost:8081/invitations/${username}?`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
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
        fetchNotifications(token);
    }, [username]);

    return (
        <DataContext.Provider value={{ teams, notifications, addTeamData, deleteTeamData, fetchNotifications }}>
            {children}
        </DataContext.Provider>
    );
};
