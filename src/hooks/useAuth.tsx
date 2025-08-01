import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from '../firebase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt: string;
  profileImage?: string;
  department?: string;
  designation?: string;
  status?: string;
  managedBy?: string;
  adminUid?: string;
  employeeId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string, 
    password: string, 
    role: string
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;
  signup: (
    email: string,
    password: string,
    userData: Partial<User>
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;
  logout: () => Promise<void>;
  loading: boolean;
  resetPassword: (email: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  changePassword: (newPassword: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const db = database;
      
      // Check if admin
      const adminRef = ref(db, `users/${firebaseUser.uid}`);
      const adminSnapshot = await get(adminRef);

      if (adminSnapshot.exists() && adminSnapshot.val().role === 'admin') {
        const adminData = adminSnapshot.val();
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: adminData.name || '',
          role: 'admin',
          createdAt: adminData.createdAt || new Date().toISOString(),
          profileImage: adminData.profileImage,
        };
      }

      // Check if employee exists in any admin's employee list
      const employeesRef = ref(db, 'users');
      const snapshot = await get(employeesRef);

      if (snapshot.exists()) {
        let employeeData: any = null;
        let adminUid = '';
        let employeeId = '';

        snapshot.forEach((adminSnapshot) => {
          const employees = adminSnapshot.child('employees').val();
          if (employees) {
            Object.entries(employees).forEach(([key, emp]: [string, any]) => {
              if (emp.email === firebaseUser.email) {
                employeeData = emp;
                adminUid = adminSnapshot.key || '';
                employeeId = key;
              }
            });
          }
        });

        if (!employeeData) {
          return null;
        }

        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: employeeData.name || '',
          role: 'employee',
          createdAt: employeeData.createdAt || new Date().toISOString(),
          profileImage: employeeData.profileImage,
          department: employeeData.department,
          designation: employeeData.designation,
          status: employeeData.status,
          managedBy: employeeData.managedBy,
          adminUid,
          employeeId,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: string
  ): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      // First check if employee exists in database if role is employee
      if (role === 'employee') {
        const employeeExists = await checkEmployeeExists(email);
        if (!employeeExists) {
          return { 
            success: false, 
            message: 'Employee account not found or has been deleted' 
          };
        }
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login timestamp
      if (userCredential.user.uid) {
        await set(ref(database, `users/${userCredential.user.uid}/lastLogin`), 
          new Date().toISOString());
      }

      const completeUserData = await fetchUserData(userCredential.user);
      if (!completeUserData) {
        await signOut(auth);
        return { 
          success: false, 
          message: 'User data not found. Account may have been deleted.' 
        };
      }
      
      setUser(completeUserData);
      return { success: true };
    } catch (error: any) {
      let message = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        message = 'User not found';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    userData: Partial<User>
  ): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store user data in database
      await set(ref(database, `users/${userCredential.user.uid}`), {
        ...userData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      const completeUserData = await fetchUserData(userCredential.user);
      setUser(completeUserData);
      
      return { success: true };
    } catch (error: any) {
      let message = 'Signup failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email already in use';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      }
      console.error('Signup error:', error);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const checkEmployeeExists = async (email: string): Promise<boolean> => {
    try {
      const employeesRef = ref(database, 'users');
      const snapshot = await get(employeesRef);

      if (snapshot.exists()) {
        let exists = false;
        
        snapshot.forEach((adminSnapshot) => {
          const employees = adminSnapshot.child('employees').val();
          if (employees) {
            Object.values(employees).forEach((emp: any) => {
              if (emp.email === email) {
                exists = true;
              }
            });
          }
        });
        
        return exists;
      }
      return false;
    } catch (error) {
      console.error('Error checking employee existence:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Password reset failed',
      };
    }
  };

  const changePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
      }
      return { success: false, message: 'No authenticated user' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Password change failed',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        loading,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};