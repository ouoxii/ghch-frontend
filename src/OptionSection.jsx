import React, { useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { DataContext } from './DataContext';

const OptionSection = ({ isVisible, onClose, toggleSettings, defaultActiveSection = 'account', showPrompt = false, onSave }) => {
    const { setIsSettingsOpen } = useContext(DataContext);
    const [activeSection, setActiveSection] = useState(defaultActiveSection);
    const [inputData, setInputData] = useState({
        username: '',
        lastName: '',
        firstName: '',
    });
    const [userData, setUserData] = useState({
        id: '',
        username: ''
    });
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const id = Cookies.get('id');
        const username = Cookies.get('username');
        if (id && username) {
            setUserData({ id, username });
            fetchUserData(id);
        }
    }, []);

    const fetchUserData = async (id) => {
        try {
            const response = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/app-users/${id}`);
            if (response.ok) {
                const data = await response.json();
                setInputData({
                    username: data.username || '',
                    firstName: data.firstName || '',
                    lastName: data.lastName || ''
                });
            } else {
                setInputData({
                    username: '',
                    firstName: '',
                    lastName: ''
                });
                setError('無法獲取使用者資料');
            }
        } catch (error) {
            console.error('Error:', error);
            setInputData({
                username: '',
                firstName: '',
                lastName: ''
            });
            setError('請求過程中發生錯誤');
        }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputData.firstName.trim() || !inputData.lastName.trim()) {
            setError('First Name 和 Last Name 不能為空');
            return;
        }
        try {
            const response = await fetch(`https://ghch-cloud-server-b889208febef.herokuapp.com/app-users/${userData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inputData),
            });

            if (response.ok) {
                console.log('User updated successfully');
                setError('');
                setIsSettingsOpen(false);
                onSave();
                onClose();
            } else {
                console.error('Failed to update user');
                setError('Failed to update user');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error occurred while updating user');
        }
    };

    if (!isVisible) return null;

    const avatar = `https://avatars.githubusercontent.com/${userData.username}`;

    return (
        <div className="fixed top-0 left-0 w-screen h-screen z-40 flex justify-center items-center backdrop-blur-sm bg-gray-500 bg-opacity-50" onClick={toggleSettings}>
            <div className='flex flex-col w-[55%] h-[80%] rounded-xl shadow-lg overflow-hidden bg-white'>
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
                                            <div>Username</div>
                                            <div className="mb-3 mt-1">
                                                <input
                                                    className='bg-gray-100 border px-2 rounded-lg'
                                                    type="text"
                                                    name="username"
                                                    value={inputData.username}
                                                    onChange={handleInputChange}
                                                    placeholder=""
                                                    readOnly
                                                />
                                            </div>
                                            <div>First Name</div>
                                            <div className="mb-3 mt-1">
                                                <input
                                                    className='bg-gray-100 border px-2 rounded-lg'
                                                    type="text"
                                                    name="firstName"
                                                    value={inputData.firstName}
                                                    onChange={handleInputChange}
                                                    placeholder=""
                                                />
                                            </div>
                                            <div>Last Name</div>
                                            <div className="mb-3 mt-1">
                                                <input
                                                    className='bg-gray-100 border px-2 rounded-lg'
                                                    type="text"
                                                    name="lastName"
                                                    value={inputData.lastName}
                                                    onChange={handleInputChange}
                                                    placeholder=""
                                                />
                                            </div>
                                            {error && <p style={{ color: 'red' }}>{error}</p>}
                                            {showPrompt && <p style={{ color: 'red' }}>請填寫您的姓名</p>}
                                            <div className="flex justify-end">
                                                <button type="submit" className="bg-white border border-gray-300 rounded-md h-9 w-36 mr-3 mt-1
                                                hover:bg-blue-200 transition duration-300">Save</button>

                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptionSection;
