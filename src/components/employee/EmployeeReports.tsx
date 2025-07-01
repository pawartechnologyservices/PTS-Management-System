
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, User, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../hooks/useAuth';

const EmployeeReports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [reportData, setReportData] = useState({});

  useEffect(() => {
    generateReportData();
  }, [reportType, dateRange, user]);

  const generateReportData = () => {
    if (!user) return;

    const attendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const leaves = JSON.parse(localStorage.getItem('leave_requests') || '[]');
    const salarySlips = JSON.parse(localStorage.getItem('salary_slips') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');

    // Filter data for current user
    const userAttendance = attendance.filter((record: any) => record.employeeId === user.id);
    const userLeaves = leaves.filter((leave: any) => leave.employeeId === user.employeeId);
    const userSalarySlips = salarySlips.filter((slip: any) => slip.employeeId === user.employeeId);
    const userProjects = projects.filter((project: any) => 
      project.assignedTo === user.email || project.department === user.department
    );

    let data: any = {};

    switch (reportType) {
      case 'attendance':
        const presentDays = userAttendance.filter((record: any) => record.status === 'present').length;
        const absentDays = userAttendance.filter((record: any) => record.status === 'absent').length;
        const lateDays = userAttendance.filter((record: any) => record.status === 'late').length;
        
        data = {
          totalDays: userAttendance.length,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate: userAttendance.length > 0 ? Math.round((presentDays / userAttendance.length) * 100) : 0,
          records: userAttendance.slice(-10) // Last 10 records
        };
        break;
      
      case 'leaves':
        data = {
          totalRequests: userLeaves.length,
          approved: userLeaves.filter((leave: any) => leave.status === 'approved').length,
          pending: userLeaves.filter((leave: any) => leave.status === 'pending').length,
          rejected: userLeaves.filter((leave: any) => leave.status === 'rejected').length,
          totalDaysUsed: userLeaves
            .filter((leave: any) => leave.status === 'approved')
            .reduce((total: number, leave: any) => {
              const start = new Date(leave.startDate);
              const end = new Date(leave.endDate);
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              return total + days;
            }, 0),
          recentRequests: userLeaves.slice(-5)
        };
        break;
      
      case 'salary':
        const totalEarnings = userSalarySlips.reduce((sum: number, slip: any) => sum + slip.netSalary, 0);
        data = {
          totalSlips: userSalarySlips.length,
          totalEarnings,
          avgSalary: userSalarySlips.length > 0 ? totalEarnings / userSalarySlips.length : 0,
          highestSalary: userSalarySlips.length > 0 ? Math.max(...userSalarySlips.map((slip: any) => slip.netSalary)) : 0,
          recentSlips: userSalarySlips.slice(-6)
        };
        break;
      
      case 'projects':
        data = {
          totalProjects: userProjects.length,
          completed: userProjects.filter((project: any) => project.status === 'completed').length,
          inProgress: userProjects.filter((project: any) => project.status === 'in_progress').length,
          notStarted: userProjects.filter((project: any) => project.status === 'not_started').length,
          avgProgress: userProjects.length > 0 
            ? userProjects.reduce((sum: number, project: any) => sum + (project.progress || 0), 0) / userProjects.length 
            : 0,
          recentProjects: userProjects.slice(-5)
        };
        break;
    }

    setReportData(data);
  };

  const exportReport = () => {
    const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    const timestamp = new Date().toISOString().split('T')[0];
    
    let csvContent = `${reportTitle} - ${user?.name}\n`;
    csvContent += `Employee ID: ${user?.employeeId}\n`;
    csvContent += `Department: ${user?.department}\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    if (reportType === 'attendance') {
      csvContent += `Summary\n`;
      csvContent += `Total Days,${reportData.totalDays}\n`;
      csvContent += `Present Days,${reportData.presentDays}\n`;
      csvContent += `Absent Days,${reportData.absentDays}\n`;
      csvContent += `Late Days,${reportData.lateDays}\n`;
      csvContent += `Attendance Rate,${reportData.attendanceRate}%\n\n`;
      
      if (reportData.records && reportData.records.length > 0) {
        csvContent += `Recent Records\n`;
        csvContent += `Date,Status,Punch In,Punch Out\n`;
        reportData.records.forEach(record => {
          csvContent += `${new Date(record.date).toLocaleDateString()},${record.status},${record.punchIn || '-'},${record.punchOut || '-'}\n`;
        });
      }
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
          <h1 className="text-2xl font-bold text-gray-800">My Reports</h1>
          <p className="text-gray-600">Generate and export your personal reports</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">My Attendance</SelectItem>
                  <SelectItem value="leaves">My Leaves</SelectItem>
                  <SelectItem value="salary">My Salary</SelectItem>
                  <SelectItem value="projects">My Projects</SelectItem>
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
                  <SelectItem value="allTime">All Time</SelectItem>
                </SelectContent>
              </Select>
              
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
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportType === 'attendance' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{reportData.totalDays || 0}</p>
                    <p className="text-sm text-gray-600">Total Days</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{reportData.presentDays || 0}</p>
                    <p className="text-sm text-gray-600">Present Days</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">{reportData.absentDays || 0}</p>
                    <p className="text-sm text-gray-600">Absent Days</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">{reportData.attendanceRate || 0}%</p>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                  </div>
                </div>
                
                {reportData.records && reportData.records.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Attendance Records</h3>
                    <div className="space-y-2">
                      {reportData.records.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-500">{record.status}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p>In: {record.punchIn || '-'}</p>
                            <p>Out: {record.punchOut || '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {reportType === 'salary' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{reportData.totalSlips || 0}</p>
                  <p className="text-sm text-gray-600">Salary Slips</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalEarnings || 0)}</p>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(reportData.avgSalary || 0)}</p>
                  <p className="text-sm text-gray-600">Average Salary</p>
                </div>
              </div>
            )}

            {reportType === 'projects' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{reportData.totalProjects || 0}</p>
                  <p className="text-sm text-gray-600">Total Projects</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{reportData.completed || 0}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{reportData.inProgress || 0}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{Math.round(reportData.avgProgress || 0)}%</p>
                  <p className="text-sm text-gray-600">Avg Progress</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeReports;
