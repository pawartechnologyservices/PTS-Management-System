import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Users, TrendingUp, BarChart3, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../firebase';
import { ref, query, orderByChild, get, orderByKey } from 'firebase/database';
import { toast } from '../ui/use-toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  status: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  status: string;
  workMode: string;
  timestamp: number;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
}

const ReportsManagement = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<'attendance' | 'leaves'>('attendance');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState({
    employees: false,
    attendance: false,
    leaves: false
  });

  // Fetch employees data
  useEffect(() => {
    if (!user?.id) return;

    const fetchEmployees = async () => {
      try {
        const employeesRef = ref(database, `users/${user.id}/employees`);
        const snapshot = await get(employeesRef);
        
        if (snapshot.exists()) {
          const employeesData = snapshot.val();
          const employeesList: Employee[] = Object.entries(employeesData).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Employee, 'id'>)
          }));
          setEmployees(employeesList);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employee data',
          variant: 'destructive'
        });
      } finally {
        setDataLoaded(prev => ({ ...prev, employees: true }));
      }
    };

    fetchEmployees();
  }, [user]);

  // Fetch attendance data with fallback to key-based ordering if timestamp index fails
  useEffect(() => {
    if (!user?.id || employees.length === 0 || reportType !== 'attendance') return;

    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const allRecords: AttendanceRecord[] = [];
        
        for (const employee of employees) {
          const attendanceRef = ref(database, `users/${user.id}/employees/${employee.id}/punching`);
          let attendanceQuery;
          
          try {
            // First try with timestamp ordering
            attendanceQuery = query(attendanceRef, orderByChild('timestamp'));
            const snapshot = await get(attendanceQuery);
            
            if (snapshot.exists()) {
              const data = snapshot.val();
              const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
                id: key,
                employeeId: employee.id,
                employeeName: employee.name,
                ...(value as Omit<AttendanceRecord, 'id' | 'employeeId' | 'employeeName'>)
              }));
              allRecords.push(...records);
            }
          } catch (error) {
            console.warn('Timestamp index not available, falling back to key ordering:', error);
            // Fallback to key-based ordering if timestamp index fails
            const snapshot = await get(query(attendanceRef, orderByKey()));
            if (snapshot.exists()) {
              const data = snapshot.val();
              const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
                id: key,
                employeeId: employee.id,
                employeeName: employee.name,
                ...(value as Omit<AttendanceRecord, 'id' | 'employeeId' | 'employeeName'>)
              }));
              // Sort by timestamp manually if available
              if (records[0]?.timestamp) {
                records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              }
              allRecords.push(...records);
            }
          }
        }
        
        setAttendanceRecords(allRecords);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance data',
          variant: 'destructive'
        });
      } finally {
        setDataLoaded(prev => ({ ...prev, attendance: true }));
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [user, employees, reportType]);

  // Fetch leave data with fallback to key-based ordering if appliedAt index fails
  useEffect(() => {
    if (!user?.id || employees.length === 0 || reportType !== 'leaves') return;

    const fetchLeaveData = async () => {
      setLoading(true);
      try {
        const allRequests: LeaveRequest[] = [];
        
        for (const employee of employees) {
          const leavesRef = ref(database, `users/${user.id}/employees/${employee.id}/leaves`);
          let leavesQuery;
          
          try {
            // First try with appliedAt ordering
            leavesQuery = query(leavesRef, orderByChild('appliedAt'));
            const snapshot = await get(leavesQuery);
            
            if (snapshot.exists()) {
              const data = snapshot.val();
              const requests: LeaveRequest[] = Object.entries(data).map(([key, value]) => ({
                id: key,
                employeeId: employee.id,
                employeeName: employee.name,
                department: employee.department || 'No Department',
                ...(value as Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'department'>)
              }));
              allRequests.push(...requests);
            }
          } catch (error) {
            console.warn('appliedAt index not available, falling back to key ordering:', error);
            // Fallback to key-based ordering if appliedAt index fails
            const snapshot = await get(query(leavesRef, orderByKey()));
            if (snapshot.exists()) {
              const data = snapshot.val();
              const requests: LeaveRequest[] = Object.entries(data).map(([key, value]) => ({
                id: key,
                employeeId: employee.id,
                employeeName: employee.name,
                department: employee.department || 'No Department',
                ...(value as Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'department'>)
              }));
              // Sort by appliedAt manually if available
              if (requests[0]?.appliedAt) {
                requests.sort((a, b) => 
                  new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
                );
              }
              allRequests.push(...requests);
            }
          }
        }
        
        setLeaveRequests(allRequests);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load leave data',
          variant: 'destructive'
        });
      } finally {
        setDataLoaded(prev => ({ ...prev, leaves: true }));
        setLoading(false);
      }
    };

    fetchLeaveData();
  }, [user, employees, reportType]);

  // Get filtered data based on date range
  const getFilteredData = () => {
    let filteredAttendance: AttendanceRecord[] = [];
    let filteredLeaves: LeaveRequest[] = [];
    
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    // Set date range based on selection
    switch (dateRange) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          startDate = new Date(0);
          endDate = new Date();
        } else {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        }
        break;
      default:
        startDate = new Date(0);
        endDate = new Date();
    }
    
    // Filter attendance records
    if (reportType === 'attendance' && dataLoaded.attendance) {
      filteredAttendance = attendanceRecords.filter(record => {
        try {
          const recordDate = new Date(record.date);
          return recordDate >= startDate && recordDate <= endDate;
        } catch {
          return false;
        }
      });
    }
    
    // Filter leave requests
    if (reportType === 'leaves' && dataLoaded.leaves) {
      filteredLeaves = leaveRequests.filter(request => {
        try {
          const appliedDate = new Date(request.appliedAt);
          return appliedDate >= startDate && appliedDate <= endDate;
        } catch {
          return false;
        }
      });
    }
    
    return { filteredAttendance, filteredLeaves };
  };

  const { filteredAttendance, filteredLeaves } = getFilteredData();

  // Calculate duration between two dates
  const calculateDays = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 0;
    }
  };

  // Get department-wise data for the report
  const getDepartmentWiseData = () => {
    const departments = Array.from(
      new Set(employees.map(emp => emp.department || 'No Department'))
    );
    
    if (reportType === 'attendance') {
      return departments.map(dept => {
        const deptEmployees = employees.filter(emp => emp.department === dept);
        const deptRecords = filteredAttendance.filter(record => 
          deptEmployees.some(emp => emp.id === record.employeeId)
        );
        
        return {
          department: dept,
          present: deptRecords.filter(record => record.status === 'present').length,
          absent: deptRecords.filter(record => record.status === 'absent').length,
          late: deptRecords.filter(record => record.status === 'late').length,
          total: deptRecords.length,
          percentage: deptRecords.length > 0 
            ? Math.round(
                (deptRecords.filter(record => record.status === 'present').length / 
                deptRecords.length * 100
              ))
            : 0
        };
      });
    } else {
      return departments.map(dept => {
        const deptEmployees = employees.filter(emp => emp.department === dept);
        const deptLeaves = filteredLeaves.filter(leave => 
          deptEmployees.some(emp => emp.id === leave.employeeId)
        );
        
        return {
          department: dept,
          approved: deptLeaves.filter(leave => leave.status === 'approved').length,
          pending: deptLeaves.filter(leave => leave.status === 'pending').length,
          rejected: deptLeaves.filter(leave => leave.status === 'rejected').length,
          total: deptLeaves.length
        };
      });
    }
  };

  const departmentData = getDepartmentWiseData();

  // Export report to CSV
  const exportReport = () => {
    let csvContent = '';
    const timestamp = new Date().toISOString().split('T')[0];
    const currentDate = new Date().toLocaleDateString();
    
    if (reportType === 'attendance') {
      csvContent = [
        [`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - Generated on ${currentDate}`],
        [''],
        ['Employee Name', 'Employee ID', 'Date', 'Punch In', 'Punch Out', 'Status', 'Work Mode'],
        ...filteredAttendance.map(record => [
          `"${record.employeeName}"`,
          record.employeeId,
          new Date(record.date).toLocaleDateString(),
          record.punchIn || '-',
          record.punchOut || '-',
          record.status,
          record.workMode || 'office'
        ])
      ].map(row => row.join(',')).join('\n');
    } else {
      csvContent = [
        [`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - Generated on ${currentDate}`],
        [''],
        ['Employee Name', 'Employee ID', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Status', 'Reason', 'Applied At'],
        ...filteredLeaves.map(request => [
          `"${request.employeeName}"`,
          request.employeeId,
          request.department,
          request.leaveType,
          new Date(request.startDate).toLocaleDateString(),
          new Date(request.endDate).toLocaleDateString(),
          `${calculateDays(request.startDate, request.endDate)} days`,
          request.status,
          `"${request.reason}"`,
          new Date(request.appliedAt).toLocaleString()
        ])
      ].map(row => row.join(',')).join('\n');
    }
    
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Report Exported',
        description: `The ${reportType} report has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export the report',
        variant: 'destructive'
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (loading || !dataLoaded.employees || 
      (reportType === 'attendance' && !dataLoaded.attendance) || 
      (reportType === 'leaves' && !dataLoaded.leaves)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="text-gray-600">Loading report data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports Management</h1>
          <p className="text-gray-600">Generate and export detailed reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {employees.length} Employees
          </Badge>
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
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Report Type</label>
                <Select 
                  value={reportType} 
                  onValueChange={(value: 'attendance' | 'leaves') => {
                    setReportType(value);
                    setLoading(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Attendance
                      </div>
                    </SelectItem>
                    <SelectItem value="leaves">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Leave
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Date Range</label>
                <Select 
                  value={dateRange} 
                  onValueChange={setDateRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateRange === 'custom' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">End Date</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      placeholder="Select end date"
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-end">
                <Button 
                  onClick={exportReport}
                  disabled={loading || 
                    (reportType === 'attendance' && filteredAttendance.length === 0) ||
                    (reportType === 'leaves' && filteredLeaves.length === 0)}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
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
              <BarChart3 className="h-5 w-5" />
              {reportType === 'attendance' ? 'Attendance' : 'Leave'} Report Summary
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({reportType === 'attendance' ? filteredAttendance.length : filteredLeaves.length} records)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            {reportType === 'attendance' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-600">Total Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">Present Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-green-600">
                        {filteredAttendance.filter(record => record.status === 'present').length}
                      </p>
                      <TrendingUp className="h-6 w-6 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50 border-red-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">Absent Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-red-600">
                        {filteredAttendance.filter(record => record.status === 'absent').length}
                      </p>
                      <Calendar className="h-6 w-6 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50 border-purple-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-600">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-purple-600">
                        {filteredAttendance.length > 0 
                          ? Math.round(
                              (filteredAttendance.filter(record => record.status === 'present').length / 
                              filteredAttendance.length * 100)
                            ) + '%' 
                          : '0%'}
                      </p>
                      <BarChart3 className="h-6 w-6 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {reportType === 'leaves' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-600">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-blue-600">{filteredLeaves.length}</p>
                      <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-green-600">
                        {filteredLeaves.filter(leave => leave.status === 'approved').length}
                      </p>
                      <TrendingUp className="h-6 w-6 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-50 border-yellow-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-yellow-600">
                        {filteredLeaves.filter(leave => leave.status === 'pending').length}
                      </p>
                      <BarChart3 className="h-6 w-6 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50 border-red-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-red-600">
                        {filteredLeaves.filter(leave => leave.status === 'rejected').length}
                      </p>
                      <Calendar className="h-6 w-6 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Department Wise Data */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Department Wise Analysis</h3>
              {departmentData.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          {reportType === 'attendance' ? (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {departmentData.map((dept, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                            {reportType === 'attendance' ? (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.present}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.absent}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.late}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.total}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    dept.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                    dept.percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {dept.percentage}%
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.approved}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.pending}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.rejected}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.total}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No department data available
                </div>
              )}
            </div>

            {/* Raw Data Preview */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
              {reportType === 'attendance' ? (
                filteredAttendance.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAttendance.slice(0, 5).map((record, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                                <div className="text-sm text-gray-500">{record.employeeId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.punchIn || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.punchOut || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  record.status === 'present' ? 'bg-green-100 text-green-800' :
                                  record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredAttendance.length > 5 && (
                      <div className="px-6 py-3 bg-gray-50 text-right text-sm text-gray-500">
                        Showing 5 of {filteredAttendance.length} records
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No attendance records found for the selected period
                  </div>
                )
              ) : (
                filteredLeaves.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredLeaves.slice(0, 5).map((request, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                                <div className="text-sm text-gray-500">{request.department}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.leaveType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>{formatDate(request.startDate)}</div>
                                <div>to</div>
                                <div>{formatDate(request.endDate)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {request.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(request.appliedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredLeaves.length > 5 && (
                      <div className="px-6 py-3 bg-gray-50 text-right text-sm text-gray-500">
                        Showing 5 of {filteredLeaves.length} records
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No leave requests found for the selected period
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportsManagement;