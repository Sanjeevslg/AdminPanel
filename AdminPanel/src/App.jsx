import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Add_Property from './components/Add_Property';
import Add_Project from './components/Add_project.jsx';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/add-property" element={<ProtectedRoute><Add_Property /></ProtectedRoute>} />
        <Route path="/add-project" element={<ProtectedRoute><Add_Project /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;