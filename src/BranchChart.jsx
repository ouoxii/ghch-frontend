import React, { useEffect, useState, useContext, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { DataContext } from './DataContext';
import './input.css'; // 引入 Tailwind CSS



const BranchChart = (/*帳號跟repo名稱*/) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const repoName = queryParams.get('repoName');
    const teamRepoId = queryParams.get('repoId');
    const teamName = queryParams.get('teamName');
    const username = Cookies.get('username');
    const token = Cookies.get('token');
    const teamId = queryParams.get('teamId');
    const [teamData, setTeamData] = useState({ id: '', teamName: '', owner: '' });
    const [timelineData, setTimelineData] = useState([]);
    const [tooltipData, setTooltipData] = useState([]);
    const [chartsLoaded, setChartsLoaded] = useState(false);

    const colors = [
        ["#00C896", "#4DEBBE", "#A8FDE5"],  // 薄荷綠
        ["#A200FF", "#C266FF", "#E6BFFF"],  // 螢光紫
        ["#FF6D3D", "#FF9C73", "#FFCEB8"],  // 亮珊瑚橙
        ["#00B8D4", "#48D7E6", "#B2EEF3"],  // 電光青
        ["#FFD600", "#FFE135", "#FFF59D"],  // 檸檬黃
        ["#2962FF", "#5C8AFF", "#A3C9FF"],  // 星空藍
        ["#FF5C8D", "#FF8DA7", "#FFD4E1"],  // 霧桃紅
        ["#43A047", "#66BB6A", "#B9F6CA"],  // 翠綠
        ["#00ACC1", "#26C6DA", "#E0F7FA"],  // 亮青藍
        ["#D500F9", "#EA80FC", "#F8E1FF"]   // 霓虹紫
    ];


    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const teamResponse = await fetch(`http://localhost:8081/teams/${teamId}`);
                if (!teamResponse.ok) {
                    throw new Error('無法獲取團隊資料');
                }
                const teamData = await teamResponse.json();
                setTeamData(teamData);
            } catch (error) {
                console.error('獲取團隊資料時出錯:', error);
                alert('獲取團隊資料時出錯');
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
            // await fetchLocalGraphBranch();
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
        const fetchLocalGraphBranch = async () => {
            try {
                const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=${username}&repo=${repoName}`);
                // const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=ouoxii&repo=hello4`);//指定repo
                // const chartDataResponse = await fetch(`http://localhost:8080/graph?owner=ntou01057042&repo=github-flow-tutor`);//指定repo
                if (!chartDataResponse.ok) {
                    if (chartDataResponse.status === 404) {
                        setTimelineData([]);
                        throw new Error('沒有本地端分支資料');
                    } else {
                        throw new Error('獲取本地端綜觀圖失敗');
                    }
                }
                const chartData = await chartDataResponse.json();
                const newChartData = chartData.filter(branch => branch.name !== 'HEAD');
                setTimelineData(newChartData);
            } catch (error) {
                console.log(error);
            }
        }

        const fetchCloudGraphBranch = async () => {
            try {
                if (teamData.owner) {
                    const clooudGraphBranchResponse = await fetch(`http://localhost:8081/cloud-graph-branch?owner=${teamData.owner}&repo=${repoName}`,
                        {
                            method: 'GET'
                        }
                    );
                    if (!clooudGraphBranchResponse.ok) {
                        if (clooudGraphBranchResponse.status === 404) {
                            setTimelineData([]);
                            throw new Error('沒有雲端分支資料');
                        } else {
                            throw new Error('獲取雲端分支資料失敗')
                        }
                    }
                    const chartData = await clooudGraphBranchResponse.json();
                    setTimelineData(chartData);
                }
            } catch (error) {
                console.log(error);
            }
        };

        if (teamData.owner === username) {
            fetchLocalGraphBranch();
        } else {
            fetchCloudGraphBranch();
        }

    }, [teamData, username, teamRepoId, repoName]);

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

    useEffect(() => {
        if (chartsLoaded && timelineData.length > 0) {
            drawChart();
        }
    }, [timelineData, chartsLoaded]);

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
            width: 1230,
            height: 300
        };

        // Convert times to Date objects and then to timestamps (milliseconds)
        const startTimes = timelineData.map(item => new Date(item.startTime).getTime());
        const endTimes = timelineData.map(item => new Date(item.endTime).getTime());

        // Find the earliest start time and the latest end time
        const earliestStart = new Date(Math.min(...startTimes));
        const latestEnd = new Date(Math.max(...endTimes));

        const minTimeUnit = (latestEnd - earliestStart) / 50;

        // Group commits by branch
        const branches = {};
        let totalCommit = 0;
        tooltipData.forEach(commit => {
            if (!branches[commit.branchName]) {
                branches[commit.branchName] = 0;
            }
            branches[commit.branchName]++;
            totalCommit++;
        });

        const branchCount = Object.keys(branches).length;
        const avgCommit = totalCommit / branchCount;

        // Adjust endTime if the duration is less than minTimeUnit
        let counter = 0;
        const committers = {};
        const dataRows = timelineData.map(item => {

            if (!committers[item.committer]) {
                committers[item.committer] = counter++;
            }

            const startTime = new Date(item.startTime);
            let endTime = new Date(item.endTime);

            const duration = endTime - startTime;
            if (duration < minTimeUnit) {
                endTime = new Date(startTime.getTime() + minTimeUnit);
            }

            if (branches[item.name] > avgCommit * 1.2)
                return [
                    item.committer,
                    item.committer,
                    colors[committers[item.committer] % 10][0],
                    startTime,
                    endTime
                ];
            else if (branches[item.name] < avgCommit * 0.8)
                return [
                    item.committer,
                    item.committer,
                    colors[committers[item.committer] % 10][2],
                    startTime,
                    endTime
                ];
            else
                return [
                    item.committer,
                    item.committer,
                    colors[committers[item.committer] % 10][1],
                    startTime,
                    endTime
                ];
        });
        dataTable.addRows(dataRows);
        chart.draw(dataTable, options);
    };

    return (

        <div className='flex flex-col justify-between p-4'>
            <div id="timeLineChart" className='pt-32 h-1/2'>
                {/* 在這裡渲染時間線圖表的內容 */}
            </div>
            <div className="h-10 flex mb-2 justify-between items-center">
                <Link to={`/team-overview?teamId=${teamId}&teamName=${teamName}&repoId=${teamRepoId}&repoName=${repoName}`} className="max-w-xs p-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    分支進度圖
                </Link>
            </div>
        </div>
    );
};

export default BranchChart;
