
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserPlus, ArrowLeft, Upload, User } from 'lucide-react';
import bcrypt from 'bcryptjs';

interface EmployeeRegistrationFormProps {
  onBack: () => void;
}

const EmployeeRegistrationForm: React.FC<EmployeeRegistrationFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: '',
    designation: '',
    joinDate: '',
    workMode: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    profileImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Error",
          description: "Profile image must be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileImagePreview(result);
        setFormData(prev => ({ ...prev, profileImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateEmployeeId = () => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone || 
        !formData.department || !formData.designation || !formData.joinDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

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

    // Check if email already exists
    const existingUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    if (existingUsers.some((user: any) => user.email === formData.email)) {
      toast({
        title: "Error",
        description: "Email already registered",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const employeeId = generateEmployeeId();
      const hashedPassword = bcrypt.hashSync(formData.password, 10);

      const newEmployee = {
        id: `emp-${Date.now()}`,
        employeeId,
        name: formData.name,
        email: formData.email,
        hashedPassword,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        joinDate: formData.joinDate,
        workMode: formData.workMode || 'On-site',
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        profileImage: formData.profileImage,
        role: 'employee',
        isActive: false, // Pending admin approval
        isFirstTimeLogin: true,
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Add to users list
      const updatedUsers = [...existingUsers, newEmployee];
      localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));

      // Add to pending registrations
      const pendingRegistrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
      const pendingEmployee = {
        ...newEmployee,
        status: 'pending_approval'
      };
      pendingRegistrations.push(pendingEmployee);
      localStorage.setItem('pending_registrations', JSON.stringify(pendingRegistrations));

      toast({
        title: "Registration Successful",
        description: `Employee ID: ${employeeId}. Your registration is pending admin approval.`,
      });

      onBack();
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Employee Registration</CardTitle>
            <CardDescription>
              Join our organization - Registration is subject to admin approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Image Upload */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profileImage"
                    />
                    <Label htmlFor="profileImage" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </span>
                      </Button>
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">Max 2MB, JPG/PNG</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="employee@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="10-digit phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    placeholder="Job title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date *</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workMode">Work Mode</Label>
                  <Select onValueChange={(value) => handleInputChange('workMode', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On-site">On-site</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Emergency contact name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Full address"
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register as Employee'}
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
