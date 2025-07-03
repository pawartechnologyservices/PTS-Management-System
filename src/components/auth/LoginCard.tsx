
import React from 'react';
import { Users, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import LoginForm from './LoginForm';

interface LoginCardProps {
  userType: 'admin' | 'employee';
  isActive: boolean;
  onActivate: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: () => void;
  loading: boolean;
}

const LoginCard: React.FC<LoginCardProps> = ({
  userType,
  isActive,
  onActivate,
  onLogin,
  onRegister,
  loading
}) => {
  const isAdmin = userType === 'admin';
  const Icon = isAdmin ? Users : UserCheck;
  const colorClass = isAdmin ? 'blue' : 'green';

  return (
    <Card className={`cursor-pointer transition-all duration-300 ${
      isActive ? `ring-2 ring-${colorClass}-500 shadow-lg` : 'hover:shadow-md'
    }`}>
      <CardHeader className="text-center">
        <div className={`mx-auto w-16 h-16 bg-${colorClass}-100 rounded-full flex items-center justify-center mb-4`}>
          <Icon className={`w-8 h-8 text-${colorClass}-600`} />
        </div>
        <CardTitle className="text-xl">{isAdmin ? 'Admin' : 'Employee'} Portal</CardTitle>
        <CardDescription>
          {isAdmin ? 'Manage your organization' : 'Access your workspace'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isActive ? (
          <LoginForm
            userType={userType}
            onSubmit={onLogin}
            loading={loading}
          />
        ) : (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onActivate}
          >
            Login as {isAdmin ? 'Admin' : 'Employee'}
          </Button>
        )}
        <div className="mt-4 text-center">
          <button
            onClick={onRegister}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            New {isAdmin ? 'Admin' : 'Employee'}? Register here
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginCard;
