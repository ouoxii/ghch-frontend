import React from "react";
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

const commitData = [
    { type: "commit", subject: "one", body: "First commit on develop branch.", author: "Chen", date: "2024-07-27", branch: "develop", hash: "1" },
    { type: "commit", subject: "two", body: "Second commit on main branch.", author: "Wu", date: "2024-07-27", branch: "main", hash: "2" },
    { type: "commit", subject: "three", body: "Second commit on develop branch.", author: "Chen", date: "2024-07-26", branch: "develop", hash: "3" },
    { type: "merge", subject: "Merge develop into main", body: "", author: "System", date: "2024-07-27", from: "develop", to: "main", hash: "4" },
    { type: "commit", subject: "Four", body: "Another commit on main after merging develop.", author: "Chen", date: "2024-07-27", branch: "main", hash: "5" },
    { type: "commit", subject: "Five", body: "Another commit on develop after merging into main.", author: "Chen", date: "2024-07-27", branch: "develop", hash: "6" },
    { type: "merge", subject: "Merge main into develop", body: "", author: "System", date: "2024-07-27", from: "main", to: "develop", hash: "7" },
    { type: "commit", subject: "Six", body: "Final commit after merging develop.", author: "Chen", date: "2024-07-27", branch: "main", hash: "8" }
];

const HorizontalGraph = () => {
    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-300">
                <h1 className="text-xl font-bold">個人分支圖</h1>
                <button className="text-blue-500">個人分支圖設定</button>
            </div>
            <div className="flex flex-col h-full p-4 relative">
                <Gitgraph
                    options={{
                        orientation: Orientation.Horizontal,
                        reverseArrow: true,
                        template: withoutAuthor
                    }}
                >
                    {initGraph}
                </Gitgraph>
                <div id="tooltip" className="hidden absolute bg-white border border-gray-300 p-2 shadow-lg pointer-events-none z-50"></div>
                <table className="table-fixed mt-4">
                    <thead>
                        <tr>
                            <th className="w-1/4 px-4 py-2">Summary</th>
                            <th className="w-1/4 px-4 py-2">Description</th>
                            <th className="w-1/4 px-4 py-2">Author</th>
                            <th className="w-1/4 px-4 py-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commitData.map((commit, index) => (
                            <tr key={index}>
                                <td className="border px-4 py-2">{commit.subject}</td>
                                <td className="border px-4 py-2">{commit.body}</td>
                                <td className="border px-4 py-2">{commit.author}</td>
                                <td className="border px-4 py-2">{commit.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function initGraph(gitgraph) {
    let main, develop;

    commitData.forEach(commit => {
        if (commit.type === "commit") {
            if (!main && commit.branch === "main") {
                main = gitgraph.branch("main");
            }
            if (!develop && commit.branch === "develop") {
                develop = gitgraph.branch('develop');
            }
            const branch = commit.branch === "main" ? main : develop;
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
        } else if (commit.type === "merge") {
            const fromBranch = commit.from === "main" ? main : develop;
            const toBranch = commit.to === "main" ? main : develop;
            toBranch.merge(fromBranch, {
                subject: commit.subject,
                author: `${commit.author}, ${commit.date}`,
                hash: commit.hash,
                onMouseOver(commit) {
                    showTooltip(commit);
                },
                onMouseOut() {
                    hideTooltip();
                }
            });
        }
    });
}

function showTooltip(commit) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = `
    <strong>${commit.subject}</strong><br>
    ${commit.body}<br>
    <em>${commit.author}</em><br>
  `;
    tooltip.classList.remove("hidden");
    tooltip.style.left = `${commit.x + 10}px`;
    tooltip.style.top = `${commit.y + 10}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById("tooltip");
    tooltip.classList.add("hidden");
}

export default HorizontalGraph;
