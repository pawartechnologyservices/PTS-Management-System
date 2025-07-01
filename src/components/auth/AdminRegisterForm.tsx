
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, Building, UserCog, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

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
      // Generate admin ID
      const adminId = `ADM${Date.now().toString().slice(-6)}`;
      
      // Get existing users
      const existingUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
      
      // Check if email already exists
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
      
      // Create new admin user
      const newAdmin = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        employeeId: adminId,
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        password: formData.password,
        companyName: formData.companyName
      };
      
      // Add to users array
      existingUsers.push(newAdmin);
      localStorage.setItem('hrms_users', JSON.stringify(existingUsers));
      
      toast({
        title: "Success",
        description: `Admin registration successful! Your Admin ID is: ${adminId}`,
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'Administration',
        designation: 'Administrator',
        companyName: '',
        password: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        onBack();
      }, 2000);
      
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
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="admin@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <div className="relative">
                    <UserCog className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Designation</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="Create password (min 6 chars)"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>

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
