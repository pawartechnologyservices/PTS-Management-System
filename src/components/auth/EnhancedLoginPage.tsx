
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLoginPage from './AdminLoginPage';
import AdminRegisterForm from './AdminRegisterForm';
import LoginCard from './LoginCard';
import EmployeeRegistrationForm from './EmployeeRegistrationForm';
import OtpVerificationForm from './OtpVerificationForm';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';

const EnhancedLoginPage = () => {
  const [activeView, setActiveView] = useState<'main' | 'admin' | 'admin-register' | 'employee-register' | 'employee-otp'>('main');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleEmployeeLogin = async (email: string, password: string) => {
    setLoading(true);
    
    // Check if user exists and is approved
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.role === 'employee');
    
    if (!user) {
      toast({
        title: "Error",
        description: "Employee not found. Please register first.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    if (!user.isActive) {
      toast({
        title: "Account Pending",
        description: "Your account is pending admin approval.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    if (user.needsOtpVerification || user.otp) {
      setEmployeeEmail(email);
      setActiveView('employee-otp');
      setLoading(false);
      return;
    }
    
    const success = await login(email, password, 'employee');
    setLoading(false);
    
    if (success) {
      toast({
        title: "Success",
        description: "Login successful!",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const handleOtpSuccess = async () => {
    const success = await login(employeeEmail, '', 'employee');
    if (success) {
      toast({
        title: "Success",
        description: "Login successful!",
      });
    }
  };

  if (activeView === 'admin') {
    return <AdminLoginPage />;
  }

  if (activeView === 'admin-register') {
    return (
      <AdminRegisterForm 
        onBack={() => setActiveView('main')} 
      />
    );
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
        onSuccess={handleOtpSuccess}
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
              onRegister={() => setActiveView('admin-register')}
              loading={false}
              isButton={true}
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
