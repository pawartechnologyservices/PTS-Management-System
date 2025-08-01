import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Upload, User, Phone, Calendar, DollarSign } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComp } from '../../ui/calendar';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/useAuth';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

interface EmployeeFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  password?: string;
  profileImage: string;
  joiningDate?: Date;
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeToEdit?: EmployeeFormData | null;
  onSuccess: () => void;
  onAddEmployee: (employee: Omit<EmployeeFormData, 'id'>, employeeId: string) => Promise<boolean>;
  onUpdateEmployee: (employee: EmployeeFormData) => Promise<boolean>;
}

const departments = [
  'Software Development',
  'Web Development',
  'Graphic Design',
  'Product Design',
  'Digital Marketing',
  'Sales',
  'Artificial Intelligence',
  'Cyber Security'
];

const designations = [
  'Software Developer',
  'Web Developer',
  'Project Manager',
  'Software Manager',
  'Web Development Manager',
  'Software Team Leader',
  'Web Team Leader',
  'Sales Executive',
  'Digital Marketing Team Leader',
  'Digital Marketing Executive',
  'Web Developer Intern',
  'Web Developer Trainee',
  'Cyber Security Intern',
  'Software Developer Intern',
  'Artificial Intelligence Intern',
  'DevOps Developer Intern',
  'IT Project Manager',
  'Sales Manager',
  'UI/UX Designer',
  'Backend Developer',
  'Frontend Developer',
  'QA Engineer',
  'Business Analyst',
  'Product Manager',
  'HR Executive'
];

const workModes = ['office', 'remote', 'hybrid'];
const employmentTypes = ['full-time', 'part-time', 'contract', 'internship'];

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onOpenChange,
  employeeToEdit,
  onSuccess,
  onAddEmployee,
  onUpdateEmployee
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EmployeeFormData>({
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

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        ...employeeToEdit,
        joiningDate: employeeToEdit.joiningDate ? new Date(employeeToEdit.joiningDate) : undefined,
        password: ''
      });
    } else {
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
    }
  }, [employeeToEdit, open]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, joiningDate: date }));
  };

  const validateForm = (): boolean => {
    if (!user || user.role !== 'admin') {
      setError('Only admins can manage employees');
      return false;
    }

    const requiredFields = [
      'name', 'email', 'phone', 'department', 'designation', 'joiningDate',
      'salary', 'emergencyContactName', 'emergencyContactNumber'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof EmployeeFormData];
      return value === '' || value === undefined || (field === 'joiningDate' && !formData.joiningDate);
    });

    if (!employeeToEdit && !formData.password) {
      missingFields.push('password');
    }

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    if (!employeeToEdit && formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.phone.length < 10 || formData.emergencyContactNumber.length < 10) {
      setError('Phone numbers must be at least 10 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      let success = false;
      if (employeeToEdit && employeeToEdit.id) {
        success = await onUpdateEmployee({
          ...formData,
          id: employeeToEdit.id
        });
      } else {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password!
        );
        const employeeId = userCredential.user.uid;

        const { id, ...employeeData } = formData;
        success = await onAddEmployee(employeeData, employeeId);
      }

      if (success) {
        toast.success(`Employee ${employeeToEdit ? 'updated' : 'added'} successfully`);
        onOpenChange(false);
        onSuccess();
      } else {
        setError('Failed to process employee');
      }
    } catch (err: any) {
      console.error('Error managing employee:', err);
      setError(err.message || 'Failed to process employee');
      toast.error(err.message || 'Failed to process employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{employeeToEdit ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </h3>
            
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={formData.profileImage} />
                <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <label className="text-sm font-medium leading-none cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
              </div>
            </div>

            <Input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!!employeeToEdit}
            />

            {!employeeToEdit && (
              <Input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            )}

            <Input
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <div className="flex gap-4">
              <Select
                value={formData.department}
                onValueChange={(value) => handleSelectChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={formData.designation}
                onValueChange={(value) => handleSelectChange('designation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map(designation => (
                    <SelectItem key={designation} value={designation}>{designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                    <span>Joining Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComp
                  mode="single"
                  selected={formData.joiningDate}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Input
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Employment Details
            </h3>

            <Input
              name="salary"
              placeholder="Salary"
              value={formData.salary}
              onChange={handleChange}
              required
            />

            <div className="flex gap-4">
              <Select
                value={formData.workMode}
                onValueChange={(value) => handleSelectChange('workMode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Work Mode" />
                </SelectTrigger>
                <SelectContent>
                  {workModes.map(mode => (
                    <SelectItem key={mode} value={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={formData.employmentType}
                onValueChange={(value) => handleSelectChange('employmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Employment Type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <h3 className="font-medium flex items-center gap-2 mt-6">
              <Phone className="w-4 h-4" /> Emergency Contact
            </h3>

            <Input
              name="emergencyContactName"
              placeholder="Emergency Contact Name"
              value={formData.emergencyContactName}
              onChange={handleChange}
              required
            />

            <Input
              name="emergencyContactNumber"
              placeholder="Emergency Contact Number"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
              required
            />

            <h3 className="font-medium flex items-center gap-2 mt-6">
              Bank Details
            </h3>

            <Input
              name="bankAccountNumber"
              placeholder="Bank Account Number"
              value={formData.bankAccountNumber}
              onChange={handleChange}
            />

            <Input
              name="bankName"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={handleChange}
            />

            <Input
              name="ifscCode"
              placeholder="IFSC Code"
              value={formData.ifscCode}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : employeeToEdit ? 'Update Employee' : 'Add Employee'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;