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

        const teamName = inputData.teamName;
        const repoName = inputData.repoName;
        const owner = Cookies.get('username');
        const token = Cookies.get('token');

        const teamRequestData = {
            teamName: teamName,
            repoName: repoName,
            owner: owner
        };

        const repoRequestData = {
            name: repoName,
            description: inputData.description,
            homepage: inputData.homepage,
            auto_init: inputData.auto_init
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

            // Create repository
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

            const repoData = await repoResponse.json();
            console.log('成功創建儲存庫:', repoData);
            alert('成功創建儲存庫');
        } catch (error) {
            console.error('創建團隊或儲存庫時出錯:', error);
            alert('創建團隊或儲存庫時出錯');
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
                <button type="submit" className="submit-button">創建團隊</button>
            </form>
        </div>
    );
};

export default CreateTeamBlock;
