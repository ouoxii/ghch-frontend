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
            </div>
        </div>
    );
};

function initGraph(gitgraph) {
    const main = gitgraph.branch("main");
    main.commit();
    const develop = gitgraph.branch('develop');
    develop.commit({
        subject: "one",
        body: "First commit on develop branch.",
        author: "Chen, 2024-07-27",
        hash: "1",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    main.commit({
        subject: "two",
        body: "Second commit on main branch.",
        author: "Wu, 2024-07-27",
        hash: "2",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    develop.commit({
        subject: "three",
        body: "Second commit on develop branch.",
        author: "Chen, 2024-07-27",
        date: "2024-07-26",
        hash: "3",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    develop.merge(main);
    main.commit({
        subject: "Four",
        body: "Another commit on main after merging develop.",
        author: "Chen, 2024-07-27",
        hash: "5",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    develop.commit({
        subject: "Five",
        body: "Another commit on develop after merging into main.",
        author: "Chen, 2024-07-27",
        hash: "6",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    main.merge(develop);
    main.commit({
        subject: "Six",
        body: "Final commit after merging develop.",
        author: "Chen, 2024-07-27",
        hash: "8",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
}

function showTooltip(commit) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = `
    <strong>${commit.subject}</strong><br>
    ${commit.body}<br>
    <em>${commit.author.name}</em><br>
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
