import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import { DataProvider } from './DataContext';
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Encountered two children with the same key/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
};
// Render the App component into the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <DataProvider>
      <App />
    </DataProvider>
  </Router>
);

// Web Vitals is a tool to measure and analyze performance (optional)
reportWebVitals(console.log);
