import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Eye, Edit, Trash2, Mail, Phone, User } from 'lucide-react';
import { ref, onValue, off, update, remove } from 'firebase/database';
import { database } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import { deleteUser, getAuth } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import EmployeeFilters from './EmployeeFilters';

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
  addedBy?: string;
}

interface EmployeeListProps {
  onViewEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  onViewEmployee,
  onEditEmployee
}) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch employees from Firebase
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const employeesRef = ref(database, `users/${user.id}/employees`);
    setLoading(true);

    const fetchEmployees = onValue(employeesRef, (snapshot) => {
      const employeesData: Employee[] = [];
      const deptSet = new Set<string>();
      
      snapshot.forEach((childSnapshot) => {
        const employee = childSnapshot.val();
        employeesData.push({
          id: childSnapshot.key || '',
          ...employee,
          isActive: employee.status === 'active',
          employeeId: employee.employeeId || `EMP-${childSnapshot.key?.slice(0, 8)}`
        });

        // Collect unique departments
        if (employee.department) {
          deptSet.add(employee.department);
        }
      });

      setEmployees(employeesData);
      setFilteredEmployees(employeesData);
      setDepartments(Array.from(deptSet));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
      setLoading(false);
    });

    return () => {
      off(employeesRef);
    };
  }, [user]);

  // Apply filters whenever search term, department or status changes
  useEffect(() => {
    let result = [...employees];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(employee => 
        employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply department filter
    if (filterDepartment !== 'all') {
      result = result.filter(employee => 
        employee.department === filterDepartment
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      const statusFilter = filterStatus === 'active';
      result = result.filter(employee => 
        employee.isActive === statusFilter
      );
    }

    setFilteredEmployees(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterDepartment, filterStatus, employees]);

  // Pagination logic
  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Toggle employee status
  const handleToggleStatus = async (employeeId: string) => {
    if (!user) return;
    
    try {
      const employeeRef = ref(database, `users/${user.id}/employees/${employeeId}`);
      const employeeSelfRef = ref(database, `users/${employeeId}/employee`);
      
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;

      const newStatus = employee.isActive ? 'inactive' : 'active';
      
      await update(employeeRef, { status: newStatus });
      await update(employeeSelfRef, { status: newStatus });

      toast({
        title: "Success",
        description: `Employee status updated to ${newStatus}`,
      });
    } catch (err) {
      console.error('Error updating employee status:', err);
      setError('Failed to update employee status');
      toast({
        title: "Error",
        description: "Failed to update employee status",
        variant: "destructive",
      });
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (employeeId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;

      // Delete from admin's employee list
      const employeeRef = ref(database, `users/${user.id}/employees/${employeeId}`);
      await remove(employeeRef);
      
      // Delete the employee's auth account
      const auth = getAuth();
      try {
        const employeeUser = await fetchUserByEmail(employee.email);
        if (employeeUser) {
          await deleteUser(employeeUser);
        }
      } catch (authError) {
        console.warn('Error deleting auth user (might not exist):', authError);
      }

      // Delete the employee's self-reference if it exists
      const employeeSelfRef = ref(database, `users/${employeeId}`);
      await remove(employeeSelfRef);
      
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Failed to delete employee');
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  // Helper function to fetch user by email
  const fetchUserByEmail = async (email: string) => {
    const auth = getAuth();
    try {
      const userMethods = await import('firebase/auth');
      const methods = await userMethods.fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        return auth.currentUser; // This might need adjustment based on your auth setup
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading employees...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Component */}
      <EmployeeFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        departments={departments}
      />

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Employees ({filteredEmployees.length})</span>
            </div>
            <Badge variant="outline">
              {filteredEmployees.filter(e => e.isActive).length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employees found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {currentEmployees.map((employee, index) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={employee.profileImage} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {employee.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{employee.name}</h3>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {employee.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {employee.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {employee.employeeId}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.designation} • {employee.department}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewEmployee(employee)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditEmployee(employee)}
                      className="hover:bg-green-50 hover:text-green-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(employee.id)}
                      className={`hover:bg-${employee.isActive ? 'yellow' : 'green'}-50 hover:text-${employee.isActive ? 'yellow' : 'green'}-600`}
                    >
                      {employee.isActive ? (
                        <span className="text-xs">Deactivate</span>
                      ) : (
                        <span className="text-xs">Activate</span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {indexOfFirstEmployee + 1} to {Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length} employees
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                          key={i + 1}
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeList;