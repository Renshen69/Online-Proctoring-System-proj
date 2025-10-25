import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Webcam from 'react-webcam';

const Student: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [googleFormLink, setGoogleFormLink] = useState('');
  const [error, setError] = useState('');
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/session/${sessionId}`);
        if (response.data.status === 'success') {
          setGoogleFormLink(response.data.data.google_form_link);
        } else {
          setError(response.data.message || 'Could not load session');
        }
      } catch (err) {
        setError('Failed to load session data.');
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          axios.post('http://127.0.0.1:8000/api/submit-frame', { 
            session_id: sessionId, 
            frame: imageSrc 
          });
        }
      }
    }, 5000); // Send a frame every 5 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!googleFormLink) {
    return <div className="p-8">Loading test...</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="flex-grow">
        <iframe src={googleFormLink} width="100%" height="100%" frameBorder="0" allowFullScreen></iframe>
      </div>
      <div className="w-1/4 p-4 bg-gray-100 border-l">
        <h2 className="text-xl font-bold mb-4">Proctoring</h2>
        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">Your camera is being monitored for proctoring purposes.</p>
      </div>
    </div>
  );
};

export default Student;