import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from '../components/AdminLogin';
import AdminSignup from '../components/AdminSignup';
import OTPVerification from '../components/OTPVerification';

type AuthStep = 'login' | 'signup' | 'otp';

const AuthPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [signupEmail, setSignupEmail] = useState('');
  const [admin, setAdmin] = useState<any>(null);
  const navigate = useNavigate();

  // Check if admin is already logged in
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = (adminData: any) => {
    setAdmin(adminData);
    navigate('/admin');
  };

  const handleSignupSuccess = (email: string) => {
    setSignupEmail(email);
    setCurrentStep('otp');
  };

  const handleOTPVerificationSuccess = () => {
    setCurrentStep('login');
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
  };

  const handleShowSignup = () => {
    setCurrentStep('signup');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'login':
        return (
          <AdminLogin
            onLogin={handleLogin}
            onShowSignup={handleShowSignup}
          />
        );
      case 'signup':
        return (
          <AdminSignup
            onBack={handleBackToLogin}
            onSignupSuccess={handleSignupSuccess}
          />
        );
      case 'otp':
        return (
          <OTPVerification
            email={signupEmail}
            onVerificationSuccess={handleOTPVerificationSuccess}
            onBack={handleBackToLogin}
          />
        );
      default:
        return (
          <AdminLogin
            onLogin={handleLogin}
          />
        );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => setCurrentStep('login')}
          className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-primary-600 font-medium">Proctoring System</span>
        </button>
      </div>

      {/* Step Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
          <div className={`w-2 h-2 rounded-full ${currentStep === 'login' ? 'bg-primary-500' : 'bg-secondary-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'signup' ? 'bg-primary-500' : 'bg-secondary-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'otp' ? 'bg-primary-500' : 'bg-secondary-300'}`}></div>
        </div>
      </div>

      {/* Main Content */}
      {renderCurrentStep()}
    </div>
  );
};

export default AuthPage;
