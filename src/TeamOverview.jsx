import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { DataContext } from './DataContext';

const TeamOverview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const repoName = queryParams.get('repoName');
    const teamRepoId = queryParams.get('repoId');
    const teamName = queryParams.get('teamName');
    const username = Cookies.get('username');
    const token = Cookies.get('token');
    const teamId = queryParams.get('teamId');
    const { compareAndAcceptInvitations } = useContext(DataContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamData, setTeamData] = useState({ id: '', teamName: '', owner: '' });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('main');
    const [chartsLoaded, setChartsLoaded] = useState(false);
    const [branches, setBranches] = useState(['select Branch']);
    const [repoExist, setRepoExist] = useState(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const teamResponse = await fetch(`http://localhost:8081/teams/${teamId}`);
                if (!teamResponse.ok) {
                    throw new Error('無法獲取團隊資料');
                }
                const teamData = await teamResponse.json();
                setTeamData(teamData);
                await compareAndAcceptInvitations(teamId, token);
            } catch (error) {
                console.error('獲取團隊資料時出錯:', error);
                alert('獲取團隊資料時出錯');
                navigate('/');
            }
        };

        const loadCharts = () => {
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/charts/loader.js';
            script.id = 'googleChart';
            script.async = true;
            script.onload = () => {
                window.google.charts.load('current', { packages: ['timeline'] });
                window.google.charts.setOnLoadCallback(() => {
                    setChartsLoaded(true);
                });
            };
            document.body.appendChild(script);
        };

        const loadDataAndCharts = async () => {
            await fetchTeamData();
            loadCharts();
        };

        loadDataAndCharts();

        return () => {
            const scriptElement = document.getElementById('googleChart');
            if (scriptElement && document.body.contains(scriptElement)) {
                document.body.removeChild(scriptElement);
            }
        };
    }, [teamName, teamId, token, teamRepoId]);

    useEffect(() => {
        const checkRepo = async () => {
            try {
                const repoResponse = await fetch(`http://localhost:8080/git-repo/check/${teamData.owner}/${repoName}`);
                if (!repoResponse.ok) {
                    throw new Error('確認Repo存在失敗');
                }
                const repoExist = await repoResponse.json();
                setRepoExist(repoExist);
            } catch (error) {
                console.error(error);
                alert(error);
            }
        }

        if (teamData.owner != '') {
            checkRepo();
        }

    }, [teamData]);

    useEffect(() => {
        const fetchLocalGraphBranch = async () => {
            try {
                // const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=${username}&repo=${repoName}`);
                const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=ntou01057042&repo=github-flow-tutor`);//指定repo
                if (!chartDataResponse.ok) {
                    if (chartDataResponse.status === 404) {
                        setTimelineData([]);
                        throw new Error('沒有本地端分支資料');
                    } else {
                        throw new Error('獲取本地端分支資料失敗');
                    }
                }

                const chartData = await chartDataResponse.json();

                setTimelineData(chartData);
                setBranches(['select Branch', ...chartData.filter(branch => branch.name !== 'HEAD').map(branch => branch.name)]);
            } catch (error) {
                console.log(error);
            }
        }

        const fetchCloudGraphBranch = async () => {
            try {
                if (teamData.owner) {
                    const cloudGraphBranchResponse = await fetch(`http://localhost:8081/cloud-graph-branch?owner=${teamData.owner}&repo=${repoName}`, {
                        method: 'GET'
                    });
                    if (!cloudGraphBranchResponse.ok) {
                        if (cloudGraphBranchResponse.status === 404) {
                            setTimelineData([]);
                            throw new Error('沒有雲端分支資料');
                        } else {
                            throw new Error('獲取雲端分支資料失敗')
                        }
                    }
                    const chartData = await cloudGraphBranchResponse.json();
                    setTimelineData(chartData);
                    const uniqueBranches = [...new Set(chartData.filter(branch => branch.name !== 'HEAD').map(branch => branch.name))];
                    setBranches(['select Branch', ...uniqueBranches]);
                }
            } catch (error) {
                console.log(error);
            }
        };

        const cloneRepo = async () => {
            try {
                const cloneRepoResponse = await fetch(`http://localhost:8080/git-repo/clone?repoOwner=${teamData.owner}&repoName=${repoName}`,
                    {
                        method: 'POST',
                        haerders: { 'Content-Type': 'application/json' }
                    }
                );
                if (!cloneRepoResponse.ok) {
                    throw new Error('clone repo fail');
                }
                setRepoExist(true);
            } catch (error) {
                alert(error);
            }
        }

        if (repoExist === true) {
            if (teamData.owner === username) {
                fetchLocalGraphBranch();
            } else {
                fetchCloudGraphBranch();
            }
        } else if(repoExist === false) {
            alert('偵測到repo不存在本地端，將自動為您clone');
            cloneRepo();

        }

    }, [repoExist])

    useEffect(() => {
        if (chartsLoaded && timelineData.length > 0) {
            drawChart();
        }
    }, [timelineData, chartsLoaded]);

    useEffect(() => {
        const postGraphBranch = async () => {
            try {
                const postGraphBranchResponse = await fetch(`http://localhost:8080/graph/upload?owner=${username}&repo=${repoName}`, {
                    method: 'POST'
                });
                if (!postGraphBranchResponse.ok) {
                    throw new Error('上傳分支圖失敗');
                }
            } catch (error) {
                console.log(error);
            }
        }

        if (timelineData.length > 0 && teamData.owner === username) {
            postGraphBranch();
        }
    }, [teamData, username, timelineData]);

    const drawChart = async () => {
        const container = document.getElementById('timeLineChart');
        const chart = new window.google.visualization.Timeline(container);
        const dataTable = new window.google.visualization.DataTable();
        dataTable.addColumn({ type: 'string', id: 'Branch' });
        dataTable.addColumn({ type: 'string', id: 'Author' });
        dataTable.addColumn({ type: 'string', id: 'style', role: 'style' });
        dataTable.addColumn({ type: 'date', id: 'Start' });
        dataTable.addColumn({ type: 'date', id: 'End' });

        const options = {
            timeline: { showRowLabels: false },
            avoidOverlappingGridLines: false,
            alternatingRowStyle: false,
            width: 1200,
            height: 300
        };

        // Convert times to Date objects and then to timestamps (milliseconds)
        const startTimes = timelineData.map(item => new Date(item.startTime).getTime());
        const endTimes = timelineData.map(item => new Date(item.endTime).getTime());

        // Find the earliest start time and the latest end time
        const earliestStart = new Date(Math.min(...startTimes));
        const latestEnd = new Date(Math.max(...endTimes));

        // console.log("Earliest Start Time:", earliestStart.toISOString());
        // console.log("Latest End Time:", latestEnd.toISOString());

        const minTimeUnit = (latestEnd - earliestStart) / 50;

        // console.log(timelineData);

        // Adjust endTime if the duration is less than minTimeUnit
        const dataRows = timelineData.map(item => {
            const startTime = new Date(item.startTime);
            let endTime = new Date(item.endTime);

            const duration = endTime - startTime;
            if (duration < minTimeUnit) {
                endTime = new Date(startTime.getTime() + minTimeUnit);
            }

            return [
                item.committer,
                item.committer,
                item.style || '',
                startTime,
                endTime
            ];
        });
        // const dataRows = [[
        //     'test', 'vvvvss', , new Date('2024-07-23T19:15:57.000+00:00'), new Date('2024-07-24T19:15:57.000+00:00')
        // ]];
        // console.log(dataRows);
        dataTable.addRows(dataRows);
        chart.draw(dataTable, options);
    };

    const deleteTeam = async () => {
        try {
            const deleteGitResponse = await fetch(`http://localhost:3001/repo/delete?owner=${username}&repo=${repoName}&token=${token}`, {
                method: 'POST'
            });
            if (!deleteGitResponse.ok) {
                throw new Error('刪除git儲存庫時出錯');
            }

            const deleteRepoResponse = await fetch(`http://localhost:8081/team-repos/${teamRepoId}`, {
                method: 'DELETE'
            });

            if (!deleteRepoResponse.ok) {
                throw new Error('刪除儲存庫時出錯');
            }

            alert('成功刪除儲存庫');

            navigate(`/teamRepo/?teamId=${teamId}`);

        } catch (error) {
            console.error('刪除過程中出錯:', error);
            alert(error);
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

    const handleBranchChange = (e) => {
        const branch = e.target.value;
        setSelectedBranch(branch);
        navigate(`/gitgraph?repo=${repoName}&branch=${branch}&owner=${teamData.owner}`);
    };

    const handleSettingsClick = () => setIsSettingsOpen(!isSettingsOpen);
    const handleCloseSettings = () => setIsSettingsOpen(false);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-300">
                <div className='inline-flex items-center whitespace-nowrap'>
                    <h1 className="text-xl font-bold mr-4">{teamName} / {repoName}</h1>
                    <div className="relative mt-2">
                        <select
                            value={selectedBranch}
                            onChange={handleBranchChange}
                            className="block appearance-none bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                        >
                            {branches.map((branch) => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </select>
                    </div>
                </div>


                <button className="text-blue-500" onClick={handleSettingsClick}>儲存庫設定</button>
            </div>
            <div className="flex flex-col h-full">
                <div className="flex-grow">
                    {timelineData.length <= 1 ? (
                        <div>尚無分支資料</div>
                    ) : (
                        <div id="timeLineChart" className='p-3 h-80'>
                            {/* 在這裡渲染時間線圖表的內容 */}
                        </div>
                    )}
                </div>
                <div className="h-1/4 flex mb-2 justify-between items-center">
                    <Link to={`/branchchart?teamId=${teamId}&teamName=${teamName}&repoId=${teamRepoId}&repoName=${repoName}`} className="max-w-xs p-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        分支進度圖
                    </Link>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
                    <div className="modal-content bg-white p-8 rounded relative">
                        <span className="close-button cursor-pointer absolute top-2 right-2" onClick={handleCloseModal}>&times;</span>
                        <h2 className="text-2xl font-bold mb-4">確認刪除</h2>
                        <p className="mb-4">確定要刪除儲存庫嗎？</p>
                        <button onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2">確認</button>
                        <button onClick={handleCloseModal} className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2">取消</button>
                    </div>
                </div>
            )}
            {isSettingsOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="flex flex-col w-[35%] h-[80%] rounded-xl shadow-lg overflow-hidden bg-white">
                        <div className='flex flex-col h-full relative'>
                            <div className="p-3 m-3 flex border-b">
                                <h2>團隊設定</h2>
                                <button className='ml-auto' onClick={handleCloseSettings}>✕</button>
                            </div>
                            <div className='p-5'>
                                {teamData.owner === username && (
                                    <button onClick={handleDeleteClick} className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                        刪除儲存庫
                                    </button>)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamOverview;
