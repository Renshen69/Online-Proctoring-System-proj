import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface StudentData {
  status: string;
  results: any; // Consider defining a more specific type for results
}

interface Session {
  google_form_link: string;
  students: Record<string, StudentData>;
}

const Admin: React.FC = () => {
  const [googleFormLink, setGoogleFormLink] = useState('');
  const [students, setStudents] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Fetch initial sessions
    const fetchSessions = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/admin-status');
        setSessions(response.data);
      } catch (err) {
        console.error('Failed to fetch sessions', err);
      }
    };

    fetchSessions();

    // WebSocket connection
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/admin');

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const message = JSON.parse(event.data);
      if (message.type === 'status_update') {
        setSessions(message.data);
      }
    };

    ws.onclose = () => console.log('WebSocket disconnected');

    return () => ws.close();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGeneratedLink('');
    setIsCreating(true);

    try {
      const studentList = students.split('\n').filter(s => s.trim() !== '');
      const response = await axios.post('http://127.0.0.1:8000/api/start-session', { 
        google_form_link: googleFormLink, 
        students: studentList 
      });
      if (response.data.status === 'success') {
        const studentLink = `${window.location.origin}/student/${response.data.session_id}`;
        setGeneratedLink(studentLink);
        setGoogleFormLink('');
        setStudents('');
      } else {
        setError(response.data.message || 'Failed to create session');
      }
    } catch (err) {
      setError('An error occurred while creating the session.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStopSession = async (sessionId: string, rollNo: string) => {
    try {
      await axios.post('http://127.0.0.1:8000/api/stop-session', { 
        session_id: sessionId, 
        roll_no: rollNo 
      });
    } catch (err) {
      console.error('Failed to stop session', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Focused': 'status-focused',
      'Distracted': 'status-distracted',
      'No face detected': 'status-danger',
      'Multiple faces detected': 'status-danger',
      'Device Detected': 'status-danger',
      'Not Started': 'status-neutral',
      'Finished': 'status-finished',
    };
    
    return statusClasses[status as keyof typeof statusClasses] || 'status-neutral';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-secondary-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Admin Dashboard</h1>
                <p className="text-secondary-600 text-sm">Manage proctoring sessions</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-secondary-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Session Card */}
        <div className="card mb-8 animate-fade-in">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">Create New Session</h2>
              <p className="text-secondary-600 text-sm">Start a new proctoring session with a Google Form</p>
            </div>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Google Form Link
                </label>
                <input
                  type="url"
                  value={googleFormLink}
                  onChange={(e) => setGoogleFormLink(e.target.value)}
                  placeholder="https://forms.gle/..."
                  className="input-field"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Student Roll Numbers (one per line)
                </label>
                <textarea
                  value={students}
                  onChange={(e) => setStudents(e.target.value)}
                  placeholder="101\n102\n103"
                  className="input-field h-24"
                  required
                />
              </div>
              <div className="sm:pt-6">
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Session'
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-xl animate-slide-down">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-danger-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-danger-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {generatedLink && (
            <div className="mt-6 p-6 bg-success-50 border border-success-200 rounded-xl animate-slide-up">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-success-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold text-success-800">Session Created Successfully!</p>
                  </div>
                  <p className="text-success-700 text-sm mb-3">Share this link with students to join the session:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-success-300 rounded-lg text-sm font-mono text-secondary-700"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedLink)}
                      className="px-3 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Active Sessions</h2>
                <p className="text-secondary-600 text-sm">
                  {Object.keys(sessions).length} session{Object.keys(sessions).length !== 1 ? 's' : ''} running
                </p>
              </div>
            </div>
          </div>

          {Object.keys(sessions).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(sessions).map(([sessionId, sessionData]) => (
                <div 
                  key={sessionId} 
                  className="p-6 bg-gradient-to-r from-white to-secondary-50 border border-secondary-200 rounded-xl hover:shadow-medium transition-all duration-200 animate-slide-up"
                >
                  {Object.entries(sessionData.students).map(([rollNo, studentData]) => (
                    <div key={rollNo}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-secondary-600">Session ID:</span>
                              <span className="font-mono text-sm bg-primary-100 px-2 py-1 rounded text-primary-800 font-bold">
                                {sessionId}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-secondary-600">Student:</span>
                              <span className="font-mono text-sm bg-success-100 px-2 py-1 rounded text-success-800 font-bold">
                                {rollNo}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-secondary-600">Form:</span>
                            <a 
                              href={sessionData.google_form_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-700 hover:underline truncate max-w-md"
                            >
                              {sessionData.google_form_link}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`status-badge ${getStatusBadge(studentData.status)}`}>
                            {studentData.status}
                          </span>
                          {studentData.status !== 'Finished' && (
                            <button 
                              onClick={() => handleStopSession(sessionId, rollNo)}
                              className="btn-danger"
                            >
                              Stop
                            </button>
                          )}
                        </div>
                      </div>
                      {studentData.results && (
                        <div className="mt-4 pt-4 border-t border-secondary-200">
                          <h4 className="text-md font-semibold text-secondary-800 mb-2">Results</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-secondary-100 p-3 rounded-lg">
                              <p className="font-medium text-secondary-600">Avg. Attention</p>
                              <p className="font-bold text-lg text-primary-600">{studentData.results.average_attention_score.toFixed(2)}%</p>
                            </div>
                            <div className="bg-secondary-100 p-3 rounded-lg">
                              <p className="font-medium text-secondary-600">Distractions</p>
                              <p className="font-bold text-lg text-danger-600">{studentData.results.distracted_count}</p>
                            </div>
                            <div className="bg-secondary-100 p-3 rounded-lg">
                              <p className="font-medium text-secondary-600">Multiple Faces</p>
                              <p className="font-bold text-lg text-danger-600">{studentData.results.multiple_faces_count}</p>
                            </div>
                            <div className="bg-secondary-100 p-3 rounded-lg">
                              <p className="font-medium text-secondary-600">No Face</p>
                              <p className="font-bold text-lg text-danger-600">{studentData.results.no_face_count}</p>
                            </div>
                            <div className="bg-secondary-100 p-3 rounded-lg">
                              <p className="font-medium text-secondary-600">Device Detected</p>
                              <p className="font-bold text-lg text-danger-600">{studentData.results.device_detected_count}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No Active Sessions</h3>
              <p className="text-secondary-600">Create a new session to get started with proctoring.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;