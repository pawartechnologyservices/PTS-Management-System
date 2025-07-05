
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth';
import { initializePredefinedAdmins } from '../utils/authUtils';
import { authenticateAdmin, authenticateEmployee, sendOtpForPasswordReset, resetUserPassword } from '../services/authService';
import { verifyUserPassword, hashPassword } from '../utils/passwordUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('hrms_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
    
    // Initialize predefined admin users
    initializePredefinedAdmins();
  }, []);

  const login = async (email: string, password: string, role: string, otp?: string): Promise<{ success: boolean; requiresOtp?: boolean; message?: string }> => {
    try {
      if (role === 'admin') {
        const adminUser = authenticateAdmin(email, password);
        if (adminUser) {
          setUser(adminUser);
          localStorage.setItem('hrms_user', JSON.stringify(adminUser));
          return { success: true };
        }
        return { success: false, message: 'Invalid admin credentials' };
      }
      
      if (role === 'employee') {
        const result = await authenticateEmployee(email, password, otp);
        if (result.success && result.user) {
          setUser(result.user);
          localStorage.setItem('hrms_user', JSON.stringify(result.user));
        }
        return result;
      }
      
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const sendOtp = async (email: string): Promise<boolean> => {
    return await sendOtpForPasswordReset(email);
  };

  const resetPassword = async (email: string, newPassword: string, otp: string): Promise<boolean> => {
    return resetUserPassword(email, newPassword, otp);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
      const currentUser = users.find((u: User) => u.id === user.id);
      
      if (!currentUser || !verifyUserPassword(currentUser, currentPassword)) {
        return false;
      }
      
      const updatedUsers = users.map((u: User) => {
        if (u.id === user.id) {
          return { ...u, hashedPassword: hashPassword(newPassword) };
        }
        return u;
      });
      
      localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
      
      const updatedUser = { ...user, hashedPassword: hashPassword(newPassword) };
      setUser(updatedUser);
      localStorage.setItem('hrms_user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrms_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, sendOtp, resetPassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
