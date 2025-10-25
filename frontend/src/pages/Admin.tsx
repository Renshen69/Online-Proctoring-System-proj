import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Session {
  student_id: string | null;
  status: string;
  google_form_link: string;
}

const Admin: React.FC = () => {
  const [googleFormLink, setGoogleFormLink] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/admin');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'status_update') {
        setSessions(message.data);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGeneratedLink('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/start-session', { google_form_link: googleFormLink });
      if (response.data.status === 'success') {
        const studentLink = `${window.location.origin}/student/${response.data.session_id}`;
        setGeneratedLink(studentLink);
      } else {
        setError(response.data.message || 'Failed to create session');
      }
    } catch (err) {
      setError('An error occurred while creating the session.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Session</h2>
          <form onSubmit={handleCreateSession}>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="url"
                value={googleFormLink}
                onChange={(e) => setGoogleFormLink(e.target.value)}
                placeholder="Enter Google Form Link"
                className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition">
                Create Session
              </button>
            </div>
          </form>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {generatedLink && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              <p className="font-semibold">Generated Student Link:</p>
              <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                {generatedLink}
              </a>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Active Sessions</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            {Object.keys(sessions).length > 0 ? (
              <ul className="space-y-4">
                {Object.entries(sessions).map(([sessionId, sessionData]) => (
                  <li key={sessionId} className="p-4 border rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-bold">Session ID: <span className="font-normal text-gray-600">{sessionId}</span></p>
                      <p className="font-bold">Student: <span className="font-normal text-gray-600">{sessionData.student_id || 'Not Joined'}</span></p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${sessionData.status === 'Focused' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {sessionData.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No active sessions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;