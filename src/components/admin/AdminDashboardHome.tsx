
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Plane, 
  FolderOpen, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AdminDashboardHome = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
    activeProjects: 0,
    monthlyExpenses: 0
  });

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'leave', message: 'John Doe has applied for leave', time: '2 hours ago', priority: 'high' },
    { id: 2, type: 'attendance', message: 'Late arrivals increased by 15%', time: '4 hours ago', priority: 'medium' },
    { id: 3, type: 'project', message: 'Project Alpha milestone completed', time: '1 day ago', priority: 'low' },
  ]);

  const attendanceData = [
    { name: 'Mon', present: 45, absent: 5 },
    { name: 'Tue', present: 48, absent: 2 },
    { name: 'Wed', present: 46, absent: 4 },
    { name: 'Thu', present: 47, absent: 3 },
    { name: 'Fri', present: 49, absent: 1 },
    { name: 'Sat', present: 25, absent: 25 },
  ];

  const departmentData = [
    { name: 'Software', value: 15, color: '#0088FE' },
    { name: 'Marketing', value: 8, color: '#00C49F' },
    { name: 'Sales', value: 12, color: '#FFBB28' },
    { name: 'Design', value: 10, color: '#FF8042' },
    { name: 'Web Dev', value: 5, color: '#8884D8' },
  ];

  useEffect(() => {
    // Load stats from localStorage
    const employees = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const activeEmployees = employees.filter((emp: any) => emp.isActive && emp.role === 'employee');
    
    setStats({
      totalEmployees: employees.filter((emp: any) => emp.role === 'employee').length,
      activeEmployees: activeEmployees.length,
      todayAttendance: Math.floor(activeEmployees.length * 0.85), // 85% attendance
      pendingLeaves: 5, // Mock data
      activeProjects: 12, // Mock data
      monthlyExpenses: 450000 // Mock data in rupees
    });
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome to your HRMS admin panel</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            System Online
          </Badge>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAttendance}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">85%</span> attendance rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <Plane className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-orange-600">Needs approval</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <IndianRupee className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.monthlyExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="h-96">
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="present" fill="#10B981" />
                  <Bar dataKey="absent" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notif.priority === 'high' ? 'bg-red-500' :
                      notif.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notif.message}</p>
                      <p className="text-xs text-gray-500">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4">
                {departmentData.map((dept) => (
                  <div key={dept.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="text-sm">{dept.name}: {dept.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700">
                <Users className="h-5 w-5" />
                <span className="text-sm">Add Employee</span>
              </Button>
              <Button className="h-20 flex flex-col gap-2 bg-green-600 hover:bg-green-700">
                <Plane className="h-5 w-5" />
                <span className="text-sm">Approve Leave</span>
              </Button>
              <Button className="h-20 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Schedule Meeting</span>
              </Button>
              <Button className="h-20 flex flex-col gap-2 bg-orange-600 hover:bg-orange-700">
                <FolderOpen className="h-5 w-5" />
                <span className="text-sm">Create Project</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboardHome;
