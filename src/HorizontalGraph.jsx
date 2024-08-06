import React, { useState, useEffect } from "react";
import {
    Gitgraph,
    templateExtend,
    TemplateName,
    Orientation
} from "@gitgraph/react";
import "tailwindcss/tailwind.css";
import Cookies from "js-cookie";

const username = Cookies.get('username');

const withoutAuthor = templateExtend(TemplateName.Metro, {
    commit: {
        message: {
            displayAuthor: false
        }
    }
});

const HorizontalGraph = () => {
    const [commitData, setCommitData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCommitData = async () => {
            try {
                const queryParams = new URLSearchParams(window.location.search);
                const branch = queryParams.get('branch');
                const repo = queryParams.get('repo');
                const response = await fetch(`http://localhost:8080/flow-commit/ouoxii/${repo}?branch=${branch}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const transformedData = transformCommitData(data);
                console.log("Transformed Commit Data:", transformedData);
                setCommitData(transformedData);
            } catch (error) {
                console.error("Error fetching commit data:", error);
                setError(error);
            }
        };

        fetchCommitData();
    }, []);

    useEffect(() => {
        console.log("Current Commit Data:", commitData);
    }, [commitData]);

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center p-4 border-b border-gray-300">
                    <h1 className="text-xl font-bold">個人分支圖</h1>
                </div>
                <div className="flex flex-col h-full p-4">
                    <p className="text-red-500">Error fetching commit data: {error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-300">
                <h1 className="text-xl font-bold">個人分支圖</h1>
                <button className="text-blue-500">個人分支圖設定</button>
            </div>
            <div className="flex flex-col h-full p-4 relative">
                {commitData.length > 0 && (
                    <Gitgraph
                        options={{
                            orientation: Orientation.Horizontal,
                            reverseArrow: true,
                            template: withoutAuthor
                        }}
                    >
                        {(gitgraph) => initGraph(gitgraph, commitData)}
                    </Gitgraph>
                )}
                <div id="tooltip" className="hidden absolute bg-white border border-gray-300 p-2 shadow-lg pointer-events-none z-50"></div>
                <table className="table-fixed mt-4">
                    <thead>
                        <tr>
                            <th className="w-1/5 px-4 py-2">Summary</th>
                            <th className="w-1/5 px-4 py-2">Description</th>
                            <th className="w-1/5 px-4 py-2">Author</th>
                            <th className="w-1/5 px-4 py-2">Date</th>
                            <th className="w-1/5 px-4 py-2">Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commitData.map((commit, index) => (
                            <tr key={index}>
                                <td className="border px-4 py-2">{commit.subject}</td>
                                <td className="border px-4 py-2">{commit.body}</td>
                                <td className="border px-4 py-2">{commit.author}</td>
                                <td className="border px-4 py-2">{commit.date}</td>
                                <td className="border px-4 py-2">{commit.hash}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function initGraph(gitgraph, commitData) {
    if (!commitData || commitData.length === 0) return;

    let branches = {};
    commitData.forEach(commit => {
        const queryParams = new URLSearchParams(window.location.search);
        const branchpram = queryParams.get('branch');
        if (!branches[commit.branch]) {
            branches[commit.branch] = gitgraph.branch(commit.branch);
        }
        const branch = branches[commit.branch];

        if (commit.type === "commit") {
            branch.commit({
                subject: commit.subject,
                body: commit.body,
                author: `${commit.author}, ${commit.date}`,
                hash: commit.hash,
                onMouseOver(commit) {
                    showTooltip(commit);
                },
                onMouseOut() {
                    hideTooltip();
                }
            });
        } else if (commit.type === "merge" && commit.branch !== "main") {
            console.log("Merging branch:", commit.branch);
            branches[branchpram].merge(branches["main"]);
        }
        else if (commit.type === "merge" && commit.branch === "main") {
            branches["main"].merge(branches[branchpram]);

        }
    });
}

function showTooltip(commit) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = `
    <strong>${commit.subject}</strong><br>
    ${commit.body}<br>
    <em>${commit.author.name}</em><br>
    <span>Hash: ${commit.hash}</span>
  `;
    tooltip.classList.remove("hidden");
    tooltip.style.left = `${commit.x + 10}px`;
    tooltip.style.top = `${commit.y + 10}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById("tooltip");
    tooltip.classList.add("hidden");
}
function transformCommitData(data) {
    return data
        .sort((a, b) => new Date(a.commitTime) - new Date(b.commitTime))
        .map((commit, index) => {
            const date = new Date(commit.commitTime);
            const localDate = date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Asia/Taipei'
            });
            return {
                type: commit.isMergeCommit ? "merge" : "commit",
                subject: commit.message.split("\n")[0],
                body: commit.message,
                author: commit.owner,
                date: localDate,
                branch: commit.isMainBranchCommit ? "main" : commit.flowBranch,
                hash: index.toString()
            };
        });
}


export default HorizontalGraph;
