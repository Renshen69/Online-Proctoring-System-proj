import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Webcam from "react-webcam";

export default function StudentDashboard() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<any>(null);
  const [proctoringStatus, setProctoringStatus] = useState("Connecting...");
  const [isConnected, setIsConnected] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/session/${sessionId}`);
        if (response.data.status === "success") {
          setSession(response.data.data);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    if (sessionId) {
      fetchSession();
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/${session?.student_id}`);

    ws.onmessage = (event) => {
      // Handle WebSocket messages if needed
      console.log('WebSocket message:', event.data);
    };

    const interval = setInterval(() => {
      if (webcamRef.current && session) {
        const frame = webcamRef.current.getScreenshot();
        axios.post("http://localhost:8000/api/submit-frame", {
          session_id: sessionId,
          student_id: session.student_id,
          frame: frame,
        }).then(response => {
          setProctoringStatus(response.data.proctoring_status || 'Monitoring...');
        }).catch(err => {
          console.error('Error submitting frame:', err);
          setProctoringStatus('Connection Error');
        });
      }
    }, 1000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [sessionId, session]);

  // Timer effect
  useEffect(() => {
    if (!isConnected) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'Focused' || status === 'Normal') return 'status-focused';
    if (status.includes('detected') || status === 'Device Detected') return 'status-danger';
    if (status === 'Distracted') return 'status-distracted';
    return 'status-neutral';
  };

  if (!session?.google_form_link) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Loading Test</h2>
          <p className="text-secondary-600">Please wait while we prepare your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-secondary-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-secondary-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-secondary-900">Student Dashboard</h1>
                <p className="text-sm text-secondary-600">Session ID: {sessionId?.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-secondary-600">Time Elapsed</p>
                <p className="text-lg font-mono font-semibold text-primary-600">{formatTime(timeElapsed)}</p>
              </div>
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Test Content */}
        <div className="flex-1 bg-white">
          <iframe 
            src={session.google_form_link} 
            className="w-full h-full border-0" 
            allowFullScreen
            title="Test Content"
          />
        </div>
      </div>

      {/* Proctoring Sidebar */}
      <div className="w-80 bg-white border-l border-secondary-200 flex flex-col">
        {/* Proctoring Header */}
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Proctoring</h2>
              <p className="text-sm text-secondary-600">AI-powered monitoring</p>
            </div>
          </div>

          {/* Status Display */}
          <div className="space-y-4">
            <div className="p-4 bg-secondary-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-700">Status</span>
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              </div>
              <span className={`status-badge ${getStatusColor(proctoringStatus)}`}>
                {proctoringStatus}
              </span>
            </div>

            <div className="p-4 bg-secondary-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-700">Session Time</span>
                <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-mono font-bold text-primary-600">{formatTime(timeElapsed)}</p>
            </div>
          </div>
        </div>

        {/* Camera Feed */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Camera Feed</h3>
              <div className="relative aspect-video bg-secondary-900 rounded-xl overflow-hidden shadow-medium">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3">
                  <div className="w-3 h-3 bg-danger-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <svg className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-warning-800">Important</p>
                  <p className="text-xs text-warning-700">Keep your face visible and avoid looking away from the screen.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-info-50 border border-info-200 rounded-lg">
                <svg className="w-5 h-5 text-info-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-info-800">Privacy</p>
                  <p className="text-xs text-info-700">Your video is only used for proctoring and is not recorded.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-secondary-200">
          <button className="w-full btn-danger">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            End Test
          </button>
        </div>
      </div>
    </div>
  );
}