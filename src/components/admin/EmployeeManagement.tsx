import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { ref, onValue, off, set, update, remove } from 'firebase/database';
import { getAuth, deleteUser, fetchSignInMethodsForEmail } from 'firebase/auth';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import AddEmployeeDialog from '../admin/employee/AddEmployeeDialog';
import EmployeeList from '../admin/employee/EmployeeList';
import EmployeeDetailsDialog from '../admin/employee/EmployeeDetailsDialog';

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
  status?: string;
  workMode?: string;
  employmentType?: string;
  salary?: string;
  joiningDate?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  address?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
}

const EmployeeManagement: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [designations, setDesignations] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const employeesRef = ref(database, `users/${user.id}/employees`);
    setLoading(true);

    const fetchEmployees = onValue(
      employeesRef,
      (snapshot) => {
        const employeesData: Employee[] = [];
        const deptSet = new Set<string>();
        const desigSet = new Set<string>();

        snapshot.forEach((childSnapshot) => {
          const employee = childSnapshot.val();
          employeesData.push({
            id: childSnapshot.key || '',
            ...employee,
            isActive: employee.status === 'active',
            employeeId:
              employee.employeeId ||
              `EMP-${childSnapshot.key?.slice(0, 8).toUpperCase()}`
          });

          if (employee.department) deptSet.add(employee.department);
          if (employee.designation) desigSet.add(employee.designation);
        });

        setEmployees(employeesData);
        setDepartments(Array.from(deptSet));
        setDesignations(Array.from(desigSet));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching employees:', error);
        setError('Failed to load employees');
        setLoading(false);
      }
    );

    return () => {
      off(employeesRef);
    };
  }, [user]);

  useEffect(() => {
    let result = [...employees];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (employee) =>
          employee.name?.toLowerCase().includes(term) ||
          employee.email?.toLowerCase().includes(term) ||
          employee.employeeId?.toLowerCase().includes(term) ||
          employee.phone?.includes(searchTerm)
      );
    }

    if (filterDepartment !== 'all') {
      result = result.filter((employee) => employee.department === filterDepartment);
    }

    if (filterStatus !== 'all') {
      const statusFilter = filterStatus === 'active';
      result = result.filter((employee) => employee.isActive === statusFilter);
    }

    setFilteredEmployees(result);
    setCurrentPage(1);
  }, [employees, searchTerm, filterDepartment, filterStatus]);

  const handleEditEmployee = useCallback((employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsAddDialogOpen(true);
  }, []);

  const handleAddEmployee = useCallback(
    async (newEmployee: Omit<Employee, 'id'>, employeeId: string) => {
      if (!user) return false;

      try {
        const employeeRef = ref(database, `users/${user.id}/employees/${employeeId}`);
        await set(employeeRef, {
          ...newEmployee,
          status: 'active',
          createdAt: new Date().toISOString(),
          addedBy: user.id
        });

        const employeeSelfRef = ref(database, `users/${employeeId}/employee`);
        await set(employeeSelfRef, {
          ...newEmployee,
          managedBy: user.id,
          status: 'active'
        });

        toast.success('Employee added successfully');
        return true;
      } catch (error) {
        console.error('Error adding employee:', error);
        toast.error('Failed to add employee');
        return false;
      }
    },
    [user]
  );

  const handleUpdateEmployee = useCallback(
    async (updatedEmployee: Employee) => {
      if (!user) return false;

      try {
        const { id, ...employeeData } = updatedEmployee;
        const employeeRef = ref(database, `users/${user.id}/employees/${id}`);

        await update(employeeRef, {
          ...employeeData,
          updatedAt: new Date().toISOString()
        });

        const employeeSelfRef = ref(database, `users/${id}/employee`);
        await update(employeeSelfRef, employeeData);

        toast.success('Employee updated successfully');
        return true;
      } catch (error) {
        console.error('Error updating employee:', error);
        toast.error('Failed to update employee');
        return false;
      }
    },
    [user]
  );

  const handleToggleStatus = useCallback(
    async (employeeId: string) => {
      if (!user) return;

      setIsProcessing(`status-${employeeId}`);
      try {
        const employee = employees.find((e) => e.id === employeeId);
        if (!employee) return;

        const newStatus = employee.isActive ? 'inactive' : 'active';

        const employeeRef = ref(database, `users/${user.id}/employees/${employeeId}`);
        await update(employeeRef, { status: newStatus });

        const employeeSelfRef = ref(database, `users/${employeeId}/employee`);
        await update(employeeSelfRef, { status: newStatus });

        toast.success(`Employee ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      } catch (error) {
        console.error('Error toggling employee status:', error);
        toast.error('Failed to update employee status');
      } finally {
        setIsProcessing(null);
      }
    },
    [user, employees]
  );

  const handleDeleteEmployee = useCallback(
    async (employeeId: string) => {
      if (!user || !window.confirm('Are you sure you want to delete this employee?')) {
        return;
      }

      setIsProcessing(`delete-${employeeId}`);
      try {
        const employee = employees.find((e) => e.id === employeeId);
        if (!employee) return;

        const employeeRef = ref(database, `users/${user.id}/employees/${employeeId}`);
        await remove(employeeRef);

        try {
          const authInstance = getAuth();
          const methods = await fetchSignInMethodsForEmail(authInstance, employee.email);
          if (methods.length > 0) {
            const userToDelete = authInstance.currentUser;
            if (userToDelete?.email === employee.email) {
              await deleteUser(userToDelete);
            }
          }
        } catch (authError) {
          console.warn('Error deleting auth user:', authError);
        }

        const employeeSelfRef = ref(database, `users/${employeeId}`);
        await remove(employeeSelfRef);

        toast.success('Employee deleted successfully');
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      } finally {
        setIsProcessing(null);
      }
    },
    [user, employees]
  );

  const exportData = useCallback(() => {
    try {
      const dataToExport = filteredEmployees.map((emp) => ({
        Name: emp.name,
        Email: emp.email,
        Phone: emp.phone,
        EmployeeID: emp.employeeId,
        Department: emp.department,
        Designation: emp.designation,
        Status: emp.isActive ? 'Active' : 'Inactive',
        'Join Date': new Date(emp.createdAt).toLocaleDateString()
      }));

      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map((row) =>
          headers
            .map((fieldName) => `"${String(row[fieldName as keyof typeof row]).replace(/"/g, '""')}"`)
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export employee data');
    }
  }, [filteredEmployees]);

  if (loading) {
    return (
      <Card className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading employee data...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
        <div className="flex gap-3">
          <Button onClick={exportData} variant="outline" className="hover:bg-green-100 text-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => {
              setEmployeeToEdit(null);
              setIsAddDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or ID..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <EmployeeList
        employees={filteredEmployees.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        )}
        onViewEmployee={setSelectedEmployee}
        onEditEmployee={handleEditEmployee}
        onToggleStatus={handleToggleStatus}
        onDeleteEmployee={handleDeleteEmployee}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredEmployees.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        isProcessing={isProcessing}
      />

      <AddEmployeeDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEmployeeToEdit(null);
        }}
        employeeToEdit={employeeToEdit}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          setEmployeeToEdit(null);
        }}
        onAddEmployee={handleAddEmployee}
        onUpdateEmployee={handleUpdateEmployee}
      />

      <EmployeeDetailsDialog
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
};

export default EmployeeManagement;