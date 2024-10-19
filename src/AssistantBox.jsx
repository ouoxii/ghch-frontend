import React, { useState } from "react";
import arrow from './img/arrow.png';

const AssistantBox = ({ text }) => {
    const [input, setInput] = useState(''); // State to hold input text
    const [response, setResponse] = useState(''); // State to hold response from the API

    const handleInputChange = (e) => {
        setInput(e.target.value); // Update state when input changes
    };

    const handleSubmit = async () => {
        try {
            const requestBody = {
                prompt: input,

            };

            const generateResponse = await fetch(`http://localhost:3001/assistantBox/ask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!generateResponse.ok) {
                console.error('無法生成描述');
            }
            const generateData = await generateResponse.json();

            setResponse(generateData.answer);
            console.log(generateData.answer);
        } catch (error) {
            console.error('Error submitting input:', error);
            alert('發生錯誤，請重試！');
        }
    };

    return (
        <div className="w-64 min-h-20 py-3 px-4 bg-amber-200 flex flex-col items-center justify-center rounded-2xl">
            <div className="font-bold">
                {text}
            </div>
            <div className="flex mt-2">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    className="w-48 px-3 py-1 bg-stone-50 rounded-2xl"
                    placeholder="輸入你的問題"
                />
                <button
                    onClick={handleSubmit}
                    className="ml-2 w-8 h-8 bg-stone-50 p-2 rounded-full hover:bg-stone-200 hover:text-white"
                >
                    <img
                        src={arrow}
                        alt="submit"
                        className="w-5 h-5"
                    />
                </button>
            </div>
            {response && (
                <div className="mt-3 p-2 bg-white rounded-lg shadow-md">
                    <strong>回答：</strong>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
};

export default AssistantBox;
