import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Landing';
import Admin from './pages/Admin';
import Student from './pages/Student';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/student/:sessionId" element={<Student />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;