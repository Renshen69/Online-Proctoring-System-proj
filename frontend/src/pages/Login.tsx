import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (selectedRole: string) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', { role: selectedRole });
      if (response.data.status === 'success') {
        if (selectedRole === 'admin') {
          navigate('/admin');
        } else {
          // For students, we'll need a session ID. For now, just redirecting.
          // In a real app, the admin would provide a link like /student/session-id
          navigate('/student');
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Select Your Role</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => handleLogin('admin')}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Login as Admin
          </button>
          <button
            onClick={() => handleLogin('student')}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-200"
          >
            Login as Student
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;