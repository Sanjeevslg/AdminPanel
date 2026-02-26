import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Add_Property from './components/Add_Property';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router basename="/admin"> {/* Added basename for your subfolder setup */}
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-property" 
          element={
            <ProtectedRoute>
              <Add_Property />
            </ProtectedRoute>
          } 
        />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;