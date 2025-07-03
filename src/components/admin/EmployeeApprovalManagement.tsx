import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { UserCheck, UserX, Send, Calendar, Mail, User, Phone } from 'lucide-react';
import { SMSService } from '../../utils/smsService';

interface PendingEmployee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  appliedAt: string;
  status: string;
}

const EmployeeApprovalManagement = () => {
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [otpInputs, setOtpInputs] = useState<{[key: string]: string}>({});
  const [sendingOtp, setSendingOtp] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadPendingEmployees();
  }, []);

  const loadPendingEmployees = () => {
    const pending = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
    setPendingEmployees(pending.filter((emp: PendingEmployee) => emp.status === 'pending_approval'));
  };

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const getAdminPhone = () => {
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('hrms_user') || '{}');
    const admin = users.find((user: any) => user.role === 'admin' && user.id === currentUser.id);
    return admin?.phone || '';
  };

  const approveEmployee = async (employeeId: string) => {
    const otpCode = otpInputs[employeeId];
    
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a 6-digit OTP",
        variant: "destructive"
      });
      return;
    }

    const employee = pendingEmployees.find(emp => emp.employeeId === employeeId);
    if (!employee) return;

    // Update user in main users list
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const updatedUsers = users.map((user: any) => {
      if (user.employeeId === employeeId) {
        return {
          ...user,
          isActive: true,
          otp: otpCode,
          otpExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          needsOtpVerification: true,
          approvedAt: new Date().toISOString()
        };
      }
      return user;
    });

    // Update pending registrations
    const pending = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
    const updatedPending = pending.map((emp: PendingEmployee) => {
      if (emp.employeeId === employeeId) {
        return { ...emp, status: 'approved', approvedAt: new Date().toISOString() };
      }
      return emp;
    });

    localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
    localStorage.setItem('pending_registrations', JSON.stringify(updatedPending));

    // Send approval notification to employee
    if (employee.phone) {
      await SMSService.sendApprovalNotification(
        employee.phone,
        employee.name,
        employee.employeeId
      );
    }

    toast({
      title: "Employee Approved",
      description: `${employee.name} has been approved. Notifications sent via SMS.`,
    });

    setOtpInputs(prev => ({ ...prev, [employeeId]: '' }));
    loadPendingEmployees();
  };

  const rejectEmployee = (employeeId: string) => {
    // Update pending registrations
    const pending = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
    const updatedPending = pending.map((emp: PendingEmployee) => {
      if (emp.employeeId === employeeId) {
        return { ...emp, status: 'rejected', rejectedAt: new Date().toISOString() };
      }
      return emp;
    });

    // Remove from main users list
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const updatedUsers = users.filter((user: any) => user.employeeId !== employeeId);

    localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
    localStorage.setItem('pending_registrations', JSON.stringify(updatedPending));

    toast({
      title: "Employee Rejected",
      description: `Employee ${employeeId} registration has been rejected`,
      variant: "destructive"
    });

    loadPendingEmployees();
  };

  const handleOtpChange = (employeeId: string, value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpInputs(prev => ({ ...prev, [employeeId]: numericValue }));
  };

  const autoGenerateAndSendOtp = async (employeeId: string) => {
    const employee = pendingEmployees.find(emp => emp.employeeId === employeeId);
    if (!employee) return;

    const adminPhone = getAdminPhone();
    if (!adminPhone) {
      toast({
        title: "Error",
        description: "Admin phone number not found. Please update your profile.",
        variant: "destructive"
      });
      return;
    }

    setSendingOtp(prev => ({ ...prev, [employeeId]: true }));

    try {
      const otp = generateOtp();
      setOtpInputs(prev => ({ ...prev, [employeeId]: otp }));
      
      // Send OTP to admin's phone
      const success = await SMSService.sendOTPNotification(
        adminPhone,
        employee.name,
        employee.employeeId,
        otp
      );

      if (success) {
        toast({
          title: "OTP Sent Successfully",
          description: `OTP ${otp} sent to admin phone: ${adminPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3')}`,
        });
      } else {
        toast({
          title: "SMS Failed",
          description: "Failed to send OTP via SMS. You can still use the generated OTP manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingOtp(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Approval</h1>
          <p className="text-gray-600">Review and approve pending employee registrations</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              API Integrated
            </Badge>
            <p className="text-sm text-blue-600">OTP notifications sent to admin phone</p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {pendingEmployees.length} Pending
        </Badge>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Pending Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending employee registrations
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEmployees.map((employee, index) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">{employee.name}</span>
                          <Badge className="bg-blue-100 text-blue-700">
                            {employee.employeeId}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {employee.email}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {employee.phone}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          Joining: {new Date(employee.joinDate).toLocaleDateString()}
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Applied: {new Date(employee.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Generate & Send OTP to Admin Phone
                          </label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="6-digit OTP"
                              value={otpInputs[employee.employeeId] || ''}
                              onChange={(e) => handleOtpChange(employee.employeeId, e.target.value)}
                              className="text-center font-mono"
                              maxLength={6}
                            />
                            <Button
                              onClick={() => autoGenerateAndSendOtp(employee.employeeId)}
                              variant="outline"
                              size="sm"
                              disabled={sendingOtp[employee.employeeId]}
                            >
                              {sendingOtp[employee.employeeId] ? (
                                <div className="h-4 w-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            SMS will be sent to admin & employee
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveEmployee(employee.employeeId)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={!otpInputs[employee.employeeId] || otpInputs[employee.employeeId].length !== 6}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Approve & Notify
                          </Button>
                          
                          <Button
                            onClick={() => rejectEmployee(employee.employeeId)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeApprovalManagement;
