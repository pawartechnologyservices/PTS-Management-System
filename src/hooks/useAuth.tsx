import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

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
    
    // Initialize admin user if none exists
    initializeAdminUser();
  }, []);

  const initializeAdminUser = () => {
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const adminExists = users.some((user: User) => user.role === 'admin');
    
    if (!adminExists) {
      const adminUser = {
        id: 'admin-001',
        email: 'admin@company.com',
        name: 'System Administrator',
        role: 'admin',
        department: 'IT',
        designation: 'Administrator',
        employeeId: 'ADMIN001',
        isActive: true,
        phone: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        joinDate: new Date().toISOString().split('T')[0],
        workMode: 'On-site',
        reportingManager: '',
        createdAt: new Date().toISOString()
      };
      
      users.push(adminUser);
      localStorage.setItem('hrms_users', JSON.stringify(users));
    }
  };

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
    try {
      // Simple password check - in real app, this would be handled by backend
      if (role === 'admin' && email === 'admin@company.com' && password === 'admin123') {
        const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
        const adminUser = users.find((u: User) => u.email === email && u.role === 'admin');
        
        if (adminUser) {
          setUser(adminUser);
          localStorage.setItem('hrms_user', JSON.stringify(adminUser));
          return true;
        }
      }
      
      if (role === 'employee') {
        const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
        const foundUser = users.find((u: User) => u.email === email && u.role === role);
        
        if (foundUser && foundUser.isActive) {
          // Check if user needs OTP verification
          if (foundUser.needsOtpVerification) {
            return false; // Will be handled by OTP flow
          }
          
          setUser(foundUser);
          localStorage.setItem('hrms_user', JSON.stringify(foundUser));
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrms_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
