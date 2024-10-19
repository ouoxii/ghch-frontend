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
import AssistnatBox from './AssistantBox';

const username = Cookies.get('username');

const withoutAuthor = templateExtend(TemplateName.Metro, {
    commit: {
        message: {
            displayAuthor: false
        }
    }
});

const HorizontalGraph = () => {
    const location = useLocation();
    const [commitData, setCommitData] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);  // 加入 loading 狀態
    const [showForm, setShowForm] = useState(false);
    const [inputData, setInputData] = useState({
        title: "",
        description: ""
    });
    const [prData, setPrData] = useState([]);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(window.location.search);
    const branch = queryParams.get('branch');
    const repo = queryParams.get('repo');
    const owner = queryParams.get('owner');
    const teamName = queryParams.get('teamName');

    useEffect(() => {
        console.log(teamName)
        const fetchCommitData = async () => {
            try {
                // 加載分支的 commit 數據
                const response = await fetch(`http://localhost:8080/flow-commit/${owner}/${repo}?branch=${branch}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const transformedData = transformCommitData(data);
                setCommitData(transformedData);

                // 檢查該 branch 是否已有 PR
                const prResponse = await fetch(`http://localhost:3001/pr/check-pr?owner=${owner}&repo=${repo}&head=${branch}&token=${Cookies.get('token')}`);
                if (!prResponse.ok) {
                    throw new Error('無法檢查是否已有 PR');
                }

                const prData = await prResponse.json();

                // 如果已有 PR，記錄 PR 狀態
                if (prData.length > 0) {
                    console.log(`Branch ${branch} 已經有一個開啟的 PR:`, prData[0]);
                    setPrData(prData);
                    return; // 如果已有 PR，就結束函數
                } else {
                    console.log(`Branch ${branch} 沒有開啟的 PR`);
                }

                // // 如果尚未有 PR，檢查 diff 狀態
                // const diffResponse = await fetch(`http://localhost:3001/pr/pr-diff?owner=${owner}&repo=${repo}&base=main&head=${branch}&token=${Cookies.get('token')}`);
                // if (!diffResponse.ok) {
                //     throw new Error('無法獲取 PR DIFF 資料');
                // }

                // const diffData = await diffResponse.json();
                // console.log(diffData)

                // // 根據 diff 的狀態決定是否生成 PR
                // if (diffData.status === 'ahead') {
                //     handlePRgenerate(diffData); // 在這裡生成 PR
                // } else {
                //     console.log('當前狀態不需要生成 PR 描述 (status:', diffData.status, ')');
                // }
            } catch (error) {
                console.error("加載個人分支圖錯誤:", error);
                setError(error);
            } finally {
                setLoading(false);
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
    const handlePRgenerate = async (diffData) => {
        try {
            // 提取檔案變更的差異
            const patch = diffData.files_changed.map(file => file.patch).join('\n\n');

            const requestBody = {
                prompt: "請根據上述diff指令撰寫pull request的描述，保持格式良好，易於閱讀，使用空格和換行進行分段，並使用Markdown 格式使其看起來清晰易讀，至少100字描述。\n\n範本:\n\nPull Request: 標題\n概要\n- 簡要說明此pr中所做的變更。\n- 突顯這些變更的主要特點或重要部分。\n\n變更內容\n1. 檔案變更\n- 描述修改、添加或刪除的檔案\n- 總結更改添加或刪除的程式碼行數。\n2. 功能改進\n- 列出任何功能改進或修正\n- 說明這些變更的目的",
                diffMessage: patch,
            };

            // 在這裡輸出請求的 body
            console.log("Request Body:", JSON.stringify(requestBody, null, 2));

            const generateResponse = await fetch(`http://localhost:3001/pr/generate-pr`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!generateResponse.ok) {
                throw new Error('無法生成PR描述');
            }

            const generateData = await generateResponse.json();
            const formattedDescription = generateData.answer.replace(/\\n/g, '\n');

            const titleMatch = formattedDescription.match(/"title":\s*"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : '';

            // 提取 AI Reviewer 的評論
            const reviewCommentMatch = formattedDescription.match(/"aiReviewComment":\s*{\s*"reviewer":\s*"[^"]+",\s*"comment":\s*"([^"]+)"/);
            const aiReviewComment = reviewCommentMatch ? reviewCommentMatch[1] : '';
            // 提取 mergeApproval
            const mergeApprovalMatch = formattedDescription.match(/"mergeApproval":\s*"([^"]+)"/);
            const mergeApproval = mergeApprovalMatch ? mergeApprovalMatch[1] : '';
            console.log("AI Review Comment:", aiReviewComment);

            // 將生成的描述和評論更新到狀態
            setInputData((prevState) => ({
                ...prevState,
                title: title,
                description: formattedDescription,
                aiReviewComment: aiReviewComment,
                mergeApproval: mergeApproval
            }));

        } catch (error) {
            console.error("PR描述生成錯誤:", error);
            setError(error);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        setErrors({});

        const newErrors = {};
        if (!inputData.title) newErrors.title = "標題是必填的";
        if (!inputData.description) newErrors.description = "描述是必填的";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const queryParams = new URLSearchParams(window.location.search);
            const branch = queryParams.get('branch');
            const repo = queryParams.get('repo');
            const owner = queryParams.get('owner');
            const token = Cookies.get('token');

            const response = await fetch(`http://localhost:3001/pr`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    owner: owner,
                    repo: repo,
                    title: inputData.title,
                    body: inputData.description,
                    head: branch,
                    base: 'main',
                    token: token,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Pull Request創建成功:", result);

            // 使用 aiReviewComment 進行 AI 評論的創建
            const aiReviewResponse = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    repoName: repo,
                    pullNumber: result.pullNumber,
                    content: inputData.aiReviewComment,
                    mergeApproval: inputData.mergeApproval,
                })
            });

            if (!aiReviewResponse.ok) {
                throw new Error('無法創建ai review');
            }

            // 創建成功後導航到 PR 討論頁面或其他頁面
            navigate(`/PRDiscussion?number=${result.pullNumber}&title=${encodeURIComponent(inputData.title)}`, { state: { owner: owner, repo: repo, teamName: teamName } });
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

    const mergeMain = async () => {
        try {
            const mergeMainRes = await fetch(`http://localhost:8080/branch/sync-main/${owner}/${repo}`, {
                method: 'POST'
            });
            if (!mergeMainRes.ok) {
                throw new Error('Merge main 失敗');
            }
            window.alert('Merge main 成功');
        } catch (error) {
            window.alert(error);
        }
    }

    const gitHubPush = async () => {
        try {
            const gitHubPushRes = await fetch(`http://localhost:8080/branch/push/${owner}/${repo}`, {
                method: 'POST'
            });
            if (!gitHubPushRes.ok) {
                throw new Error('Push GitHub時出錯');
            }

            const uploadBranchRes = await fetch(`http://localhost:8080/branch/upload/${owner}/${repo}?branch=${branch}`, {
                method: 'POST'
            });
            if (!uploadBranchRes.ok) {
                throw new Error('更新分支到雲端資料時出錯');
            }
            window.alert("Push成功");
        } catch (error) {
            window.alert(error);
        }
    }

    const BackToTeam = () => {
        window.history.back(); // 返回上一页
    }

    const handlePR = async () => {
         // 如果尚未有 PR，檢查 diff 狀態
         const diffResponse = await fetch(`http://localhost:3001/pr/pr-diff?owner=${owner}&repo=${repo}&base=main&head=${branch}&token=${Cookies.get('token')}`);
         if (!diffResponse.ok) {
             throw new Error('無法獲取 PR DIFF 資料');
         }

         const diffData = await diffResponse.json();
         console.log(diffData)

         // 根據 diff 的狀態決定是否生成 PR
         if (diffData.status === 'ahead') {
             await handlePRgenerate(diffData); // 在這裡生成 PR
         } else {
             console.log('當前狀態不需要生成 PR 描述 (status:', diffData.status, ')');
         }
         setShowForm(true)
    }

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
                        <div>
                            <button className="ml-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={gitHubPush}>Push</button>
                            <button className="ml-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={mergeMain}>Merge main</button>
                            {prData.length <= 0 && (
                                <button className="ml-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={handlePR}>
                                    Pull Request
                                </button>
                            )}
                        </div>
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
                        <div className="h-60 overflow-auto">
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
                    <button className="h-10 max-w-48 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute bottom-6 left-16" onClick={BackToTeam}>回到repo</button>
                    <div className='absolute bottom-6 right-10'>
                        <AssistnatBox text="個人分支圖提供分支內 commit 的詳細資訊，完成分支後透過 pull request 來提出合併分支請求。" />
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
                                <div className="p-3 form-group mb-2" >
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
    console.log("Commit Data:", commitData);
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
    <em>${commit.author}</em><br>
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
