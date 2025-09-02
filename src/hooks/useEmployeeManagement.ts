
import { useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { useToast } from './use-toast';

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
}

interface NewEmployee {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  password: string;
  profileImage: string;
}

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const departments = [
    'Software Development',
    'Digital Marketing',
    'Cyber Security',
    'Sales',
    'Product Designing',
    'Web Development',
    'Graphic Designing', 
    'Artificial Intelligence'
  ];

  const designations = [
    'Junior Developer',
    'Senior Developer',
    'Team Lead',
    'Marketing Executive',
    'Sales Executive',
    'Designer',
    'Manager'
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, filterDepartment, filterStatus]);

  const loadEmployees = () => {
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const employeeUsers = users.filter((user: any) => user.role === 'employee');
    setEmployees(employeeUsers);
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm?.toLowerCase())
      );
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === filterDepartment);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => 
        filterStatus === 'active' ? emp.isActive : !emp.isActive
      );
    }

    setFilteredEmployees(filtered);
  };

  const addEmployee = (newEmployee: NewEmployee) => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.phone || 
        !newEmployee.department || !newEmployee.designation || !newEmployee.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return false;
    }

    const empId = `EMP${Date.now().toString().slice(-6)}`;
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    
    const employee = {
      id: Date.now().toString(),
      name: newEmployee.name,
      email: newEmployee.email,
      phone: newEmployee.phone,
      department: newEmployee.department,
      designation: newEmployee.designation,
      employeeId: empId,
      role: 'employee',
      isActive: true,
      createdAt: new Date().toISOString(),
      hashedPassword: bcrypt.hashSync(newEmployee.password, 10),
      profileImage: newEmployee.profileImage,
      isFirstTimeLogin: true
    };

    users.push(employee);
    localStorage.setItem('hrms_users', JSON.stringify(users));
    loadEmployees();
    
    toast({
      title: "Success",
      description: `Employee added successfully. ID: ${empId}`,
    });

    return true;
  };

  const toggleEmployeeStatus = (employeeId: string) => {
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const updatedUsers = users.map((user: any) => {
      if (user.id === employeeId) {
        return { ...user, isActive: !user.isActive };
      }
      return user;
    });
    
    localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
    loadEmployees();
    
    toast({
      title: "Success",
      description: "Employee status updated successfully",
    });
  };

  const deleteEmployee = (employeeId: string) => {
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const updatedUsers = users.filter((user: any) => user.id !== employeeId);
    
    localStorage.setItem('hrms_users', JSON.stringify(updatedUsers));
    loadEmployees();
    
    toast({
      title: "Success",
      description: "Employee deleted successfully",
    });
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Department', 'Designation', 'Employee ID', 'Status'],
      ...filteredEmployees.map(emp => [
        emp.name,
        emp.email,
        emp.phone,
        emp.department,
        emp.designation,
        emp.employeeId,
        emp.isActive ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    
    toast({
      title: "Success",
      description: "Employee data exported successfully",
    });
  };

  return {
    employees,
    filteredEmployees,
    searchTerm,
    setSearchTerm,
    filterDepartment,
    setFilterDepartment,
    filterStatus,
    setFilterStatus,
    selectedEmployee,
    setSelectedEmployee,
    currentPage,
    setCurrentPage,
    departments,
    designations,
    addEmployee,
    toggleEmployeeStatus,
    deleteEmployee,
    exportData
  };
};
