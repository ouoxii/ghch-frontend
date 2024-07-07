import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

// 創建一個 Context
export const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [teams, setTeam] = useState([]);
    const username = Cookies.get('username');

    const fetchTeamData = async () => {
        try {
            const response = await fetch(`http://localhost:8081/team-members/${username}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setTeam(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    //新增團隊
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
            fetchTeamData();
        } catch (error) {
            console.error('創建團隊時出錯:', error);
            alert('創建團隊時出錯');
        }

    };

    //刪除團隊
    const deleteTeamData = async (teamId, token) => {
        try {
            const response = await fetch(`http://localhost:8081/teams/${teamId}?token=${token}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('刪除團隊時出錯');
            }
            // Update the state to remove the deleted team
            console.log(teams)
            console.log(teamId)
            setTeam(prevTeams => prevTeams.filter(team => team.teamId !== teamId));
            console.log(teams);

        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchTeamData();
    }, [username]);

    return (
        <DataContext.Provider value={{ teams, fetchTeamData, addTeamData, deleteTeamData }}>
            {children}
        </DataContext.Provider>
    );
};
