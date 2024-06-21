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
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const location = window.location;
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    const username = queryParams.get('username');
    const token = queryParams.get('token');

    if (id && username && token) {
      Cookies.set('id', id, { expires: 1 });
      Cookies.set('username', username, { expires: 1 });
      Cookies.set('token', token, { expires: 1 });
    }
  }, [location]);

  // 在這裡檢查 id、username、token 是否存在
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
        <div className="app">
          <Sidebar toggleSettings={toggleSettings} />
          <main className="content">
            <Routes>
              <Route path="/" element={<CreateTeamBlock />} />
              <Route path="/branchchart" element={<BranchChart />} />
              <Route path="/team-overview" element={<TeamOverview />} />
              <Route path="/PRDiscussion" element={<PRDiscussion />} />
            </Routes>
          </main>
        </div>
      </Router>
    );
  } else {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen bg-gradient-to-b from-neutral-200 to-slate-50">
        <h1 className="text-6xl text-black z-30 font-bold mb-8 opacity-70 font-red-hat">GHCH</h1>
        <p className="text-base font-courier z-30 mb-10">new version control experiences with intuitive guidance and visualizations.</p>
        <button onClick={handleLogin} className="relative px-6 py-3 z-20 bg-white text-gray-800 font-semibold rounded-lg shadow-lg opacity-60
        hover:transform hover:-translate-y-0.2 hover:shadow-2xl transition duration-300">
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
