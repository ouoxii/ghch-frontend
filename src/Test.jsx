import React, { useState } from 'react';

const Test = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold">Sidebar</h2>
                    <button onClick={toggleSidebar} className="text-white focus:outline-none">
                        ✖
                    </button>
                </div>
                <ul className="p-4">
                    <li className="mb-2"><a href="#" className="hover:bg-gray-700 block p-2 rounded">Link 1</a></li>
                    <li className="mb-2"><a href="#" className="hover:bg-gray-700 block p-2 rounded">Link 2</a></li>
                    <li className="mb-2"><a href="#" className="hover:bg-gray-700 block p-2 rounded">Link 3</a></li>
                </ul>
            </div>

            {/* Top-left icon */}
            <div className="fixed top-4 left-4 z-50">
                <button onClick={toggleSidebar} className="bg-blue-500 text-white p-2 rounded focus:outline-none">
                    ☰
                </button>
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 ml-16">
                <div className="mt-4">
                    <h1 className="text-2xl font-bold">Main Content</h1>
                    <p>This is the main content area.</p>
                </div>
            </div>
        </div>
    );
};

export default Test;
