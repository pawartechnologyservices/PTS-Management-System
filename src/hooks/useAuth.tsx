import React, { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department: string;
  designation: string;
  employeeId: string;
  isActive: boolean;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  joinDate?: string;
  workMode?: string;
  reportingManager?: string;
  updatedAt?: string;
  password?: string;
  profileImage?: string;
  isFirstTimeLogin?: boolean;
  hashedPassword?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string, otp?: string) => Promise<{ success: boolean; requiresOtp?: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
  sendOtp: (email: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string, otp: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined admin credentials - DO NOT ALLOW REGISTRATION
const PREDEFINED_ADMINS = [
  {
    id: 'admin-001',
    email: 'rahulpawar.ceo@gmail.com',
    password: 'RP2025',
    name: 'Rahul Pawar',
    designation: 'CEO'
  },
  {
    id: 'admin-002', 
    email: 'swapnilgunke.pm@gmail.com',
    password: 'Swapnil2025',
    name: 'Swapnil Gunke',
    designation: 'Product Manager'
  }
];

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

  const initializePredefinedAdmins = () => {
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

  const sendOtpToStaticNumber = async (otp: string): Promise<boolean> => {
    try {
      console.log(`OTP ${otp} would be sent to 9096649556 for employee verification`);
      // Simulate API call - in real implementation, this would call SMS service
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  };

  const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOtp = async (email: string): Promise<boolean> => {
    const otp = generateOtp();
    
    // Store OTP temporarily
    const otpData = {
      email,
      otp,
      timestamp: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    };
    
    localStorage.setItem('pending_otp', JSON.stringify(otpData));
    
    // Send OTP to static number
    return await sendOtpToStaticNumber(otp);
  };

  const login = async (email: string, password: string, role: string, otp?: string): Promise<{ success: boolean; requiresOtp?: boolean; message?: string }> => {
    try {
      const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
      
      if (role === 'admin') {
        // Check predefined admin credentials only
        const predefinedAdmin = PREDEFINED_ADMINS.find(admin => admin.email === email);
        if (predefinedAdmin && predefinedAdmin.password === password) {
          const adminUser = users.find((u: User) => u.email === email);
          if (adminUser) {
            setUser(adminUser);
            localStorage.setItem('hrms_user', JSON.stringify(adminUser));
            return { success: true };
          }
        }
        
        return { success: false, message: 'Invalid admin credentials' };
      }
      
      if (role === 'employee') {
        const foundUser = users.find((u: User) => u.email === email && u.role === 'employee');
        
        if (!foundUser) {
          return { success: false, message: 'Employee not found' };
        }
        
        if (!foundUser.isActive) {
          return { success: false, message: 'Account pending admin approval' };
        }
        
        // Verify password
        const isValidPassword = bcrypt.compareSync(password, foundUser.hashedPassword || '');
        if (!isValidPassword) {
          return { success: false, message: 'Invalid password' };
        }
        
        // Check if first time login
        if (foundUser.isFirstTimeLogin !== false) {
          if (!otp) {
            // Send OTP and require verification
            const otpSent = await sendOtp(email);
            if (otpSent) {
              return { success: false, requiresOtp: true, message: 'OTP sent to admin number (9096649556)' };
            } else {
              return { success: false, message: 'Failed to send OTP' };
            }
          } else {
            // Verify OTP
            const storedOtpData = JSON.parse(localStorage.getItem('pending_otp') || '{}');
            if (storedOtpData.email === email && storedOtpData.otp === otp && Date.now() < storedOtpData.expiresAt) {
              // OTP verified, mark as not first time login
              foundUser.isFirstTimeLogin = false;
              const updatedUsers = users.map((u: User) => u.email === email ? foundUser : u);
              localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
              localStorage.removeItem('pending_otp');
              
              setUser(foundUser);
              localStorage.setItem('hrms_user', JSON.stringify(foundUser));
              return { success: true };
            } else {
              return { success: false, message: 'Invalid or expired OTP' };
            }
          }
        } else {
          // Regular login without OTP (after first successful verification)
          setUser(foundUser);
          localStorage.setItem('hrms_user', JSON.stringify(foundUser));
          return { success: true };
        }
      }
      
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const resetPassword = async (email: string, newPassword: string, otp: string): Promise<boolean> => {
    try {
      const storedOtpData = JSON.parse(localStorage.getItem('pending_otp') || '{}');
      
      if (storedOtpData.email !== email || storedOtpData.otp !== otp || Date.now() >= storedOtpData.expiresAt) {
        return false;
      }
      
      const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
      const updatedUsers = users.map((u: User) => {
        if (u.email === email) {
          return { ...u, hashedPassword: bcrypt.hashSync(newPassword, 10) };
        }
        return u;
      });
      
      localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
      localStorage.removeItem('pending_otp');
      
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
      const currentUser = users.find((u: User) => u.id === user.id);
      
      if (!currentUser) return false;
      
      // For admin, check predefined password first
      if (user.role === 'admin') {
        const predefinedAdmin = PREDEFINED_ADMINS.find(admin => admin.email === user.email);
        const isCurrentPasswordValid = 
          (predefinedAdmin && predefinedAdmin.password === currentPassword) ||
          (currentUser.hashedPassword && bcrypt.compareSync(currentPassword, currentUser.hashedPassword));
        
        if (!isCurrentPasswordValid) return false;
      } else {
        // For employee, check hashed password
        if (!currentUser.hashedPassword || !bcrypt.compareSync(currentPassword, currentUser.hashedPassword)) {
          return false;
        }
      }
      
      // Update password
      const updatedUsers = users.map((u: User) => {
        if (u.id === user.id) {
          return { ...u, hashedPassword: bcrypt.hashSync(newPassword, 10) };
        }
        return u;
      });
      
      localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
      
      // Update current user
      const updatedUser = { ...user, hashedPassword: bcrypt.hashSync(newPassword, 10) };
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
