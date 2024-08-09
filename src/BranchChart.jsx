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
    const [tooltipData, setTooltipData] = useState([]);

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
                window.google.charts.load('current', { packages: ['corechart'] });
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
                const newChartData = chartData.filter(branch => branch.name != 'HEAD');
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

    }, [teamData, username, teamRepoId])

    useEffect(() => {
        if (chartsLoaded && timelineData.length > 0 && tooltipData.length > 0) {
            drawTooltipCharts();
        }
    }, [timelineData, chartsLoaded, tooltipData]);

    useEffect(() => {
        const postGraphBranch = async () => {
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

        if (timelineData.length > 0 && teamData.owner === username) {
            postGraphBranch();
        }
    }, [teamData, username, timelineData])

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
                const newCommitData = commitsData.filter(commit => commit.branchName != 'HEAD')
                setTooltipData(newCommitData);
            } catch (error) {
                console.log(error);
            }
        }

        // const fetchCloudGraphCommit = async () => {
        //     try {
        //         if (teamData.owner) {
        //             const clooudGraphBranchResponse = await fetch(`http://localhost:8081/cloud-graph-commit?owner=${teamData.owner}&repo=${repoName}`,
        //                 {
        //                     method: 'GET'
        //                 }
        //             );
        //             if (!clooudGraphBranchResponse.ok) {
        //                 if (clooudGraphBranchResponse.status === 404) {
        //                     setTimelineData([]);
        //                     throw new Error('沒有雲端分支資料');
        //                 } else {
        //                     throw new Error('獲取雲端分支資料失敗')
        //                 }
        //             }
        //             const chartData = await clooudGraphBranchResponse.json();
        //             setTimelineData(chartData);
        //         }
        //     } catch (error) {
        //         console.log(error);
        //     }
        // };

        if (teamData.owner === username) {
            fetchLocalGraphCommit();
        } else {
            fetchLocalGraphCommit();
        }

    }, [teamData, username, teamRepoId])

    const drawTooltipCharts = () => {
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

        // console.log("Earliest Start Time:", earliestStart.toISOString());
        // console.log("Latest End Time:", latestEnd.toISOString());

        const minTimeUnit = (latestEnd - earliestStart) / 500;

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
                item.committer || item.name,
                item.name,
                startTime,
                endTime
            ];
        });

        // const dataRows = timelineData.map(item => [
        //     item.committer || item.name,
        //     item.name,
        //     new Date(item.startTime),
        //     new Date(item.endTime)
        // ]);

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
        console.log(branchCommitCounts);

        let tooltipDataArray = [];
        for (let i = 0; i < 15; i++) {
            tooltipDataArray[i] = [];
        }

        for (let i = 0; i < dataRows.length - 1; i++) {
            tooltipDataArray[0][i] = 'date';
            tooltipDataArray[0][dataRows.length - 1 + i] = dataRows[i + 1][1];
        }

        let j = 0;
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
                tooltipDataArray[i].splice(0, 0, '');
                tooltipDataArray[i].splice(dataRows.length, 0, 0);
            }
        }
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
                let commitDetail = '<p style="margin-left:50px">' + tooltipDataArray[0][i+timelineData.length] + '<p>';
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

        const scaleFactor = 2 / 1000000;
        const chartWidth = (latestEnd - earliestStart) * scaleFactor + 1000;

        const primaryOptions = {
            title: 'Team branch chart',
            // colors: ['#475468', '#365f9b', '#c6cfdc'],
            allowHtml: true,
            explorer: { axis: 'horizontal' },
            width: chartWidth,
            // height: 200
        };

        // const dataRows = timelineData.map(item => [
        //     item.name,
        //     item.committer,
        //     new Date(item.startTime),
        //     new Date(item.endTime)
        // ]);

        // //調整資料以符合需求
        // for (let i = 0; i < dataRows.length; i++) {
        //     dataRows[i].splice(2, 0, null);
        // }
        // console.log(dataRows);
        dataTable.addRows(dataRows);

        PrimaryChart.draw(dataTable, primaryOptions);
    }

    const scrollRef = useRef(null);

    //
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [timelineData, chartsLoaded]);

    return (
        <>
            <div id='hidden_div' className='hidden'></div>
            <div id='branch_chart' ref={scrollRef} className="w-screen h-96 p-4 ml-0 mr-4 my-4 shadow-lg bg-slate-50 overflow-auto"></div>
        </>
    );
};

export default BranchChart;
