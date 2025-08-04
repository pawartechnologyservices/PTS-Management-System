import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Eye, Edit, Trash2, Mail, Phone, User, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [itemsPerPage, setItemsPerPage] = useState(() => 
    window.innerWidth < 768 ? 5 : 10
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  // Handle window resize for responsive items per page
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 5 : 10);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <Card className="mx-2 sm:mx-0">
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
      <Card className="mx-2 sm:mx-0">
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
    <div className="space-y-4 mx-2 sm:mx-0">
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
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <span>Employees ({filteredEmployees.length})</span>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-4 sm:gap-0"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarImage src={employee.profileImage} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs sm:text-sm">
                        {employee.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="font-semibold truncate">{employee.name}</h3>
                        <Badge 
                          variant={employee.isActive ? "default" : "secondary"}
                          className="w-fit"
                        >
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{employee.email}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{employee.phone}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{employee.employeeId}</span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {employee.designation} • {employee.department}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end sm:justify-normal gap-1 sm:gap-2 w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewEmployee(employee)}
                      className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 sm:h-10 sm:w-10"
                      aria-label="View employee"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditEmployee(employee)}
                      className="hover:bg-green-50 hover:text-green-600 h-8 w-8 sm:h-10 sm:w-10"
                      aria-label="Edit employee"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(employee.id)}
                      className={`h-8 px-2 sm:h-10 sm:px-4 ${
                        employee.isActive 
                          ? 'hover:bg-yellow-50 hover:text-yellow-600' 
                          : 'hover:bg-green-50 hover:text-green-600'
                      }`}
                      aria-label={employee.isActive ? "Deactivate employee" : "Activate employee"}
                    >
                      <span className="text-xs sm:text-sm">
                        {employee.isActive ? 'Deactivate' : 'Activate'}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="hover:bg-red-50 hover:text-red-600 h-8 w-8 sm:h-10 sm:w-10"
                      aria-label="Delete employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                  <p className="text-sm text-gray-600 text-center sm:text-left">
                    Showing {indexOfFirstEmployee + 1} to {Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length} employees
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-4"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-2">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // Show first, last and nearby pages for mobile
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-4"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && (
                        <span className="px-2 text-sm text-gray-500 hidden sm:inline">
                          ...
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-4"
                    >
                      <span className="sr-only sm:not-sr-only sm:mr-2">Next</span>
                      <ChevronRight className="w-4 h-4" />
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