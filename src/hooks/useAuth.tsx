import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
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
  login: (email: string, password: string, role: string) => Promise<{
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const db = database;
          
          // Check if admin
          const adminRef = ref(db, `users/${firebaseUser.uid}`);
          const adminSnapshot = await get(adminRef);

          if (adminSnapshot.exists() && adminSnapshot.val().role === 'admin') {
            const adminData = adminSnapshot.val();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: adminData.name || '',
              role: 'admin',
              createdAt: adminData.createdAt || new Date().toISOString(),
              profileImage: adminData.profileImage,
            });
            setLoading(false);
            return;
          }

          // Check if employee
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

            if (employeeData) {
              setUser({
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
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
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
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;
      const db = database;

      if (role === 'admin') {
        const adminRef = ref(db, `users/${firebaseUser.uid}`);
        const adminSnapshot = await get(adminRef);

        if (!adminSnapshot.exists()) {
          await signOut(auth);
          return { success: false, message: 'Admin record not found' };
        }

        const adminData = adminSnapshot.val();

        if (adminData.role !== 'admin') {
          await signOut(auth);
          return { success: false, message: 'Not authorized as admin' };
        }

        return { success: true };
      } else {
        const employeesRef = ref(db, 'users');
        const snapshot = await get(employeesRef);

        if (!snapshot.exists()) {
          await signOut(auth);
          return { success: false, message: 'No employees found' };
        }

        let employeeFound = false;

        snapshot.forEach((adminSnapshot) => {
          const employees = adminSnapshot.child('employees').val();
          if (employees) {
            Object.values(employees).forEach((emp: any) => {
              if (emp.email === email) {
                employeeFound = true;
              }
            });
          }
        });

        if (!employeeFound) {
          await signOut(auth);
          return { success: false, message: 'Employee not found' };
        }

        return { success: true };
      }
    } catch (error: any) {
      let errorMessage = 'Login failed';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Account disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'User not found';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      return { success: false, message: errorMessage };
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