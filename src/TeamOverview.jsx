import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './TeamOverview.css';
import timelineData from './data/timelineData.json';

const TeamOverview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const teamId = queryParams.get('teamId');

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
            const response = await fetch(`http://localhost:8081/teams/${teamId}?token=${token}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            alert('成功刪除團隊');
            navigate('/'); // 重導向到首頁
        } catch (error) {
            console.error('刪除團隊時出錯:', error);
            alert('刪除團隊時出錯');
        }
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
                <button onClick={deleteTeam} className="delete-button">刪除團隊</button>
            </div>
        </div>
    );
};

export default TeamOverview;
