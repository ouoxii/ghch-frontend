import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    const [showForm, setShowForm] = useState(false);
    const [inputData, setInputData] = useState({
        title: "",
        description: ""
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCommitData = async () => {
            const queryParams = new URLSearchParams(window.location.search);
            const branch = queryParams.get('branch');
            const repo = queryParams.get('repo');
            const owner = queryParams.get('owner');
            try {
                const response = await fetch(`http://localhost:8080/flow-commit/${owner}/${repo}?branch=${branch}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const transformedData = transformCommitData(data);
                setCommitData(transformedData);
            } catch (error) {
                console.error("加載個人分支圖錯誤:", error);
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

    const handleFormSubmit = (e) => {
        e.preventDefault();

        console.log("Input Data:", inputData);
        setShowForm(false);
        navigate('/PRDiscussion');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-300">
                <h1 className="text-xl font-bold">個人分支圖</h1>
                <button className="text-blue-500">個人分支圖設定</button>
            </div>
            <div className="flex justify-between items-center p-4 border-b">
                分支最近有{commitData.length}次提交
                <button className="ml-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setShowForm(true)}>Pull Request</button>
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

            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="flex flex-col w-[35%] h-[80%] rounded-xl shadow-lg overflow-hidden bg-white">
                        <div className='flex flex-col h-full relative'>
                            <div className="p-3 m-3 flex border-b">
                                <h2>創建拉取請求</h2>
                                <button className='ml-auto' onClick={() => setShowForm(false)}>✕</button>
                            </div>
                            <form id="createPullRequestForm" onSubmit={handleFormSubmit}>
                                <div className="p-3 form-group mb-2">
                                    <input
                                        type="text"
                                        name="title"
                                        value={inputData.title}
                                        onChange={handleInputChange}
                                        placeholder="標題"
                                        className="w-full p-2 border rounded"
                                    />
                                    {errors.title && <span className="error text-red-500">{errors.title}</span>}
                                </div>
                                <div className="p-3 form-group mb-2">
                                    <textarea
                                        name="description"
                                        value={inputData.description}
                                        onChange={handleInputChange}
                                        placeholder="描述"
                                        className="w-full p-2 border rounded"
                                    ></textarea>
                                </div>
                                <div className="p-3 form-group mb-2">
                                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
                                        創建拉取請求
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
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
