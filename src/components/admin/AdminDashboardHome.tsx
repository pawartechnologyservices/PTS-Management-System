
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Calendar, Clock, TrendingUp, Briefcase, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

const AdminDashboardHome = () => {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    pendingLeaves: 0,
    todayPresent: 0,
    todayAbsent: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load employees
    const users = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const employeeUsers = users.filter((user: any) => user.role === 'employee');
    setEmployees(employeeUsers);

    // Load leave requests
    const leaves = JSON.parse(localStorage.getItem('leave_requests') || '[]');
    setLeaveRequests(leaves);

    // Load attendance data
    const attendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    setAttendanceData(attendance);

    // Calculate stats
    const activeCount = employeeUsers.filter((emp: any) => emp.isActive).length;
    const inactiveCount = employeeUsers.length - activeCount;
    const pendingLeaves = leaves.filter((leave: any) => leave.status === 'pending').length;

    // Today's attendance (simulate)
    const todayPresent = Math.floor(activeCount * 0.85); // 85% attendance rate
    const todayAbsent = activeCount - todayPresent;

    setStats({
      totalEmployees: employeeUsers.length,
      activeEmployees: activeCount,
      inactiveEmployees: inactiveCount,
      pendingLeaves,
      todayPresent,
      todayAbsent
    });
  };

  const getRecentLeaves = () => {
    return leaveRequests
      .sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .slice(0, 5);
  };

  const getRecentEmployees = () => {
    return employees
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getDepartmentStats = () => {
    const deptCount: { [key: string]: number } = {};
    employees.forEach((emp: any) => {
      deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
    });
    return Object.entries(deptCount).map(([dept, count]) => ({ dept, count }));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your organization's workforce and activities</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalEmployees}</div>
            <p className="text-xs text-blue-600 mt-1">All registered employees</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Active Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.activeEmployees}</div>
            <p className="text-xs text-green-600 mt-1">Currently active workforce</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.pendingLeaves}</div>
            <p className="text-xs text-orange-600 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Today's Attendance</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.todayPresent}/{stats.activeEmployees}</div>
            <p className="text-xs text-purple-600 mt-1">Present today</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Department Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getDepartmentStats().map(({ dept, count }, index) => (
                <div key={dept} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">{dept}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{count} employees</span>
                    <Badge variant="outline">{((count / stats.totalEmployees) * 100).toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Present Today</span>
                  <span className="text-sm text-gray-600">{stats.todayPresent}/{stats.activeEmployees}</span>
                </div>
                <Progress value={(stats.todayPresent / stats.activeEmployees) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{stats.todayPresent}</div>
                  <div className="text-xs text-green-700">Present</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{stats.todayAbsent}</div>
                  <div className="text-xs text-red-700">Absent</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRecentLeaves().map((leave: any, index) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{leave.employeeName}</p>
                    <p className="text-xs text-gray-600">{leave.leaveType} • {leave.reason}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant={leave.status === 'pending' ? 'outline' : leave.status === 'approved' ? 'default' : 'destructive'}
                  >
                    {leave.status}
                  </Badge>
                </div>
              ))}
              {getRecentLeaves().length === 0 && (
                <p className="text-center text-gray-500 py-4">No recent leave requests</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRecentEmployees().map((employee: any, index) => (
                <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {employee.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{employee.name}</p>
                      <p className="text-xs text-gray-600">{employee.designation}</p>
                      <p className="text-xs text-gray-500">{employee.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {getRecentEmployees().length === 0 && (
                <p className="text-center text-gray-500 py-4">No employees found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboardHome;
