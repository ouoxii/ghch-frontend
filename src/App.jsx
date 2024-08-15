import React, { useEffect, useContext, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import CreateTeamBlock from './CreateTeamBlock';
import OptionSection from './OptionSection';
import TeamOverview from './TeamOverview';
import PRDiscussion from './PRDiscussion';
import TeamRepo from './TeamRepo';
import BranchChart from './BranchChart';
import GitGraph from './HorizontalGraph';
import Cookies from 'js-cookie';
import { DataContext } from './DataContext';

function App() {
  const { isSettingsOpen, setIsSettingsOpen } = useContext(DataContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const location = window.location;
  const queryParams = new URLSearchParams(location.search);
  const paraId = queryParams.get('id');
  const paraUsername = queryParams.get('username');
  const paraToken = queryParams.get('token');

  if (paraId && paraUsername && paraToken) {
    Cookies.set('id', paraId, { expires: 1 });
    Cookies.set('username', paraUsername, { expires: 1 });
    Cookies.set('token', paraToken, { expires: 1 });
  }

  const id = Cookies.get('id');
  const username = Cookies.get('username');
  const token = Cookies.get('token');

  useEffect(() => {
    if (id) {
      fetchUserData(id);
    }
  }, [id]);

  const fetchUserData = async (id) => {
    try {
      const response = await fetch(`http://localhost:8081/app-users/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        if (!data.firstName || !data.lastName) {
          setIsSettingsOpen(true);
          setShowPrompt(true);
        }
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogin = () => {
    window.location.href = `http://localhost:8080/login`;
  };

  const handleCloseSettings = () => {
    if (firstName && lastName) {
      setIsSettingsOpen(false);
      setShowPrompt(false);
    }
  };

  if (id && username && token) {
    return (
      <div className='flex h-screen overflow-hidden'>
        {isSettingsOpen && (
          <OptionSection
            isVisible={isSettingsOpen}
            onClose={handleCloseSettings}
            toggleSettings={toggleSettings}
            defaultActiveSection="git"
            showPrompt={showPrompt}
            onSave={() => setShowPrompt(false)}
          />
        )}
        <Sidebar toggleSettings={toggleSettings} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main
          className={`absolute flex overflow-hidden h-screen top-0 left-0 z-0 transition-transform transform ${isSidebarOpen
            ? 'ml-[220px] w-[calc(100%-220px)]'
            : 'ml-0 w-full'
            }`}
        >
          <div className="flex">
            <button className="h-10 w-10" onClick={toggleSidebar}>
              ☰
            </button>
          </div>
          <div className="flex overflow-hidden w-full">
            <Routes>
              <Route path="/" element={<CreateTeamBlock />} />
              <Route path="/branchchart" element={<BranchChart />} />
              <Route path="/team-overview" element={<TeamOverview />} />
              <Route path="/PRDiscussion" element={<PRDiscussion />} />
              <Route path="/teamRepo" element={<TeamRepo />} />
              <Route path="/gitgraph" element={<GitGraph />} />
            </Routes>
          </div>
        </main>

      </div>
    );
  } else {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen bg-gradient-to-b from-slate-200 to-white">
        <h1 className="text-6xl text-black z-30 font-bold mb-8 opacity-70 font-red-hat">GHCH</h1>
        <p className="text-base font-courier z-30 mb-10">new version control experiences with intuitive guidance and visualizations.</p>
        <button onClick={handleLogin} className="relative px-6 py-3 z-20 bg-white text-gray-800 font-semibold rounded-lg shadow-lg bg-opacity-30 backdrop-blur-sm
        hover:transform hover:-translate-y-0.5 hover:shadow-2xl transition duration-300">
          <span>Login with GitHub</span>
        </button>
        <div className="absolute inset-0 w-[200px] h-[250px] z-0 top-[calc(50%-180px)] left-[calc(50%-80px)] rounded-full blur-md
        bg-gradient-radial from-white to-neutral-50"></div>
        <div className="absolute inset-0 w-[100px] h-[100px] z-0 top-[calc(50%+10px)] left-[calc(50%-0px)] rounded-full blur-2xl
        bg-gradient-radial from-pink-300 to-neutral-50"></div>
        <div className="absolute inset-0 w-[200px] h-[250px] z-0 top-[calc(50%-120px)] left-[calc(50%-180px)] rounded-full blur-2xl
        bg-gradient-radial from-indigo-300 to-neutral-50"></div>
      </div>
    );
  }
}

export default App;
