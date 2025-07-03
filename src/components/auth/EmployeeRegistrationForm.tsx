
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { UserPlus, Mail, User, Calendar, ArrowLeft, Phone, MapPin, Users, Briefcase } from 'lucide-react';

interface EmployeeRegistrationFormProps {
  onBack: () => void;
}

const EmployeeRegistrationForm: React.FC<EmployeeRegistrationFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joiningDate: '',
    department: '',
    designation: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    workMode: 'On-site'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const departments = [
    'Human Resources', 'Engineering', 'Marketing', 'Sales', 'Finance', 
    'Operations', 'Customer Support', 'Design', 'Legal', 'Administration'
  ];

  const designations = [
    'Software Engineer', 'Senior Developer', 'Project Manager', 'Team Lead',
    'HR Manager', 'Marketing Manager', 'Sales Executive', 'Designer',
    'Analyst', 'Consultant', 'Intern', 'Assistant Manager'
  ];

  const generateEmployeeId = () => {
    const existingUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const employees = existingUsers.filter((user: any) => user.role === 'employee');
    const nextId = employees.length + 1;
    return `EMP${nextId.toString().padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.joiningDate || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
      phone: formData.phone,
      role: 'employee',
      department: formData.department,
      designation: formData.designation,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      workMode: formData.workMode,
      isActive: false, // Requires admin approval
      joinDate: formData.joiningDate,
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

    setFormData({
      name: '',
      email: '',
      phone: '',
      joiningDate: '',
      department: '',
      designation: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      workMode: 'On-site'
    });
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
              Complete registration for admin approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@company.com"
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
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
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
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="joiningDate"
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="pl-10 min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Select value={formData.designation} onValueChange={(value) => setFormData({...formData, designation: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations.map((desig) => (
                          <SelectItem key={desig} value={desig}>{desig}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workMode">Work Mode</Label>
                  <Select value={formData.workMode} onValueChange={(value) => setFormData({...formData, workMode: value})}>
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
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="emergencyContact"
                        type="text"
                        placeholder="Contact person name"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        placeholder="Emergency contact number"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
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
