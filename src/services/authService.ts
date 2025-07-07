
import { User } from '../types/auth';
import { PREDEFINED_ADMINS } from '../constants/adminCredentials';
import { verifyPassword, verifyAdminPassword, hashPassword } from '../utils/passwordUtils';
import { generateOtp, sendOtpToAdmin, storeOtpData, getStoredOtpData, clearOtpData } from '../utils/authUtils';

export const authenticateAdmin = (email: string, password: string): User | null => {
  if (!verifyAdminPassword(email, password)) {
    return null;
  }
  
  const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
  return users.find((u: User) => u.email === email && u.role === 'admin') || null;
};

export const authenticateEmployee = async (
  email: string, 
  password: string
): Promise<{ success: boolean; message?: string; user?: User }> => {
  const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
  const foundUser = users.find((u: User) => u.email === email && u.role === 'employee');
  
  if (!foundUser) {
    return { success: false, message: 'Employee not found' };
  }
  
  if (!foundUser.isActive) {
    return { success: false, message: 'Account pending admin approval' };
  }
  
  if (!foundUser.hashedPassword || !verifyPassword(password, foundUser.hashedPassword)) {
    return { success: false, message: 'Invalid password' };
  }
  
  return { success: true, user: foundUser };
};

export const sendOtpForPasswordReset = async (email: string): Promise<boolean> => {
  const otp = generateOtp();
  const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
  const user = users.find((u: User) => u.email === email);
  
  if (user) {
    storeOtpData(email, otp);
    return await sendOtpToAdmin(otp, user.name, user.employeeId || user.id);
  }
  
  return false;
};

export const resetUserPassword = (email: string, newPassword: string, otp: string): boolean => {
  try {
    const storedOtpData = getStoredOtpData();
    
    if (storedOtpData?.email !== email || 
        storedOtpData.otp !== otp || 
        Date.now() >= storedOtpData.expiresAt) {
      return false;
    }
    
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const updatedUsers = users.map((u: User) => {
      if (u.email === email) {
        return { ...u, hashedPassword: hashPassword(newPassword) };
      }
      return u;
    });
    
    localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
    clearOtpData();
    
    return true;
  } catch (error) {
    console.error('Reset password error:', error);
    return false;
  }
};
