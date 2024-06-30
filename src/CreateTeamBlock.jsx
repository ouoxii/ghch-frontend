import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import Cookies from 'js-cookie';
import './CreateTeamBlock.css';

const CreateTeamBlock = () => {
    const [inputData, setInputData] = useState({
        teamName: '',
        repoName: '',
        description: '',
        homepage: '',
        auto_init: true
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!inputData.teamName) {
            newErrors.teamName = '團隊名稱是必填項';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        const teamName = inputData.teamName;
        const owner = Cookies.get('username');
        const token = Cookies.get('token');

        const teamRequestData = {
            teamName: teamName,
            owner: owner
        };



        try {
            // Create team
            const teamResponse = await $.ajax({
                url: `http://localhost:8081/teams?token=${token}`,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(teamRequestData)
            });

            console.log("成功創建團隊：" + JSON.stringify(teamResponse));
            alert("成功創建團隊");
        } catch (error) {
            console.error('創建團隊時出錯:', error);
            alert('創建團隊時出錯');
        }
    };

    return (
        <div className="form-container">
            <form id="createTeamForm" onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        name="teamName"
                        value={inputData.teamName}
                        onChange={handleInputChange}
                        placeholder="團隊名稱"
                    />
                    {errors.teamName && <span className="error">{errors.teamName}</span>}
                </div>

                <button type="submit" className="submit-button">創建團隊</button>
            </form>
        </div>
    );
};

export default CreateTeamBlock;
