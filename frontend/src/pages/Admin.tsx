import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css'; // ✅ Import the new CSS file

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
  const [stats, setStats] = useState({
    activeExams: 24,
    studentsMonitored: 342,
    flaggedActivities: 18,
    completedToday: 156
  });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/admin-status');
        setSessions(response.data);
      } catch (err) {
        console.error('Failed to fetch sessions', err);
      }
    };

    fetchSessions();

    const ws = new WebSocket('ws://127.0.0.1:8000/ws/admin');
    ws.onmessage = (event) => {
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

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/start-session', {
        google_form_link: googleFormLink,
      });
      if (response.data.status === 'success') {
        const studentLink = `${window.location.origin}/student/${response.data.session_id}`;
        setGeneratedLink(studentLink);
      } else {
        setError(response.data.message || 'Failed to create session');
      }
    } catch {
      setError('An error occurred while creating the session.');
    }
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <img src="/logo.png" alt="ProctorAdmin" className="logo" />
          <div>
            <h1>ProctorAdmin</h1>
            <p>Exam Monitoring</p>
          </div>
        </div>

        <div className="header-right">
          <input type="search" placeholder="Search students, exams..." />
          <button className="notification-btn">
            🔔<span className="badge">18</span>
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav>
            <div className="sidebar-item active">🏠 Dashboard</div>
            <div className="sidebar-item">
              🎥 Live Monitoring <span className="badge">24</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="page-header">
            <h2>Dashboard</h2>
            <p>Overview of all proctoring activities</p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <h3>Active Exams</h3>
              <p className="value">{stats.activeExams}</p>
              <span>+12% from last hour</span>
            </div>
            <div className="stat-card green">
              <h3>Students Monitored</h3>
              <p className="value">{stats.studentsMonitored}</p>
              <span>+5% from yesterday</span>
            </div>
            <div className="stat-card red">
              <h3>Flagged Activities</h3>
              <p className="value">{stats.flaggedActivities}</p>
              <span>+3 this hour</span>
            </div>
            <div className="stat-card purple">
              <h3>Completed Today</h3>
              <p className="value">{stats.completedToday}</p>
              <span>+20% week growth</span>
            </div>
          </div>

          {/* Create Session */}
          <section className="create-session">
            <h3>Create New Exam Session</h3>
            <form onSubmit={handleCreateSession}>
              <label>Google Form Link</label>
              <input
                type="url"
                value={googleFormLink}
                onChange={(e) => setGoogleFormLink(e.target.value)}
                placeholder="https://forms.google.com/..."
                required
              />
              {error && <p className="error">{error}</p>}
              {generatedLink && (
                <>
                  <label>Student Link</label>
                  <input type="text" value={generatedLink} readOnly />
                </>
              )}
              <button type="submit">Create Session</button>
            </form>
          </section>

          {/* Sessions Table */}
          <section className="session-table">
            <h3>Active Sessions</h3>
            <table>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Student ID</th>
                  <th>Status</th>
                  <th>Form Link</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sessions).map(([id, s]) => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{s.student_id || 'Not joined'}</td>
                    <td className={`status ${s.status}`}>{s.status}</td>
                    <td>{s.google_form_link}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Admin;
