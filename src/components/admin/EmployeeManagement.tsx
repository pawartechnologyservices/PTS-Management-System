
import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { useEmployeeManagement } from '../../hooks/useEmployeeManagement';
import AddEmployeeDialog from './employee/AddEmployeeDialog';
import EmployeeFilters from './employee/EmployeeFilters';
import EmployeeList from './employee/EmployeeList';
import EmployeeDetailsDialog from './employee/EmployeeDetailsDialog';

const EmployeeManagement = () => {
  const {
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
  } = useEmployeeManagement();

  const itemsPerPage = 10;
  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage your organization's workforce</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={exportData}
            variant="outline"
            className="hover:bg-green-50 hover:text-green-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <AddEmployeeDialog
            departments={departments}
            designations={designations}
            onAddEmployee={addEmployee}
          />
        </div>
      </motion.div>

<<<<<<< HEAD
=======
      {/* Filters */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <EmployeeFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterDepartment={filterDepartment}
          setFilterDepartment={setFilterDepartment}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          departments={departments}
        />
      </motion.div> */}

>>>>>>> dc553ae1e5c7ca72affa8a180c014fe0da7f519e
      {/* Employee List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <EmployeeList
          currentEmployees={currentEmployees}
          filteredEmployees={filteredEmployees}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onViewEmployee={setSelectedEmployee}
          onToggleStatus={toggleEmployeeStatus}
          onDeleteEmployee={deleteEmployee}
        />
      </motion.div>

      {/* Employee Details Dialog */}
      <EmployeeDetailsDialog
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
};

export default EmployeeManagement;
