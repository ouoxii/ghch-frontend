import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import Cookies from 'js-cookie';
import './CreateTeamBlock.css';

const CreateTeamBlock = () => {
    const [inputData, setInputData] = useState({
        teamName: '',
        repoName: '',
        member: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    useEffect(() => {
        const handleSubmit = (event) => {
            event.preventDefault();

            const teamName = inputData.teamName;
            const repoName = inputData.repoName;
            const owner = Cookies.get('username');
            const token = Cookies.get('token');

            const requestData = {
                teamName: teamName,
                repoName: repoName,
                owner: owner
            };

            $.ajax({
                url: `http://localhost:8081/teams?token=${token}`,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(requestData),
                success: function (response) {
                    console.log("成功：" + JSON.stringify(response));
                    alert("創建成功");
                    window.location.reload();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error("There was an error creating the team!", errorThrown);
                }
            });
        };

        $("#createTeamForm").on("submit", handleSubmit);

        // Cleanup event listener on component unmount
        return () => {
            $("#createTeamForm").off("submit", handleSubmit);
        };
    }, [inputData]);

    return (
        <div className="form-container">
            <form id="createTeamForm">
                <div className="form-group">
                    <input
                        type="text"
                        name="teamName"
                        value={inputData.teamName}
                        onChange={handleInputChange}
                        placeholder="團隊名稱"
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        name="repoName"
                        value={inputData.repoName}
                        onChange={handleInputChange}
                        placeholder="儲存庫名稱"
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        name="member"
                        value={inputData.member}
                        onChange={handleInputChange}
                        placeholder="選擇要邀請的成員 (用逗號分隔)"
                    />
                </div>
                <button type="submit" className="submit-button">創建團隊</button>
            </form>
        </div>
    );
};

export default CreateTeamBlock;
