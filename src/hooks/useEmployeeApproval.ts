
import { useState, useEffect } from 'react';
import { toast } from '../components/ui/use-toast';
import { SMSService } from '../utils/smsService';

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

export const useEmployeeApproval = () => {
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [otpInputs, setOtpInputs] = useState<{[key: string]: string}>({});
  const [sendingOtp, setSendingOtp] = useState<{[key: string]: boolean}>({});

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
    const pending = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
    const updatedPending = pending.map((emp: PendingEmployee) => {
      if (emp.employeeId === employeeId) {
        return { ...emp, status: 'rejected', rejectedAt: new Date().toISOString() };
      }
      return emp;
    });

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

  useEffect(() => {
    loadPendingEmployees();
  }, []);

  return {
    pendingEmployees,
    otpInputs,
    sendingOtp,
    approveEmployee,
    rejectEmployee,
    handleOtpChange,
    autoGenerateAndSendOtp
  };
};
