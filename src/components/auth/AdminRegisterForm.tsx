
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';
import AdminRegisterFormFields from './AdminRegisterFormFields';

interface AdminRegisterFormProps {
  onBack: () => void;
}

const AdminRegisterForm: React.FC<AdminRegisterFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Administration',
    designation: 'Administrator',
    companyName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const existingUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
      const adminCount = existingUsers.filter((user: any) => user.role === 'admin').length;
      const adminId = `ADMIN${String(adminCount + 1).padStart(3, '0')}`;
      
      const emailExists = existingUsers.some((user: any) => user.email === formData.email);
      if (emailExists) {
        toast({
          title: "Error",
          description: "Email already exists. Please use a different email.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const newAdmin = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        companyName: formData.companyName,
        password: formData.password,
        employeeId: adminId,
        role: 'admin',
        isActive: true,
        joinDate: new Date().toISOString().split('T')[0],
        workMode: 'On-site',
        createdAt: new Date().toISOString()
      };
      
      existingUsers.push(newAdmin);
      localStorage.setItem('hrms_users', JSON.stringify(existingUsers));
      
      toast({
        title: "Success",
        description: `Admin registration successful! Your Admin ID is: ${adminId}`,
      });

      // Auto-login the newly registered admin
      const loginSuccess = await login(formData.email, formData.password, 'admin');
      
      if (loginSuccess) {
        toast({
          title: "Welcome!",
          description: "You have been automatically logged in.",
        });
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Admin Registration</CardTitle>
                  <p className="text-gray-600 mt-1">Create administrator account</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <AdminRegisterFormFields
                formData={formData}
                onChange={handleFieldChange}
              />

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register as Admin'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                <p>By registering as an admin, you will have full access to:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Employee management and data</li>
                  <li>• Leave requests and approvals</li>
                  <li>• Attendance tracking</li>
                  <li>• System settings and reports</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminRegisterForm;
