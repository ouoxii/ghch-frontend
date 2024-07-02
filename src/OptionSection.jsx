import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const OptionSection = ({ isVisible, onClose, toggleSettings }) => {
    const [activeSection, setActiveSection] = useState('account');
    const [inputData, setInputData] = useState({
        Name: '',
        Email: '',
        dfBranch: ''
    });
    const [userData, setUserData] = useState({
        id: '',
        username: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        const id = Cookies.get('id');
        const username = Cookies.get('username');
        if (id && username) {
            setUserData({ id, username });
        }
    }, []);

    const toggleSection = (section) => {
        setActiveSection(section);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleLogout = () => {
        Cookies.remove('id');
        Cookies.remove('username');
        Cookies.remove('token');
        setUserData({ id: '', username: '' });
        onClose();
        navigate('/'); // Redirect to the root path
        window.location.reload(); // Reload the page to ensure redirect and clear URL parameters
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(inputData);
    };

    if (!isVisible) return null;

    const avatar = `https://avatars.githubusercontent.com/${userData.username}`;

    return (
        <div className="fixed top-0 left-0 w-screen h-screen z-40 flex justify-center items-center backdrop-blur-sm bg-gray-500 bg-opacity-50" onClick={toggleSettings}>
            <div className='flex flex-col w-[55%] h-[80%] rounded-xl shadow-lg overflow-hidden bg-white'>
                {/* <div className="overlay" onClick={onClose}></div> */}
                <div className="flex flex-col h-full relative" onClick={(e) => e.stopPropagation()}>
                    <div className="m-3 flex">
                        <h2>Options</h2>
                        <button className='ml-auto' onClick={onClose}>✕</button>
                    </div>
                    <div className="flex ">
                        <div className="flex-col w-[33%]">
                            <div className={`p-3 cursor-pointer ${activeSection === 'account' ? 'bg-[#365f9b] text-white' : ''}`} onClick={() => toggleSection('account')}>
                                Account
                            </div>
                            <div className={`p-3 cursor-pointer ${activeSection === 'git' ? 'bg-[#365f9b] text-white' : ''}`} onClick={() => toggleSection('git')}>
                                Git
                            </div>
                        </div>
                        <div className="flex mx-4 w-[66%]">
                            {activeSection === 'account' && (
                                <div className='w-full'>
                                    GitHub.com
                                    <div className='flex mt-3 w-full'>
                                        <div className='w-14 h-14 rounded-full overflow-hidden'><img src={avatar} alt="頭像" /></div>
                                        <div className='flex-col ml-3 w-[50%]'>
                                            <div>{userData.username}</div>
                                            <div>ID: {userData.id}</div>
                                        </div>
                                        <button className='bg-slate-300 text-black py-1 px-3 rounded-xl h-9 cursor-pointer mt-1 ml-auto
                                         hover:bg-buttonBlue-dark hover:text-white transition duration-200' onClick={handleLogout}>Sign out of GitHub.com</button>   
                                    </div>
                                </div>
                            )}
                            {activeSection === 'git' && (
                                <div className='flex-col w-full'>
                                    <div>
                                        <form onSubmit={handleSubmit}>
                                            <div>Name</div>
                                            <div className="mb-3 mt-1">
                                                <input
                                                    type="text"
                                                    name="Name"
                                                    value={inputData.Name}
                                                    onChange={handleInputChange}
                                                    placeholder=""
                                                />
                                            </div>
                                            <div>Email</div>
                                            <div className="mb-3 mt-1">
                                                <input
                                                    type="text"
                                                    name="Email"
                                                    value={inputData.Email}
                                                    onChange={handleInputChange}
                                                    placeholder=""
                                                />
                                            </div>
                                            <div>Default branch name for new repositories</div>
                                            <div className="mb-3 mt-1">
                                                <input
                                                    type="text"
                                                    name="dfBranch"
                                                    value={inputData.dfBranch}
                                                    onChange={handleInputChange}
                                                    placeholder=""
                                                />
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end absolute bottom-3 w-full">
                        <button className="bg-white border border-gray-300 rounded-md h-9 w-36 mr-3 mt-1
                        hover:bg-blue-200 transition duration-300" onClick={onClose}>Save</button>
                        <button className="bg-white border border-gray-300 rounded-md h-9 w-36 mr-3 mt-1
                        hover:bg-red-300 transition duration-300" onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptionSection;
