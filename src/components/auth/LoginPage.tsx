
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { Users, UserCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import RegisterForm from './RegisterForm';
import AdminRegisterForm from './AdminRegisterForm';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');
  const [showRegister, setShowRegister] = useState(false);
  const [showAdminRegister, setShowAdminRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await login(email, password, activeTab);
    setLoading(false);

    if (success) {
      toast({
        title: "Success",
        description: "Login successful!",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid credentials or inactive account",
        variant: "destructive",
      });
    }
  };

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  if (showAdminRegister) {
    return <AdminRegisterForm onBack={() => setShowAdminRegister(false)} />;
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
          {/* Admin Login */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`cursor-pointer transition-all duration-300 ${
              activeTab === 'admin' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
            }`}>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Admin Portal</CardTitle>
                <CardDescription>Manage your organization</CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === 'admin' && (
                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="admin@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In as Admin'}
                    </Button>
                  </motion.form>
                )}
                {activeTab !== 'admin' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('admin')}
                  >
                    Login as Admin
                  </Button>
                )}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAdminRegister(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    New Admin? Register here
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Employee Login */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={`cursor-pointer transition-all duration-300 ${
              activeTab === 'employee' ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-md'
            }`}>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Employee Portal</CardTitle>
                <CardDescription>Access your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === 'employee' && (
                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="employee@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700 transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In as Employee'}
                    </Button>
                  </motion.form>
                )}
                {activeTab !== 'employee' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('employee')}
                  >
                    Login as Employee
                  </Button>
                )}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    New Employee? Register here
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
