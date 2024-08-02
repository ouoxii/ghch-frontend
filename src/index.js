import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';  // Ensure this is the correct path to your App.js
import reportWebVitals from './reportWebVitals';

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
  <App />
);

// Web Vitals is a tool to measure and analyze performance (optional)
reportWebVitals(console.log);
