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
    const [chartsLoaded, setChartsLoaded] = useState(false);


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

    // useEffect(() => {
    //     const postGraphBranch = async () => {
    //         try {
    //             const postGraphBranchResponse = await fetch(`http://localhost:8080/graph/upload?owner=${username}&repo=${repoName}`, {
    //                 method: 'POST'
    //             });
    //             if (!postGraphBranchResponse.ok) {
    //                 throw new Error('上傳分支圖失敗');
    //             }
    //         } catch (error) {
    //             console.log(error);
    //         }
    //     }

    //     if (timelineData.length > 0 && teamData.owner === username) {
    //         postGraphBranch();
    //     }
    // }, [teamData, username, timelineData]);
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
        dataTable.addRows(dataRows);
        chart.draw(dataTable, options);
    };




    return (
        <div id="timeLineChart" className='p-3 h-80'>
            {/* 在這裡渲染時間線圖表的內容 */}
        </div>
    );
};

export default BranchChart;
