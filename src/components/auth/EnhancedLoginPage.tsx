
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLoginPage from './AdminLoginPage';
import LoginCard from './LoginCard';
import EmployeeRegistrationForm from './EmployeeRegistrationForm';
import OtpVerificationForm from './OtpVerificationForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';

const EnhancedLoginPage = () => {
  const [activeView, setActiveView] = useState<'main' | 'admin' | 'employee-register' | 'employee-otp' | 'forgot-password'>('main');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, sendOtp } = useAuth();
  const { toast } = useToast();

  const handleEmployeeLogin = async (email: string, password: string) => {
    setLoading(true);
    setEmployeeEmail(email);
    setEmployeePassword(password);
    
    const result = await login(email, password, 'employee');
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Login successful!",
      });
    } else if (result.requiresOtp) {
      setActiveView('employee-otp');
      toast({
        title: "OTP Sent",
        description: result.message || "OTP has been sent for verification.",
      });
    } else {
      toast({
        title: "Error",
        description: result.message || "Login failed",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleOtpVerification = async (otp: string) => {
    setLoading(true);
    
    const result = await login(employeeEmail, employeePassword, 'employee', otp);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Login successful!",
      });
    } else {
      toast({
        title: "Error",
        description: result.message || "OTP verification failed",
        variant: "destructive",
      });
    }
    
    setLoading(false);
    return result.success;
  };

  if (activeView === 'admin') {
    return <AdminLoginPage onForgotPassword={() => setActiveView('forgot-password')} />;
  }

  if (activeView === 'employee-register') {
    return (
      <EmployeeRegistrationForm 
        onBack={() => setActiveView('main')} 
      />
    );
  }

  if (activeView === 'employee-otp') {
    return (
      <OtpVerificationForm
        email={employeeEmail}
        onVerify={handleOtpVerification}
        onBack={() => setActiveView('main')}
        loading={loading}
      />
    );
  }

  if (activeView === 'forgot-password') {
    return (
      <ForgotPasswordForm
        onBack={() => setActiveView('main')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-900 mb-2"
          >
            HRMS Portal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600"
          >
            Human Resource Management System
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <LoginCard
              userType="admin"
              isActive={true}
              onActivate={() => {}}
              onLogin={() => setActiveView('admin')}
              onRegister={() => {
                toast({
                  title: "Admin Registration Disabled",
                  description: "Admin accounts are pre-configured. Please contact system administrator.",
                  variant: "destructive",
                });
              }}
              loading={false}
              isButton={true}
              hideRegister={true}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LoginCard
              userType="employee"
              isActive={true}
              onActivate={() => {}}
              onLogin={handleEmployeeLogin}
              onRegister={() => setActiveView('employee-register')}
              loading={loading}
              isButton={false}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedLoginPage;
