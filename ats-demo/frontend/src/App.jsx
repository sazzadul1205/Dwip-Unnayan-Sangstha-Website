import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Applications from './pages/Applications';
import Applicants from './pages/Applicants';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        <Navigation />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applicants" element={<Applicants />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
