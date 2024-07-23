//https://codesandbox.io/s/git-branching-model-visualize-owwsx3?file=/src/App.js
import React from "react";
import {
    Gitgraph,
    templateExtend,
    TemplateName,
    Orientation
} from "@gitgraph/react";

const withoutAuthor = templateExtend(TemplateName.Metro, {
    commit: {
        message: {
            displayAuthor: false
        }
    }
});

const HorizontalGraph = () => {
    return (
        <div className="App">
            <Gitgraph
                options={{
                    orientation: Orientation.Horizontal,
                    reverseArrow: true,
                    template: withoutAuthor
                }}
            >
                {initGraph}
            </Gitgraph>
        </div>
    );
};

function createFixedHashGenerator() {
    let hash = 0;
    return () => {
        return (hash++).toString();
    };
}

function initGraph(gitgraph) {
    const master = gitgraph.branch("master");
    master.commit("Initial commit");

    const develop = gitgraph.branch("develop");
    develop.commit({ subject: "one", hash: "1" });
    master.commit({ subject: "two", hash: "2" });
    develop.commit({ subject: "three", hash: "3" });
    master.merge(develop, { hash: "4" });
}

export default HorizontalGraph;