import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QuestionCreator from "../components/QuestionCreator";

interface StudentData {
  status: string;
  results?: any;
  started_at?: string;
  ended_at?: string;
}

interface Session {
  google_form_link?: string;
  exam_type?: string;
  exam_title?: string;
  exam_description?: string;
  students: Record<string, StudentData>;
  created_at?: string;
  status?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [newStudentId, setNewStudentId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [admin, setAdmin] = useState<any>(null);

  // Custom exam states
  const [customExamTitle, setCustomExamTitle] = useState("");
  const [customExamDescription, setCustomExamDescription] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showQuestionCreator, setShowQuestionCreator] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) {
      navigate('/admin-auth');
      return;
    }
    setAdmin(JSON.parse(storedAdmin));
  }, [navigate]);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/admin-status");
        setSessions(response.data);
      } catch (error) {
        console.error("Error fetching admin status:", error);
      }
    };

    if (admin) {
      fetchAdminStatus();
    }

    const ws = new WebSocket("ws://127.0.0.1:8000/ws/admin");

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "status_update") {
        setSessions(message.data);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGeneratedLink("");
    setIsCreating(true);

    try {
      const requestData = {
        exam_type: 'custom',
        exam_title: customExamTitle,
        exam_description: customExamDescription,
        students: newStudentId ? [newStudentId] : [],
      };

      const response = await axios.post("http://127.0.0.1:8000/api/start-session", requestData);

      if (response.data.status === 'success') {
        const sessionId = response.data.session_id;
        setCurrentSessionId(sessionId);
        setShowQuestionCreator(true);
        setShowCreateForm(false);
        setCustomExamTitle("");
        setCustomExamDescription("");
        setNewStudentId("");
      } else {
        setError(response.data.message || 'Failed to create session');
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      setError('An error occurred while creating the exam.');
    } finally {
      setIsCreating(false);
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
      'Finished': 'status-success',
    };

    return statusClasses[status as keyof typeof statusClasses] || 'status-neutral';
  };

  const SessionCard = ({ sessionId, sessionData, index }: { sessionId: string, sessionData: Session, index: number }) => {
    // Use sessionId to avoid linting warning
    console.debug('Rendering session card for:', sessionId);

    const handleDeleteSession = async () => {
      if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
        try {
          const response = await axios.delete(`http://127.0.0.1:8000/api/session/${sessionId}`);
          if (response.data.status === 'success') {
            // Refresh the sessions list
            const statusResponse = await axios.get("http://127.0.0.1:8000/api/admin-status");
            setSessions(statusResponse.data);
          } else {
            alert('Failed to delete session: ' + response.data.message);
          }
        } catch (error) {
          console.error('Error deleting session:', error);
          alert('Error deleting session');
        }
      }
    };

    return (
      <div
        className="p-6 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm border border-white/20 rounded-2xl hover:shadow-medium transition-all duration-300 animate-slide-up group hover:scale-[1.01]"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {/* Session Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-secondary-200">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">
                  {sessionData.exam_title || 'Untitled Exam'}
                </h3>
                {sessionData.exam_description && (
                  <p className="text-sm text-secondary-600">{sessionData.exam_description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-secondary-600">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <span>ID: {sessionId.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Created: {formatDate(sessionData.created_at || '')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDeleteSession}
              className="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Delete Session"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Students */}
        {Object.entries(sessionData.students).map(([rollNo, studentData]) => (
          <div key={rollNo} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-secondary-600">Student:</span>
                    <span className="font-mono text-sm bg-success-100 px-2 py-1 rounded text-success-800 font-bold">
                      {rollNo}
                    </span>
                  </div>
                  {studentData.started_at && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-secondary-600">Started:</span>
                      <span className="text-sm text-secondary-700">{formatDate(studentData.started_at)}</span>
                    </div>
                  )}
                  {studentData.results?.session_duration && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-secondary-600">Duration:</span>
                      <span className="text-sm text-secondary-700">{formatDuration(studentData.results.session_duration)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`status-badge ${getStatusBadge(studentData.status)}`}>
                  {studentData.status}
                </span>
                {studentData.results && (
                  <button
                    onClick={() => toggleResults(sessionId, rollNo)}
                    className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>View Results</span>
                  </button>
                )}
              </div>
            </div>

            {studentData.results && expandedResults[`${sessionId}-${rollNo}`] && (
              <div className="mt-4 pt-4 border-t border-secondary-200 animate-slide-down">
                <h4 className="text-md font-semibold text-secondary-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Detailed Results
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <p className="font-medium text-green-700 mb-1">Average Attention</p>
                    <p className="font-bold text-2xl text-green-800">{studentData.results.average_attention_score.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                    <p className="font-medium text-red-700 mb-1">Distractions</p>
                    <p className="font-bold text-2xl text-red-800">{studentData.results.distracted_count}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <p className="font-medium text-orange-700 mb-1">Multiple Faces</p>
                    <p className="font-bold text-2xl text-orange-800">{studentData.results.multiple_faces_count}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <p className="font-medium text-purple-700 mb-1">No Face Detected</p>
                    <p className="font-bold text-2xl text-purple-800">{studentData.results.no_face_count}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-700 mb-1">Device Detected</p>
                    <p className="font-bold text-2xl text-yellow-800">{studentData.results.device_detected_count}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                    <p className="font-medium text-pink-700 mb-1">Mouse Out</p>
                    <p className="font-bold text-2xl text-pink-800">{studentData.results.mouse_out_count || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                    <p className="font-medium text-indigo-700 mb-1">Tab Switches</p>
                    <p className="font-bold text-2xl text-indigo-800">{studentData.results.tab_switch_count || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-700 mb-1">Total Events</p>
                    <p className="font-bold text-2xl text-blue-800">{studentData.results.total_events || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Helper functions for session categorization
  const getLiveSessions = () => {
    return Object.entries(sessions).filter(([sessionId, sessionData]) => {
      console.debug('Checking live session:', sessionId);
      return Object.values(sessionData.students).some(student =>
        student.status !== "Finished" && student.status !== "Not Started"
      );
    });
  };

  const getCompletedSessions = () => {
    return Object.entries(sessions).filter(([sessionId, sessionData]) => {
      console.debug('Checking completed session:', sessionId);
      return Object.values(sessionData.students).every(student =>
        student.status === "Finished"
      );
    });
  };

  const getNotStartedSessions = () => {
    return Object.entries(sessions).filter(([sessionId, sessionData]) => {
      console.debug('Checking not started session:', sessionId);
      return Object.values(sessionData.students).every(student =>
        student.status === "Not Started"
      );
    });
  };

  const toggleResults = (sessionId: string, rollNo: string) => {
    const key = `${sessionId}-${rollNo}`;
    setExpandedResults(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const handleQuestionAdded = () => {
    // Refresh sessions to show the updated session
    const fetchAdminStatus = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/admin-status");
        setSessions(response.data);
      } catch (error) {
        console.error("Error fetching admin status:", error);
      }
    };
    fetchAdminStatus();
  };

  const handleFinishCustomExam = () => {
    if (currentSessionId) {
      const studentLink = `${window.location.origin}/student/${currentSessionId}`;
      setGeneratedLink(studentLink);
      setShowQuestionCreator(false);
      setCurrentSessionId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Link copied to clipboard');
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/admin-auth');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-secondary-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient font-heading">Exam Proctoring Dashboard</h1>
                <p className="text-secondary-600 text-sm mt-1">Manage and monitor online examinations with AI-powered proctoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-success-50 rounded-full border border-success-200">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-success-700 font-medium">System Online</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-secondary-600">Total Sessions</p>
                <p className="text-lg font-bold text-secondary-900">{Object.keys(sessions).length}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-secondary-600">Welcome,</p>
                  <p className="text-sm font-semibold text-secondary-900">{admin?.name || 'Admin'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-all duration-200"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Create New Test Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Exam Management</h2>
            <p className="text-secondary-600 mt-1">Create and manage custom exams with AI-powered proctoring</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Exam</span>
          </button>
        </div>

        {/* Create New Test Modal/Form */}
        {showCreateForm && (
          <div className="card mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900">Create New Exam</h2>
                  <p className="text-secondary-600 text-sm">Set up a new custom exam with questions</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    value={customExamTitle}
                    onChange={(e) => setCustomExamTitle(e.target.value)}
                    placeholder="Enter exam title"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Student ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="Enter student ID"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Exam Description
                </label>
                <textarea
                  value={customExamDescription}
                  onChange={(e) => setCustomExamDescription(e.target.value)}
                  placeholder="Enter exam description (optional)"
                  className="input-field"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
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
                    'Create Exam'
                  )}
                </button>
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
          </div>
        )}

        {/* Question Creator for Custom Exams */}
        {showQuestionCreator && currentSessionId && (
          <div className="card mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900">Add Questions</h2>
                  <p className="text-secondary-600 text-sm">Create MCQ and essay questions for your exam</p>
                </div>
              </div>
              <button
                onClick={handleFinishCustomExam}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Finish Creating Exam
              </button>
            </div>
            <QuestionCreator
              sessionId={currentSessionId}
              onQuestionAdded={handleQuestionAdded}
            />
          </div>
        )}

        {generatedLink && (
          <div className="card mb-8 animate-slide-up">
            <div className="p-6 bg-success-50 border border-success-200 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-success-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold text-success-800">Exam Created Successfully!</p>
                  </div>
                  <p className="text-success-700 text-sm mb-3">Share this link with students to join the exam:</p>
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
          </div>
        )}

        {/* Sessions Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-gradient border border-blue-100 hover:shadow-xl transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-600 text-sm font-semibold">Live Exams</p>
                  <p className="text-blue-800 text-3xl font-bold">{getLiveSessions().length}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="card-gradient border border-green-100 hover:shadow-xl transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-glow-success transition-all duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-600 text-sm font-semibold">Completed</p>
                  <p className="text-green-800 text-3xl font-bold">{getCompletedSessions().length}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>

          <div className="card-gradient border border-gray-100 hover:shadow-xl transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Scheduled</p>
                  <p className="text-gray-800 text-3xl font-bold">{getNotStartedSessions().length}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Live Sessions */}
        {getLiveSessions().length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-secondary-100 animate-fade-in mb-8">
            <div className="p-6 border-b border-secondary-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-secondary-900">Live Exams</h2>
                    <p className="text-secondary-600 text-sm">
                      {getLiveSessions().length} active exam{getLiveSessions().length !== 1 ? 's' : ''} currently running
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700 font-semibold">Live</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {getLiveSessions().map(([sessionId, sessionData], index) => (
                  <SessionCard key={sessionId} sessionId={sessionId} sessionData={sessionData} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completed Sessions */}
        {getCompletedSessions().length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-secondary-100 animate-fade-in mb-8">
            <div className="p-6 border-b border-secondary-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-secondary-900">Completed Exams</h2>
                    <p className="text-secondary-600 text-sm">
                      {getCompletedSessions().length} finished exam{getCompletedSessions().length !== 1 ? 's' : ''} with results available
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700 font-semibold">Completed</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {getCompletedSessions().map(([sessionId, sessionData], index) => (
                  <SessionCard key={sessionId} sessionId={sessionId} sessionData={sessionData} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Not Started Sessions */}
        {getNotStartedSessions().length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-secondary-100 animate-fade-in mb-8">
            <div className="p-6 border-b border-secondary-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-secondary-900">Scheduled Exams</h2>
                    <p className="text-secondary-600 text-sm">
                      {getNotStartedSessions().length} pending exam{getNotStartedSessions().length !== 1 ? 's' : ''} waiting to start
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 font-semibold">Scheduled</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {getNotStartedSessions().map(([sessionId, sessionData], index) => (
                  <SessionCard key={sessionId} sessionId={sessionId} sessionData={sessionData} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Sessions Message */}
        {Object.keys(sessions).length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-secondary-100 animate-fade-in">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-3">No Exams Created Yet</h3>
              <p className="text-secondary-600 text-lg mb-6">Create your first exam to start monitoring students with AI-powered proctoring.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Your First Exam</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}