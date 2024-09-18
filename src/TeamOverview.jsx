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
    const [prData, setPrData] = useState([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('main');
    const [selectedPR, setSelectedPR] = useState("default");
    const [chartsLoaded, setChartsLoaded] = useState(false);
    const [branches, setBranches] = useState([]);
    const [repoExist, setRepoExist] = useState(null);
    const [loading, setLoading] = useState(true);  // 新增 loading 狀態

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setLoading(true);  // 資料加載前設置 loading 為 true
                const teamResponse = await fetch(`http://localhost:8081/teams/${teamId}`);
                if (!teamResponse.ok) {
                    throw new Error('無法獲取團隊資料');
                }
                const teamData = await teamResponse.json();
                setTeamData(teamData);
                await compareAndAcceptInvitations(teamId, token);

                // Fetch PR data
                const prResponse = await fetch(`http://localhost:3001/pr/list?owner=${teamData.owner}&repo=${repoName}&token=${token}`);
                if (!prResponse.ok) {
                    throw new Error('無法獲取PR資料');
                }
                const prData = await prResponse.json();
                setPrData(prData);
            } catch (error) {
                console.error('獲取團隊資料時出錯:', error);
                alert('獲取團隊資料時出錯');
                navigate('/');
            } finally {
                setLoading(false);  // 資料加載完成後設置 loading 為 false
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
    }, [teamId, token, repoName]);

    useEffect(() => {
        const checkRepo = async () => {
            if (!teamData.owner) return;

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
        };

        checkRepo();
    }, [teamData.owner, repoName]);

    useEffect(() => {
        const fetchLocalGraphBranch = async () => {
            try {
                const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=${username}&repo=${repoName}`);
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
                setBranches([...chartData.filter(branch => branch.name !== 'HEAD').map(branch => branch.name)]);
            } catch (error) {
                console.log(error);
            }
        };

        const fetchCloudGraphBranch = async () => {
            try {
                if (teamData.owner) {
                    const cloudGraphBranchResponse = await fetch(`http://localhost:8081/cloud-graph-branch?owner=${teamData.owner}&repo=${repoName}`);
                    if (!cloudGraphBranchResponse.ok) {
                        if (cloudGraphBranchResponse.status === 404) {
                            setTimelineData([]);
                            throw new Error('沒有雲端分支資料');
                        } else {
                            throw new Error('獲取雲端分支資料失敗');
                        }
                    }
                    const chartData = await cloudGraphBranchResponse.json();
                    setTimelineData(chartData);
                    const uniqueBranches = [...new Set(chartData.filter(branch => branch.name !== 'HEAD').map(branch => branch.name))];
                    setBranches([...uniqueBranches]);
                }
            } catch (error) {
                console.log(error);
            }
        };

        const cloneRepo = async () => {
            try {
                const cloneRepoResponse = await fetch(`http://localhost:8080/git-repo/clone?repoOwner=${teamData.owner}&repoName=${repoName}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!cloneRepoResponse.ok) {
                    throw new Error('clone repo fail');
                }
                setRepoExist(true);
            } catch (error) {
                alert(error);
            }
        };

        if (repoExist) {
            if (teamData.owner === username) {
                fetchLocalGraphBranch();
            } else {
                fetchCloudGraphBranch();
            }
        } else if (repoExist === false) {
            alert('偵測到repo不存在本地端，將自動為您clone');
            cloneRepo();
        }
    }, [repoExist, teamData.owner, repoName, username]);

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
        };

        if (timelineData.length > 0 && teamData.owner === username) {
            postGraphBranch();
        }
    }, [teamData.owner, username, timelineData, repoName]);

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

        const startTimes = timelineData.map(item => new Date(item.startTime).getTime());
        const endTimes = timelineData.map(item => new Date(item.endTime).getTime());

        const earliestStart = new Date(Math.min(...startTimes));
        const latestEnd = new Date(Math.max(...endTimes));
        const minTimeUnit = (latestEnd - earliestStart) / 50;

        const dataRows = timelineData.map(item => {
            const startTime = new Date(item.startTime);
            let endTime = new Date(item.endTime);

            const duration = endTime - startTime;
            if (duration < minTimeUnit) {
                endTime = new Date(startTime.getTime() + minTimeUnit);
            }

            return [
                item.committer,
                item.name,
                item.style || '',
                startTime,
                endTime
            ];
        });

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

    const handleDeleteClick = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);
    const handleConfirmDelete = () => {
        deleteTeam();
        setIsModalOpen(false);
    };

    const handleBranchChange = (e) => {
        if (e.target.value === "main") return;
        const branch = e.target.value;
        setSelectedBranch(branch);
        navigate(`/gitgraph?repo=${repoName}&branch=${branch}&owner=${teamData.owner}`);
    };

    const handlePRChange = (e) => {
        if (e.target.value === "default") return; // 如果選擇的是默認選項，則不執行任何操作

        const selectedPR = JSON.parse(e.target.value);
        setSelectedPR(selectedPR.number);

        console.log("Selected PR Number:", selectedPR.number);
        console.log("Selected PR Title:", selectedPR.title);

        navigate(`/PRDiscussion?number=${selectedPR.number}&title=${encodeURIComponent(selectedPR.title)}`, { state: { owner: teamData.owner, repo: repoName, teamName: teamData.teamName } });
    };

    const handleSettingsClick = () => setIsSettingsOpen(!isSettingsOpen);
    const handleCloseSettings = () => setIsSettingsOpen(false);

    return (
        <div className="container mx-auto p-4">
            {loading ? (
                // 顯示轉圈圈動畫
                <div role="status" className="flex justify-center items-center w-full h-full">
                    <svg aria-hidden="true" className="w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                    </svg>
                    <span className="sr-only">Loading...</span>
                </div>
            ) : (
                <>
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

                            <div className="relative mt-2">
                                <select
                                    value={selectedPR}
                                    onChange={handlePRChange}
                                    className="block appearance-none bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                                >
                                    <option value="default" disabled>select PR</option> {/* 默認選項 */}
                                    {prData.map(prInfo => (
                                        <option
                                            key={prInfo.id}
                                            value={JSON.stringify({ number: prInfo.number, title: prInfo.title })}
                                            className="flex items-center mb-2"
                                        >
                                            {prInfo.title}
                                        </option>
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
                            <Link to={`/branchchart?teamId=${teamId}&teamName={teamName}&repoId=${teamRepoId}&repoName=${repoName}`} className="max-w-xs p-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                分支進度圖
                            </Link>
                        </div>
                    </div>
                </>
            )}

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
                                    </button>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamOverview;
