import React, { useState, useEffect, useContext, useRef } from 'react';
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
    const [tooltipData, setTooltipData] = useState([]);
    const [localTimelineData, setLocalTimelineData] = useState([]);
    const [chartFinish, setChartsfinish] =  useState(false);

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
                window.google.charts.load('current', { packages: ['corechart'] });
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
                const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=${username}&repo=${repoName}`);
                // const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=ntou01057042&repo=github-flow-tutor`);//指定repo
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

        const fetchUserLocalGraphBranch = async () => {
            try {
                const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=${teamData.owner}&repo=${repoName}`);
                // const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=ouoxii&repo=hello4`);//指定repo
                // const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=ntou01057042&repo=github-flow-tutor`);//指定repo
                if (!chartDataResponse.ok) {
                    if (chartDataResponse.status === 404) {
                        setLocalTimelineData([]);
                        throw new Error('沒有使用者本地端分支資料');
                    } else {
                        throw new Error('獲取使用者本地端綜觀圖失敗');
                    }
                }
                const chartData = await chartDataResponse.json();
                const newChartData = chartData.filter(branch => branch.name !== 'HEAD');
                setLocalTimelineData(newChartData);
            } catch (error) {
                console.log(error);
            }
        }

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

            if (teamData.owner !== '') {
                if (teamData.owner === username) {
                    fetchLocalGraphBranch();
                    fetchUserLocalGraphBranch();
                } else {
                    fetchCloudGraphBranch();
                    fetchUserLocalGraphBranch();
                }
            }
        } else if (repoExist === false) {
            alert('偵測到repo不存在本地端，將自動為您clone');
            cloneRepo();
        }

    }, [repoExist])

    useEffect(() => {
        if (chartsLoaded && timelineData.length > 0 && tooltipData.length > 0 && localTimelineData.length > 0) {
            drawTooltipCharts();
            setChartsfinish(true);
        }
    }, [timelineData, chartsLoaded, tooltipData, localTimelineData]);

    useEffect(() => {
        const postGraphBranch = async () => {
            console.log(timelineData)
            console.log(tooltipData)
            try {
                const postGraphBranchResponse = await fetch(`http://localhost:8080/graph/upload?owner=${username}&repo=${repoName}`,
                    {
                        method: 'POST'
                    }
                );
                if (!postGraphBranchResponse.ok) {
                    throw new Error('上傳分支圖失敗');
                }
            } catch (error) {
                console.log(error);
            }
        }

        if (timelineData.length > 0 && teamData.owner === username && tooltipData.length > 0) {
            postGraphBranch();
        }
    }, [teamData, username, timelineData, tooltipData, repoName])

    useEffect(() => {
        const fetchLocalGraphCommit = async () => {
            try {
                const commitstDataResponse = await fetch(`http://localhost:8080/graph/commits?owner=${username}&repo=${repoName}`);
                // const commitstDataResponse = await fetch(`http://localhost:8080/graph/commits?owner=ouoxii&repo=hello4`);//指定repo
                // const commitstDataResponse = await fetch(`http://localhost:8080/graph/commits?owner=ntou01057042&repo=github-flow-tutor`);//指定repo
                if (!commitstDataResponse.ok) {
                    if (commitstDataResponse.status === 404) {
                        setTimelineData([]);
                        throw new Error('沒有本地端commits資料');
                    } else {
                        throw new Error('獲取本地端commits失敗');
                    }
                }
                const commitsData = await commitstDataResponse.json();
                const newCommitData = commitsData.filter(commit => commit.branchName !== 'HEAD')
                setTooltipData(newCommitData);
            } catch (error) {
                console.log(error);
            }
        }

        const fetchCloudGraphCommit = async () => {
            try {
                if (teamData.owner) {
                    const clooudGraphBranchResponse = await fetch(`http://localhost:8081/cloud-graph-commit?owner=${teamData.owner}&repo=${repoName}`,
                        {
                            method: 'GET'
                        }
                    );
                    if (!clooudGraphBranchResponse.ok) {
                        if (clooudGraphBranchResponse.status === 404) {
                            setTimelineData([]);
                            throw new Error('沒有雲端commits資料');
                        } else {
                            throw new Error('獲取雲端commits資料失敗')
                        }
                    }
                    const commitsData = await clooudGraphBranchResponse.json();
                    const newCommitData = commitsData.filter(commit => commit.branchName !== 'HEAD')
                    setTooltipData(newCommitData);
                }
            } catch (error) {
                console.log(error);
            }
        };

        if (teamData.owner === username) {
            fetchLocalGraphCommit();
        } else {
            fetchCloudGraphCommit();
        }

    }, [teamData, username, teamRepoId, repoName])

    const drawTooltipCharts = () => {

        console.log(timelineData)
        console.log(tooltipData)
        console.log(localTimelineData)
        const tooltipOptions = {
            title: 'Commit frequency',
            legend: 'none',
            hAxis: {
                format: 'M/d',
            }
        };

        // Convert times to Date objects and then to timestamps (milliseconds)
        const startTimes = timelineData.map(item => new Date(item.startTime).getTime());
        const endTimes = timelineData.map(item => new Date(item.endTime).getTime());

        // Find the earliest start time and the latest end time
        const earliestStart = new Date(Math.min(...startTimes));
        const latestEnd = new Date(Math.max(...endTimes));

        const minTimeUnit = (latestEnd - earliestStart) / 500 + 43200000;

        // console.log(timelineData);
        const localBranch = [];
        // Adjust endTime if the duration is less than minTimeUnit
        const dataRows = localTimelineData.flatMap(item => {
            let localStartTime = new Date(item.startTime);
            let localEndTime = new Date(item.endTime);

            let endTime = timelineData.find(cloud => cloud.name === item.name)?.endTime;
            endTime = endTime ? new Date(endTime) : null;

            const rows = [];
            const localColor = '#A2A4B0';

            let startTime
            if (!endTime) { //本地端才有的分支
                let localBranchName = item.name + "(not push yet)"
                localBranch.push(localBranchName);
                const duration = localEndTime - localStartTime;
                console.log(item.name + duration);
                let adjEndTime = localEndTime;
                if (duration < minTimeUnit) {
                    adjEndTime = new Date(localStartTime.getTime() + minTimeUnit);
                }

                rows.push([
                    item.committer || item.name,
                    localBranchName,
                    localColor,
                    localStartTime,
                    adjEndTime
                ]);
            }
            else if (localEndTime > endTime && endTime !== 0) { //本地端進度超前的分支
                let localBranchName = item.name + "(not push yet)"
                localBranch.push(localBranchName);

                startTime = localStartTime;
                localStartTime = endTime;
                const duration = endTime - startTime;
                let localDuration = localEndTime - endTime;
                let adjEndTime = endTime;
                if (duration < minTimeUnit) {
                    adjEndTime = new Date(startTime.getTime() + minTimeUnit);
                    localStartTime = adjEndTime;
                    localDuration = localEndTime - localStartTime;
                }
                if (localDuration < minTimeUnit) {
                    localEndTime = new Date(localStartTime.getTime() + minTimeUnit);
                }
                rows.push([
                    item.committer || item.name,
                    item.name,
                    '',
                    startTime,
                    adjEndTime
                ]);
                rows.push([
                    item.committer || item.name,
                    localBranchName,
                    localColor,
                    localStartTime,
                    localEndTime
                ])
            } else { //本地端沒有超前的分支
                const duration = endTime - localStartTime;
                let adjEndTime = endTime;
                if (duration < minTimeUnit) {
                    adjEndTime = new Date(localStartTime.getTime() + minTimeUnit);
                }

                rows.push([
                    item.committer || item.name,
                    item.name,
                    '',
                    localStartTime,
                    adjEndTime
                ]);
            }

            return rows;
        });

        //調整資料以符合需求
        for (let i = 0; i < dataRows.length; i++) {
            dataRows[i].splice(2, 0, null);
        }

        // Group commits by branch
        const branches = {};
        tooltipData.forEach(commit => {
            if (!branches[commit.branchName]) {
                branches[commit.branchName] = [];
            }
            branches[commit.branchName].push(new Date(commit.commitTime));
        });

        // Find the end time for each branch (last commit time)
        const branchEndTimes = {};
        for (const branch in branches) {
            branchEndTimes[branch] = new Date(Math.max(...branches[branch]));
        }

        // Calculate the range (end time - 2 weeks)
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const TWO_WEEKS_MS = 13 * MS_PER_DAY;

        // initial
        const branchCommitCounts = {};
        for (const branch in branches) {
            const dailyCounts = {};
            for (let d = new Date(branchEndTimes[branch].getTime() - TWO_WEEKS_MS); d <= branchEndTimes[branch]; d.setDate(d.getDate() + 1)) {
                const day = d.toISOString().split('T')[0];
                dailyCounts[day] = 0;
                branchCommitCounts[branch] = dailyCounts;
            }
        }

        for (const branch in branches) {
            const endTime = branchEndTimes[branch];
            const startTime = new Date(endTime.getTime() - TWO_WEEKS_MS);
            branches[branch].forEach(commitTime => {
                if (commitTime >= startTime && commitTime <= endTime) {
                    const day = commitTime.toISOString().split('T')[0];
                    branchCommitCounts[branch][day]++;
                }
            });
        }

        // Output the commit counts for each branch

        let tooltipDataArray = [];
        for (let i = 0; i < 15; i++) {
            tooltipDataArray[i] = [];
        }

        for (let i = 0; i < dataRows.length - 1; i++) {
            tooltipDataArray[0][i] = 'date';
            tooltipDataArray[0][dataRows.length - 1 + i] = dataRows[i + 1][1];
        }

        let j = 0;
        console.log(branchCommitCounts);
        for (const branch in branchCommitCounts) {

            const day = Object.keys(branchCommitCounts[branch]);
            for (let i = 1; i < 15; i++) {
                tooltipDataArray[i][j] = new Date(day[i - 1]);
                const num = branchCommitCounts[branch][day[i - 1]];
                tooltipDataArray[i][j + dataRows.length - 1] = num;
            }
            j++;
        }

        //調整資料以符合需求
        console.log(dataRows)
        for (let i = 0; i < tooltipDataArray.length; i++) {
            if (i === 0) {
                tooltipDataArray[i].splice(0, 0, 'date');
                tooltipDataArray[i].splice(dataRows.length, 0, 'main');
            } else {
                tooltipDataArray[i].splice(0, 0, "");
                tooltipDataArray[i].splice(dataRows.length, 0, null);
            }
        }

        // 找localbranch對應的位址
        const localBranchInd = localBranch.map(name => {
            return tooltipDataArray[0].indexOf(name);
        });

        console.log(localBranchInd);
        localBranchInd.forEach(index => {
            for (let i = 1; i < tooltipDataArray.length; i++) {
                tooltipDataArray[i][index - dataRows.length] = '';
                tooltipDataArray[i][index] = '';
            }
        });

        console.log(tooltipDataArray);

        const data = new window.google.visualization.arrayToDataTable(tooltipDataArray);
        const view = new window.google.visualization.DataView(data);

        for (let i = 0; i < dataRows.length; i++) {
            view.setColumns([i, i + dataRows.length]);
            const hiddenDiv = document.getElementById('hidden_div');
            const tooltipChart = new window.google.visualization.ColumnChart(hiddenDiv);

            window.google.visualization.events.addListener(tooltipChart, 'ready', function () {
                let tooltipImg = '<img src="' + tooltipChart.getImageURI() + '">';
                // console.log(timelineData)
                let commitDetail = '<p style="margin-left:50px; margin-bottom:5px; font-size:18px">' + tooltipDataArray[0][i + dataRows.length] + '<p>';
                dataRows[i][2] = tooltipImg + commitDetail;
            });
            tooltipChart.draw(view, tooltipOptions);
        }
        drawPrimaryChart(dataRows);
    }

    const drawPrimaryChart = (dataRows) => {
        const visibleDiv = document.getElementById('branch_chart');
        const PrimaryChart = new window.google.visualization.Timeline(visibleDiv);
        const dataTable = new window.google.visualization.DataTable();
        dataTable.addColumn({ type: 'string', id: 'branch-type' });
        dataTable.addColumn({ type: 'string', id: 'branch-name' });
        dataTable.addColumn({
            type: 'string',
            label: 'Tooltip Chart',
            role: 'tooltip',
            'p': { 'html': true }
        });
        dataTable.addColumn({ type: 'string', id: 'style', role: 'style' });
        dataTable.addColumn({ type: 'date', id: 'Start' });
        dataTable.addColumn({ type: 'date', id: 'End' });

        // Convert times to Date objects and then to timestamps (milliseconds)
        const startTimes = timelineData.map(item => new Date(item.startTime).getTime());
        const endTimes = timelineData.map(item => new Date(item.endTime).getTime());

        // Find the earliest start time and the latest end time
        const earliestStart = new Date(Math.min(...startTimes));
        const latestEnd = new Date(Math.max(...endTimes));

        // console.log("Earliest Start Time:", earliestStart.toISOString());
        // console.log("Latest End Time:", latestEnd.toISOString());

        const scaleFactor = 2 / 10000000;
        const chartWidth = (latestEnd - earliestStart) * scaleFactor + 1000;

        const primaryOptions = {
            title: 'Team branch chart',
            // colors: ['#475468', '#365f9b', '#c6cfdc'],
            allowHtml: true,
            explorer: { axis: 'horizontal' },
            width: chartWidth,
            // height: 200
        };

        dataTable.addRows(dataRows);
        PrimaryChart.draw(dataTable, primaryOptions);
    }

    const scrollRef = useRef(null);

    //
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [timelineData, chartFinish]);

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
        <div className="container mx-auto p-4 h-full">
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
            <div className="flex flex-col justify-between">
                {timelineData.length <= 1 ? (
                    <div>尚無分支資料</div>
                ) : (
                    <>
                        <div id='hidden_div' className='hidden'></div>
                        <div id='branch_chart' ref={scrollRef} className="w-full h-96 p-4 ml-0 mr-4 my-4 shadow-lg bg-slate-50 overflow-auto"></div>
                    </>
                )}
                <div className="h-10 flex mb-2 justify-between items-center">
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
