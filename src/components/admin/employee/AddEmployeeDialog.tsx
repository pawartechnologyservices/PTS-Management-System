import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Plus, Upload, Camera } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import { format } from 'date-fns';
import { Textarea } from '../../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';

interface NewEmployee {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  password: string;
  profileImage: string;
  joiningDate: Date | undefined;
  address: string;
  gender: string;
  employeeId: string;
  employmentType: string;
  salary: string;
  isActive: boolean;
}

interface AddEmployeeDialogProps {
  departments: string[];
  designations: string[];
  onAddEmployee: (employee: NewEmployee) => boolean;
}

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  departments,
  designations,
  onAddEmployee
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    password: '',
    profileImage: '',
    joiningDate: undefined,
    address: '',
    gender: '',
    employeeId: `EMP${Math.floor(100000 + Math.random() * 900000)}`,
    employmentType: 'full-time',
    salary: '',
    isActive: true
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewEmployee(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEmployee = () => {
    const success = onAddEmployee(newEmployee);
    if (success) {
      setNewEmployee({
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        password: '',
        profileImage: '',
        joiningDate: undefined,
        address: '',
        gender: '',
        employeeId: `EMP${Math.floor(100000 + Math.random() * 900000)}`,
        employmentType: 'full-time',
        salary: '',
        isActive: true
      });
      setShowAddDialog(false);
    }
  };

  return (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={newEmployee.profileImage} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                  {newEmployee.name ? newEmployee.name.split(' ').map(n => n[0]).join('') : <Camera className="w-6 h-6" />}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="employee-profile-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors">
                <Upload className="w-3 h-3" />
              </label>
            </div>
            <input
              id="employee-profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-sm text-gray-600">Upload profile picture</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name*</label>
              <Input
                placeholder="Enter full name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email*</label>
              <Input
                type="email"
                placeholder="Enter email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Phone*</label>
              <Input
                placeholder="Enter phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password*</label>
              <Input
                type="password"
                placeholder="Enter password"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Department*</label>
              <Select 
                value={newEmployee.department} 
                onValueChange={(value) => setNewEmployee({...newEmployee, department: value})}
                required
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
            <div>
              <label className="text-sm font-medium">Designation*</label>
              <Select 
                value={newEmployee.designation} 
                onValueChange={(value) => setNewEmployee({...newEmployee, designation: value})}
                required
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Joining Date*</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {newEmployee.joiningDate ? format(newEmployee.joiningDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newEmployee.joiningDate}
                    onSelect={(date) => setNewEmployee({...newEmployee, joiningDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium">Employment Type*</label>
              <Select 
                value={newEmployee.employmentType} 
                onValueChange={(value) => setNewEmployee({...newEmployee, employmentType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Employee ID</label>
              <Input
                value={newEmployee.employeeId}
                readOnly
              />
            </div>
            <div>
              <label className="text-sm font-medium">Salary</label>
              <Input
                type="number"
                placeholder="Enter salary"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Gender</label>
            <RadioGroup 
              value={newEmployee.gender} 
              onValueChange={(value) => setNewEmployee({...newEmployee, gender: value})}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            <Textarea
              placeholder="Enter full address"
              value={newEmployee.address}
              onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700">
              Add Employee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;