
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UserPlus, Mail, User, Calendar, ArrowLeft } from 'lucide-react';

interface EmployeeRegistrationFormProps {
  onBack: () => void;
}

const EmployeeRegistrationForm: React.FC<EmployeeRegistrationFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    joiningDate: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateEmployeeId = () => {
    const existingUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const employees = existingUsers.filter((user: any) => user.role === 'employee');
    const nextId = employees.length + 1;
    return `EMP${nextId.toString().padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.joiningDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Check if email already exists
    const existingUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const emailExists = existingUsers.some((user: any) => user.email === formData.email);

    if (emailExists) {
      toast({
        title: "Error",
        description: "Email already registered",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const employeeId = generateEmployeeId();
    
    const newEmployee = {
      id: Date.now().toString(),
      employeeId,
      name: formData.name,
      email: formData.email,
      role: 'employee',
      department: '',
      designation: '',
      isActive: false, // Requires admin approval
      joinDate: formData.joiningDate,
      phone: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      workMode: '',
      reportingManager: '',
      performanceScore: 0,
      profilePicture: '',
      createdAt: new Date().toISOString(),
      needsOtpVerification: true,
      otp: '',
      otpExpiry: ''
    };

    existingUsers.push(newEmployee);
    localStorage.setItem('hrms_users', JSON.stringify(existingUsers));

    // Store pending registration for admin approval
    const pendingRegistrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
    pendingRegistrations.push({
      ...newEmployee,
      status: 'pending_approval',
      appliedAt: new Date().toISOString()
    });
    localStorage.setItem('pending_registrations', JSON.stringify(pendingRegistrations));

    toast({
      title: "Registration Submitted",
      description: `Your registration has been submitted for admin approval. Employee ID: ${employeeId}`,
    });

    setFormData({ name: '', email: '', joiningDate: '' });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Employee Registration</CardTitle>
            <CardDescription>
              Register for admin approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeRegistrationForm;
