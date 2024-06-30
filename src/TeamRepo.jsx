import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const TeamRepo = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const teamId = queryParams.get('teamId');
    const token = Cookies.get('token');

    const [teamData, setTeamData] = useState({ owner: '', teamName: '', repoName: '' });
    const [inputData, setInputData] = useState({
        repoName: '',
        description: '',
        homepage: '',
        auto_init: true
    });

    const [errors, setErrors] = useState({});
    const [repos, setRepos] = useState([]);

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
            } catch (error) {
                console.error('獲取資料時出錯:', error);
                alert('獲取資料時出錯');
            }
        };

        fetchTeamData();
    }, [teamId, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData(prevState => ({
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
            )
            }
        </div >
    );
};

export default TeamRepo;
