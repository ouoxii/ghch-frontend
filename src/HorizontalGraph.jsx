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
            <div className="flex flex-col h-full p-4">
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
    var main = gitgraph.branch("main");
    main.commit({
        subject: "Initial commit",
        body: "This is the initial commit.",
        author: "John Doe, 2024-07-27",
    });

    var develop = gitgraph.branch('develop');
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
        body: "Second commit on master branch.",
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
    develop.merge(main, {
        subject: "Merge branch 'develop'",
        body: "Merged develop into master.",
        author: "Chen, 2024-07-27",
        hash: "4",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    main.commit("abc", {
        subject: "Merge branch 'develop'",
        body: "Merged develop into master.",
        author: "Chen, 2024-07-27",
        hash: "5",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    develop.commit("abc", {
        subject: "Merge branch 'develop'",
        body: "Merged develop into master.",
        author: "Chen, 2024-07-27",
        hash: "6",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    main.merge(develop, {
        subject: "Merge branch 'develop'",
        body: "Merged develop into master.",
        author: "Chen, 2024-07-27",
        hash: "7",
        onMouseOver(commit) {
            showTooltip(commit);
        },
        onMouseOut() {
            hideTooltip();
        }
    });
    main.commit("abc", {
        subject: "Merge branch 'develop'",
        body: "Merged develop into master.",
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
    console.log(commit.subject);
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = `
    <strong>${commit.subject}</strong><br>
    ${commit.body}<br>
    <em>${commit.author.name}</em><br>
  `;
    tooltip.classList.remove("hidden");
    tooltip.style.left = `${commit.x}px`;
    tooltip.style.top = `${commit.y}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById("tooltip");
    tooltip.classList.add("hidden");
}

export default HorizontalGraph;
