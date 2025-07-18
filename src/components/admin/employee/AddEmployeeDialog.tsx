import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Plus, Upload, Camera, User, Phone, Calendar, DollarSign, FirstAid } from 'lucide-react';
import { getDatabase, ref, set } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComp } from '../../ui/calendar';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';

interface NewEmployee {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  password: string;
  profileImage: string;
  joiningDate: Date | undefined;
  salary: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  address: string;
  workMode: string;
  employmentType: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
}

interface AddEmployeeDialogProps {
  departments: string[];
  designations: string[];
  onSuccess?: (employeeUid: string) => void;
}

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  departments,
  designations,
  onSuccess
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<NewEmployee>({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    password: '',
    profileImage: '',
    joiningDate: undefined,
    salary: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    address: '',
    workMode: 'office',
    employmentType: 'full-time',
    bankAccountNumber: '',
    bankName: '',
    ifscCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workModes = ['office', 'remote', 'hybrid'];
  const employmentTypes = ['full-time', 'part-time', 'contract', 'internship'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user || user.role !== 'admin') {
      setError('Only admins can add employees');
      return;
    }

    // Required field validation
    const requiredFields = [
      'name', 'email', 'phone', 'password', 
      'department', 'designation', 'joiningDate',
      'salary', 'emergencyContactName', 'emergencyContactNumber'
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof NewEmployee]);

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.emergencyContactNumber && formData.emergencyContactNumber.length < 10) {
      setError('Emergency contact number must be at least 10 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const employeeUid = userCredential.user.uid;

      // 2. Prepare employee data for database
      const employeeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        profileImage: formData.profileImage,
        joiningDate: formData.joiningDate?.toISOString(),
        salary: parseFloat(formData.salary),
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactNumber
        },
        address: formData.address,
        workMode: formData.workMode,
        employmentType: formData.employmentType,
        bankDetails: {
          accountNumber: formData.bankAccountNumber,
          bankName: formData.bankName,
          ifscCode: formData.ifscCode
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'employee',
        addedBy: user.id,
        status: 'active'
      };

      // 3. Save to Realtime Database under the admin's UID
      const employeeRef = ref(database, `users/${user.id}/employees/${employeeUid}`);
      await set(employeeRef, employeeData);

      // 4. Also store a reference under the employee's own UID
      const employeeSelfRef = ref(database, `users/${employeeUid}/employee`);
      await set(employeeSelfRef, {
        ...employeeData,
        managedBy: user.id
      });

      // 5. Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        password: '',
        profileImage: '',
        joiningDate: undefined,
        salary: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        address: '',
        workMode: 'office',
        employmentType: 'full-time',
        bankAccountNumber: '',
        bankName: '',
        ifscCode: ''
      });

      // 6. Call success callback if provided
      if (onSuccess) {
        onSuccess(employeeUid);
      }

      setOpen(false);
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setError(err.message || 'Failed to create employee account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-gray-200">
                <AvatarImage src={formData.profileImage} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                  {formData.name ? (
                    formData.name.split(' ').map(n => n[0]).join('')
                  ) : (
                    <Camera className="w-8 h-8" />
                  )}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-upload"
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">Click to upload profile picture</p>
          </div>

          {/* Basic Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name *</label>
              <Input
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email *</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone *</label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password *</label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          {/* Job Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Department *</label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({...formData, department: value})}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Designation *</label>
              <Select
                value={formData.designation}
                onValueChange={(value) => setFormData({...formData, designation: value})}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((des) => (
                    <SelectItem key={des} value={des}>{des}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Joining Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.joiningDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.joiningDate ? (
                      format(formData.joiningDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComp
                    mode="single"
                    selected={formData.joiningDate}
                    onSelect={(date) => setFormData({...formData, joiningDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Salary (Monthly) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                  <DollarSign className="h-4 w-4" />
                </span>
                <Input
                  type="number"
                  placeholder="50000"
                  className="pl-8"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Work Mode</label>
              <Select
                value={formData.workMode}
                onValueChange={(value) => setFormData({...formData, workMode: value})}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work mode" />
                </SelectTrigger>
                <SelectContent>
                  {workModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Employment Type</label>
              <Select
                value={formData.employmentType}
                onValueChange={(value) => setFormData({...formData, employmentType: value})}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Emergency Contact Name *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                  <User className="h-4 w-4" />
                </span>
                <Input
                  placeholder="Emergency contact name"
                  className="pl-8"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Emergency Contact Number *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                  <Phone className="h-4 w-4" />
                </span>
                <Input
                  placeholder="Emergency contact number"
                  className="pl-8"
                  value={formData.emergencyContactNumber}
                  onChange={(e) => setFormData({...formData, emergencyContactNumber: e.target.value})}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <Input
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              disabled={loading}
            />
          </div>

          {/* Bank Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bank Name</label>
              <Input
                placeholder="Bank name"
                value={formData.bankName}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account Number</label>
              <Input
                placeholder="Bank account number"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">IFSC Code</label>
              <Input
                placeholder="IFSC code"
                value={formData.ifscCode}
                onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                !formData.name ||
                !formData.email ||
                !formData.password ||
                !formData.department ||
                !formData.designation ||
                !formData.joiningDate ||
                !formData.salary ||
                !formData.emergencyContactName ||
                !formData.emergencyContactNumber ||
                formData.password.length < 6
              }
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : 'Create Employee'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;