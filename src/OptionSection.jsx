import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import './OptionSection.css';
import { useNavigate } from 'react-router-dom';
import avatar from './img/avatar.jpg';

const OptionSection = ({ isVisible, onClose }) => {
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

    return (
        <div className="overlay" onClick={onClose}>
            <div className="info-section" onClick={(e) => e.stopPropagation()}>
                <div className="info-header">
                    <h2>Options</h2>
                </div>
                <div className="info-content">
                    <div className="info-hamburgar">
                        <div className={`info-option ${activeSection === 'account' ? 'active' : ''}`} onClick={() => toggleSection('account')}>
                            Account
                        </div>
                        <div className={`info-option ${activeSection === 'git' ? 'active' : ''}`} onClick={() => toggleSection('git')}>
                            Git
                        </div>
                    </div>
                    <div className="info-item">
                        {activeSection === 'account' && (
                            <div className='info-account-content'>
                                GitHub.com
                                {!userData.username ? (
                                    <div className='NotLoggedIn'>
                                        <div>Sign in to your GitHub account to access your repositories.</div>
                                        <button className='button-class'>Sign into GitHub.com</button>
                                    </div>
                                ) : (
                                    <div className='HadLoggedIn'>
                                        <div className='avatar'><img src={avatar} alt="頭像" /></div>
                                        <div className='user-info'>
                                            <div className='username'>{userData.username}</div>
                                            <div>ID: {userData.id}</div>
                                        </div>
                                        <div>
                                            <button className='button-class' onClick={handleLogout}>Sign out of GitHub.com</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeSection === 'git' && (
                            <div className='info-git-content'>
                                <div className='formContainer'>
                                    <form onSubmit={handleSubmit}>
                                        <div>Name</div>
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                name="Name"
                                                value={inputData.Name}
                                                onChange={handleInputChange}
                                                placeholder=""
                                            />
                                        </div>
                                        <div>Email</div>
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                name="Email"
                                                value={inputData.Email}
                                                onChange={handleInputChange}
                                                placeholder=""
                                            />
                                        </div>
                                        <div>Default branch name for new repositories</div>
                                        <div className="form-group">
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
                <div className="info-footer">
                    <button className="button-class2" onClick={onClose}>Save</button>
                    <button className="button-class2" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default OptionSection;
