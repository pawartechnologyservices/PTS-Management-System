import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  DollarSign, 
 
  Home, 
  Briefcase,
  CreditCard,
  Banknote,
  Clock,
  Contact
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employeeId: string;
  isActive: boolean;
  createdAt: string;
  profileImage?: string;
  joiningDate?: string;
  salary?: number;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  address?: string;
  workMode?: string;
  employmentType?: string;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  addedBy?: string;
  status?: string;
}

interface EmployeeDetailsDialogProps {
  employee: Employee | null;
  onClose: () => void;
}

const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({
  employee,
  onClose
}) => {
  if (!employee) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-2 border-gray-200">
              <AvatarImage src={employee.profileImage} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{employee.name}</h2>
                  <p className="text-gray-600">{employee.designation}</p>
                </div>
                <Badge variant={employee.isActive ? "default" : "secondary"}>
                  {employee.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <User className="w-4 h-4" />
                  {employee.employeeId}
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  {employee.department}
                </span>
              </div>
            </div>
          </div>

          {/* Main Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="font-semibold">{employee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <p className="font-semibold">{employee.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    Address
                  </label>
                  <p className="font-semibold">{employee.address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Employment Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joining Date
                  </label>
                  <p className="font-semibold">{formatDate(employee.joiningDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Employment Type
                  </label>
                  <p className="font-semibold">
                    {employee.employmentType ? 
                      employee.employmentType.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-') 
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Salary
                  </label>
                  <p className="font-semibold">{formatCurrency(employee.salary)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    Work Mode
                  </label>
                  <p className="font-semibold">
                    {employee.workMode ? 
                      employee.workMode.charAt(0).toUpperCase() + employee.workMode.slice(1) 
                      : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <Contact className="w-5 h-5" />
                Emergency Contact
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Name</label>
                  <p className="font-semibold">
                    {employee.emergencyContact?.name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Number</label>
                  <p className="font-semibold">
                    {employee.emergencyContact?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Bank Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <p className="font-semibold">
                    {employee.bankDetails?.bankName || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Number</label>
                  <p className="font-semibold">
                    {employee.bankDetails?.accountNumber || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                  <p className="font-semibold">
                    {employee.bankDetails?.ifscCode || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {employee.addedBy && (
            <div className="text-sm text-gray-500">
              Added by admin ID: {employee.addedBy}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDetailsDialog;