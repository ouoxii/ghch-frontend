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
    const [loading, setLoading] = useState(true);  // 加入 loading 狀態
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
            } finally {
                setLoading(false);  // 加載完成
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

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        // 重置錯誤訊息
        setErrors({});

        // 前端表單驗證
        const newErrors = {};
        if (!inputData.title) newErrors.title = "標題是必填的";
        if (!inputData.description) newErrors.description = "描述是必填的";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // 透過 API 發送拉取請求資料
            const queryParams = new URLSearchParams(window.location.search);
            const branch = queryParams.get('branch');
            const repo = queryParams.get('repo');
            const owner = queryParams.get('owner');
            const token = Cookies.get('token'); // 假設 token 存在 cookies 中

            const response = await fetch(`http://localhost:3001/pr`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    owner: owner, // 擁有者
                    repo: repo, // 儲存庫名稱
                    title: inputData.title, // PR 標題
                    body: inputData.description, // PR 描述
                    head: branch, // 分支名稱
                    base: 'main', // 基礎分支名稱
                    token: token, // 授權 token
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Pull Request創建成功:", result);

            // 創建成功後導航到 PR 討論頁面或其他頁面
            // navigate('/PRDiscussion');
        } catch (error) {
            console.error("創建拉取請求錯誤:", error);
            setError(error);
        } finally {
            setShowForm(false);
        }
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
                </>
            )}

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
                                    {errors.description && <span className="error text-red-500">{errors.description}</span>}
                                </div>
                                <div className="p-3 form-group mb-2">
                                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
                                        創建Pull Request
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
