import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './TeamOverview.css';
import timelineData from './data/timelineData.json';

const TeamOverview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const teamId = queryParams.get('teamId');
    const teamRepoId = queryParams.get('repoId');

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.async = true;
        script.onload = () => {
            window.google.charts.load('current', { packages: ['timeline'] });
            window.google.charts.setOnLoadCallback(drawChart);
        };
        document.body.appendChild(script);
    }, []);

    const drawChart = () => {
        const container = document.getElementById('example7.1');
        const chart = new window.google.visualization.Timeline(container);
        const dataTable = new window.google.visualization.DataTable();
        dataTable.addColumn({ type: 'string', id: 'Branch' });
        dataTable.addColumn({ type: 'string', id: 'Author' });
        dataTable.addColumn({ type: 'string', id: 'style', role: 'style' });
        dataTable.addColumn({ type: 'date', id: 'Start' });
        dataTable.addColumn({ type: 'date', id: 'End' });

        const dataRows = timelineData.timelineData.map(item => [
            item.Branch,
            item.Author,
            item.style,
            new Date(item.Start),
            new Date(item.End)
        ]);

        dataTable.addRows(dataRows);

        const options = {
            timeline: { showRowLabels: false },
            avoidOverlappingGridLines: false,
            alternatingRowStyle: false,
            width: 1000,
            height: 300
        };

        chart.draw(dataTable, options);
    };

    const deleteTeam = async () => {
        const token = Cookies.get('token');

        try {
            // 先獲取團隊資料
            const teamResponse = await fetch(`http://localhost:8081/teams/${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!teamResponse.ok) {
                throw new Error('無法獲取團隊資料');
            }

            const teamData = await teamResponse.json();

            // 刪除team-repo
            const deleteRepoResponse = await fetch(`http://localhost:8081/team-repos/${teamRepoId}?token=${token}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!deleteRepoResponse.ok) {
                throw new Error('刪除儲存庫時出錯');
            }

            alert('成功刪除儲存庫');
            navigate('/'); // 重導向到首頁
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
        <div>
            <div className="team-overview">
                <div id="example7.1" style={{ height: '300px' }}></div>
            </div>
            <div>
                <Link to="/branchchart">
                    <button>分支進度圖</button>
                </Link>
                <button onClick={handleDeleteClick} className="delete-button">刪除儲存庫</button>
            </div>
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={handleCloseModal}>&times;</span>
                        <h2>確認刪除</h2>
                        <p>確定要刪除儲存庫嗎？</p>
                        <button onClick={handleConfirmDelete} className="confirm-button">確認</button>
                        <button onClick={handleCloseModal} className="cancel-button">取消</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamOverview;
