import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Sidebar from './Sidebar';
import CreateTeamBlock from './CreateTeamBlock';
import OptionSection from './OptionSection';
import TeamOverview from './TeamOverview';
import PRDiscussion from './PRDiscussion';
import BranchChart from './BranchChart';
import Cookies from 'js-cookie';


function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const location = window.location;
  const queryParams = new URLSearchParams(location.search);
  const paraId = queryParams.get('id');
  const paraIusername = queryParams.get('username');
  const paraToken = queryParams.get('token');

  if (paraId && paraIusername && paraToken) {
    Cookies.set('id', paraId, { expires: 1 });
    Cookies.set('username', paraIusername, { expires: 1 });
    Cookies.set('token', paraToken, { expires: 1 });
  }

  // 在這裡檢查 id、username、token 是否存在
  //window.location.reload();
  const id = Cookies.get('id');
  const username = Cookies.get('username');
  const token = Cookies.get('token');

  const handleLogin = () => {
    window.location.href = `http://localhost:8080/login`;
  };

  if (id && username && token) {
    return (
      <Router>
        {isSettingsOpen && (
          <div className="overlay" onClick={toggleSettings}>
            <div className='info-section'>
              <OptionSection
                isVisible={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
              />
            </div>
          </div>
        )}
        <div className='flex h-screen overflow-hidden'>

          <Sidebar toggleSettings={toggleSettings} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <main className={`absolute flex overflow-hidden h-screen top-0 left-[220px] z-0 transition-transform transform ${isSidebarOpen ? 'translate-x-0 w-[calc(100%-220px)]' : '-translate-x-[220px] w-[calc(100%-1px)]'}`}>
            <div className='flex'>
              <button className="h-10 w-10 " onClick={toggleSidebar}>
                ☰
              </button>
            </div>
            <div className='flex overflow-hidden'>
              <Routes>
                <Route path="/" element={<CreateTeamBlock />} />
                <Route path="/branchchart" element={<BranchChart />} />
                <Route path="/team-overview" element={<TeamOverview />} />
                <Route path="/PRDiscussion" element={<PRDiscussion />} />
              </Routes>
            </div>

          </main>
        </div>
      </Router>
    );
  } else {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen bg-gradient-to-b from-slate-200 to-white">
        <h1 className="text-6xl text-black z-30 font-bold mb-8 opacity-70 font-red-hat">GHCH</h1>
        <p className="text-base font-courier z-30 mb-10">new version control experiences with intuitive guidance and visualizations.</p>
        <button onClick={handleLogin} className="relative px-6 py-3 z-20 bg-white text-gray-800 font-semibold rounded-lg shadow-lg opacity-60
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
