import React, { useState, useEffect } from 'react';
import './TeamOverview.css';
import { Link } from 'react-router-dom';
import timelineData from './data/timelineData.json';
import Cookies from 'js-cookie';

const TeamOverview = () => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [repoData, setRepoData] = useState({
        name: '',
        description: '',
        homepage: '',
        auto_init: true
    });

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRepoData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const createRepo = async () => {
        const token = Cookies.get('token');

        try {
            const response = await fetch(`http://localhost:3001/repo/create?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(repoData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('成功創建儲存庫:', data);
            alert('成功創建儲存庫');
            setModalOpen(false);
        } catch (error) {
            console.error('創建儲存庫時出錯:', error);
            alert('創建儲存庫時出錯');
        }
    };

    return (
        <div>
            <div className="team-overview">
                <div id="example7.1" style={{ height: '300px' }}></div>
            </div>
            <div><Link to="/branchchart"> <button>分支進度圖</button></Link></div>
            <button type="button" className="feat-button" onClick={() => setModalOpen(true)}>創建儲存庫</button>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setModalOpen(false)}>&times;</span>
                        <h2>創建儲存庫</h2>
                        <form>
                            <div className="form-group">
                                <label>名稱:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={repoData.name}
                                    onChange={handleInputChange}
                                    placeholder="儲存庫名稱"
                                />
                            </div>
                            <div className="form-group">
                                <label>描述:</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={repoData.description}
                                    onChange={handleInputChange}
                                    placeholder="儲存庫描述"
                                />
                            </div>
                            <div className="form-group">
                                <label>主頁:</label>
                                <input
                                    type="text"
                                    name="homepage"
                                    value={repoData.homepage}
                                    onChange={handleInputChange}
                                    placeholder="主頁URL"
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="auto_init"
                                        checked={repoData.auto_init}
                                        onChange={() => setRepoData(prevState => ({
                                            ...prevState,
                                            auto_init: !prevState.auto_init
                                        }))}
                                    />
                                    自動初始化
                                </label>


                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', }}>
                                <button type="button" className='feat-button' onClick={createRepo}>創建儲存庫</button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamOverview;
