
import bcrypt from 'bcryptjs';
import { User, OtpData } from '../types/auth';
import { PREDEFINED_ADMINS } from '../constants/adminCredentials';
import { SMSService } from './smsService';

export const initializePredefinedAdmins = () => {
  const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
  
  PREDEFINED_ADMINS.forEach(predefinedAdmin => {
    const existingAdmin = users.find((user: User) => user.email === predefinedAdmin.email);
    
    if (!existingAdmin) {
      const adminUser = {
        id: predefinedAdmin.id,
        email: predefinedAdmin.email,
        name: predefinedAdmin.name,
        role: 'admin' as const,
        department: 'Management',
        designation: predefinedAdmin.designation,
        employeeId: predefinedAdmin.id.toUpperCase(),
        isActive: true,
        phone: predefinedAdmin.phone || '+919096649556', // Use admin's phone from constants
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        joinDate: new Date().toISOString().split('T')[0],
        workMode: 'On-site',
        reportingManager: '',
        hashedPassword: bcrypt.hashSync(predefinedAdmin.password, 10),
        profileImage: '',
        createdAt: new Date().toISOString()
      };
      
      users.push(adminUser);
    }
  });
  
  localStorage.setItem('hrms_users', JSON.stringify(users));
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getAdminPhoneNumber = (): string => {
  const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
  const adminUser = users.find((user: User) => user.role === 'admin');
  return adminUser?.phone || '+919096649556'; // Fallback to default number
};

export const sendOtpToAdmin = async (otp: string, employeeName: string, employeeId: string): Promise<boolean> => {
  try {
    const adminPhone = getAdminPhoneNumber();
    console.log(`Sending OTP ${otp} to admin at ${adminPhone} for employee verification`);
    
    // Use the actual SMS service
    const success = await SMSService.sendOTPNotification(adminPhone, employeeName, employeeId, otp);
    
    if (success) {
      console.log(`OTP successfully sent to admin phone: ${adminPhone}`);
    } else {
      console.error('Failed to send OTP via SMS service');
    }
    
    return success;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
};

export const storeOtpData = (email: string, otp: string): void => {
  const otpData: OtpData = {
    email,
    otp,
    timestamp: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  };
  
  localStorage.setItem('pending_otp', JSON.stringify(otpData));
};

export const getStoredOtpData = (): OtpData | null => {
  try {
    const storedData = localStorage.getItem('pending_otp');
    return storedData ? JSON.parse(storedData) : null;
  } catch {
    return null;
  }
};

export const clearOtpData = (): void => {
  localStorage.removeItem('pending_otp');
};
