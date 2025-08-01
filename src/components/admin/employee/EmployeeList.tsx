// EmployeeList.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onViewEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onToggleStatus: (employeeId: string) => void;
  onDeleteEmployee: (employeeId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isProcessing: string | null;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onViewEmployee,
  onEditEmployee,
  onToggleStatus,
  onDeleteEmployee,
  currentPage,
  totalPages,
  onPageChange,
  isProcessing
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {employees.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No employees found matching your criteria</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {employees.map((employee) => (
            <Card key={employee.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <div className="w-6 h-6 text-blue-600 font-medium flex items-center justify-center">
                      {employee.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{employee.name}</h3>
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      {employee.designation} - {employee.department}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <span>{employee.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Phone:</span>
                        <span>{employee.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">ID:</span>
                        <span>{employee.employeeId}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewEmployee(employee)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditEmployee(employee)}
                    className="hover:bg-green-50 hover:text-green-600"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus(employee.id)}
                    className={`hover:bg-${employee.isActive ? 'yellow' : 'green'}-50 hover:text-${employee.isActive ? 'yellow' : 'green'}-600`}
                    disabled={isProcessing === `status-${employee.id}`}
                    title={employee.isActive ? "Deactivate" : "Activate"}
                  >
                    {isProcessing === `status-${employee.id}` ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : employee.isActive ? (
                      <span className="text-xs">Deact</span>
                    ) : (
                      <span className="text-xs">Activ</span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteEmployee(employee.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                    disabled={isProcessing === `delete-${employee.id}`}
                    title="Delete"
                  >
                    {isProcessing === `delete-${employee.id}` ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default EmployeeList;