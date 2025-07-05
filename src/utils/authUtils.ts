
import bcrypt from 'bcryptjs';
import { User, OtpData } from '../types/auth';
import { PREDEFINED_ADMINS } from '../constants/adminCredentials';

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
        phone: '',
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

export const sendOtpToStaticNumber = async (otp: string): Promise<boolean> => {
  try {
    console.log(`OTP ${otp} would be sent to 9096649556 for employee verification`);
    // Simulate API call - in real implementation, this would call SMS service
    return true;
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
