
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

const ReportsManagement = () => {
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>({});

  useEffect(() => {
    generateReportData();
  }, [reportType, dateRange, startDate, endDate]);

  const generateReportData = () => {
    const employees = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const attendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const leaves = JSON.parse(localStorage.getItem('leave_requests') || '[]');
    const salarySlips = JSON.parse(localStorage.getItem('salary_slips') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');

    let data: any = {};

    switch (reportType) {
      case 'attendance':
        data = {
          totalEmployees: employees.filter((emp: any) => emp.role === 'employee').length,
          totalPresentDays: attendance.filter((record: any) => record.status === 'present').length,
          totalAbsentDays: attendance.filter((record: any) => record.status === 'absent').length,
          averageAttendance: '85%',
          departmentWise: getDepartmentWiseAttendance(attendance, employees)
        };
        break;
      
      case 'leaves':
        data = {
          totalRequests: leaves.length,
          approved: leaves.filter((leave: any) => leave.status === 'approved').length,
          pending: leaves.filter((leave: any) => leave.status === 'pending').length,
          rejected: leaves.filter((leave: any) => leave.status === 'rejected').length,
          departmentWise: getDepartmentWiseLeaves(leaves, employees)
        };
        break;
      
      case 'salary':
        data = {
          totalSlipsGenerated: salarySlips.length,
          totalAmount: salarySlips.reduce((sum: number, slip: any) => sum + slip.netSalary, 0),
          averageSalary: salarySlips.length > 0 ? salarySlips.reduce((sum: number, slip: any) => sum + slip.netSalary, 0) / salarySlips.length : 0,
          departmentWise: getDepartmentWiseSalary(salarySlips, employees)
        };
        break;
      
      case 'projects':
        data = {
          totalProjects: projects.length,
          completed: projects.filter((project: any) => project.status === 'completed').length,
          inProgress: projects.filter((project: any) => project.status === 'in_progress').length,
          notStarted: projects.filter((project: any) => project.status === 'not_started').length,
          departmentWise: getDepartmentWiseProjects(projects)
        };
        break;
    }

    setReportData(data);
  };

  const getDepartmentWiseAttendance = (attendance, employees) => {
    const departments = ['Software', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing'];
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      const deptAttendance = attendance.filter(record => 
        deptEmployees.some(emp => emp.employeeId === record.employeeId)
      );
      return {
        department: dept,
        present: deptAttendance.filter(record => record.status === 'present').length,
        total: deptAttendance.length
      };
    });
  };

  const getDepartmentWiseLeaves = (leaves, employees) => {
    const departments = ['Software', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing'];
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      const deptLeaves = leaves.filter(leave => 
        deptEmployees.some(emp => emp.employeeId === leave.employeeId)
      );
      return {
        department: dept,
        total: deptLeaves.length,
        approved: deptLeaves.filter(leave => leave.status === 'approved').length
      };
    });
  };

  const getDepartmentWiseSalary = (salarySlips, employees) => {
    const departments = ['Software', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing'];
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      const deptSalarySlips = salarySlips.filter(slip => 
        deptEmployees.some(emp => emp.employeeId === slip.employeeId)
      );
      return {
        department: dept,
        totalAmount: deptSalarySlips.reduce((sum, slip) => sum + slip.netSalary, 0),
        count: deptSalarySlips.length
      };
    });
  };

  const getDepartmentWiseProjects = (projects) => {
    const departments = ['Software', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing'];
    return departments.map(dept => {
      const deptProjects = projects.filter(project => project.department === dept);
      return {
        department: dept,
        total: deptProjects.length,
        completed: deptProjects.filter(project => project.status === 'completed').length
      };
    });
  };

  const exportReport = () => {
    const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    const timestamp = new Date().toISOString().split('T')[0];
    
    let csvContent = `${reportTitle}\nGenerated on: ${new Date().toLocaleDateString()}\n\n`;
    
    if (reportType === 'attendance') {
      csvContent += `Summary\n`;
      csvContent += `Total Employees,${reportData.totalEmployees}\n`;
      csvContent += `Present Days,${reportData.totalPresentDays}\n`;
      csvContent += `Absent Days,${reportData.totalAbsentDays}\n`;
      csvContent += `Average Attendance,${reportData.averageAttendance}\n\n`;
      csvContent += `Department Wise\n`;
      csvContent += `Department,Present,Total\n`;
      reportData.departmentWise?.forEach(dept => {
        csvContent += `${dept.department},${dept.present},${dept.total}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports Management</h1>
          <p className="text-gray-600">Generate and export various reports</p>
        </div>
      </motion.div>

      {/* Report Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="leaves">Leave Report</SelectItem>
                  <SelectItem value="salary">Salary Report</SelectItem>
                  <SelectItem value="projects">Project Report</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              {dateRange === 'custom' && (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </>
              )}
              
              <Button onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportType === 'attendance' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{reportData.totalEmployees}</p>
                  <p className="text-sm text-gray-600">Total Employees</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{reportData.totalPresentDays}</p>
                  <p className="text-sm text-gray-600">Present Days</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{reportData.totalAbsentDays}</p>
                  <p className="text-sm text-gray-600">Absent Days</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{reportData.averageAttendance}</p>
                  <p className="text-sm text-gray-600">Avg Attendance</p>
                </div>
              </div>
            )}

            {reportType === 'salary' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{reportData.totalSlipsGenerated}</p>
                  <p className="text-sm text-gray-600">Slips Generated</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalAmount || 0)}</p>
                  <p className="text-sm text-gray-600">Total Amount</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(reportData.averageSalary || 0)}</p>
                  <p className="text-sm text-gray-600">Average Salary</p>
                </div>
              </div>
            )}

            {/* Department Wise Data */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Department Wise Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-3 text-left">Department</th>
                      {reportType === 'attendance' && (
                        <>
                          <th className="border border-gray-200 p-3 text-left">Present</th>
                          <th className="border border-gray-200 p-3 text-left">Total</th>
                          <th className="border border-gray-200 p-3 text-left">Percentage</th>
                        </>
                      )}
                      {reportType === 'salary' && (
                        <>
                          <th className="border border-gray-200 p-3 text-left">Total Amount</th>
                          <th className="border border-gray-200 p-3 text-left">Employees</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.departmentWise?.map((dept, index) => (
                      <tr key={index}>
                        <td className="border border-gray-200 p-3">{dept.department}</td>
                        {reportType === 'attendance' && (
                          <>
                            <td className="border border-gray-200 p-3">{dept.present}</td>
                            <td className="border border-gray-200 p-3">{dept.total}</td>
                            <td className="border border-gray-200 p-3">
                              {dept.total > 0 ? Math.round((dept.present / dept.total) * 100) : 0}%
                            </td>
                          </>
                        )}
                        {reportType === 'salary' && (
                          <>
                            <td className="border border-gray-200 p-3">{formatCurrency(dept.totalAmount)}</td>
                            <td className="border border-gray-200 p-3">{dept.count}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportsManagement;
