
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Plane, 
  FolderOpen, 
  Calendar,
  CheckCircle,
  Users,
  TrendingUp,
  AlertCircle,
  Coffee,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';

const EmployeeDashboardHome = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState({
    attendanceRate: 0,
    leavesUsed: 0,
    activeProjects: 0,
    upcomingMeetings: 0
  });

  const [quickActions] = useState([
    { icon: Clock, label: 'Mark Attendance', color: 'bg-blue-600 hover:bg-blue-700' },
    { icon: Plane, label: 'Apply Leave', color: 'bg-green-600 hover:bg-green-700' },
    { icon: FolderOpen, label: 'View Projects', color: 'bg-purple-600 hover:bg-purple-700' },
    { icon: Calendar, label: 'My Meetings', color: 'bg-orange-600 hover:bg-orange-700' },
  ]);

  const [upcomingMeetings] = useState([
    { id: 1, title: 'Team Standup', time: '09:00 AM', date: 'Today' },
    { id: 2, title: 'Project Review', time: '02:00 PM', date: 'Today' },
    { id: 3, title: 'Client Meeting', time: '10:00 AM', date: 'Tomorrow' },
  ]);

  const [recentActivities] = useState([
    { id: 1, action: 'Submitted project milestone', time: '2 hours ago', type: 'project' },
    { id: 2, action: 'Marked attendance', time: 'This morning', type: 'attendance' },
    { id: 3, action: 'Completed task review', time: 'Yesterday', type: 'task' },
  ]);

  useEffect(() => {
    // Load user stats
    const attendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const userAttendance = attendance.filter((record: any) => record.employeeId === user?.id);
    const today = new Date().toDateString();
    const todayRecord = userAttendance.find((record: any) => 
      new Date(record.date).toDateString() === today
    );
    
    setTodayAttendance(todayRecord);
    
    // Calculate stats
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthlyAttendance = userAttendance.filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    });
    
    setStats({
      attendanceRate: Math.round((monthlyAttendance.length / 22) * 100), // 22 working days
      leavesUsed: 3, // Mock data
      activeProjects: 2, // Mock data
      upcomingMeetings: upcomingMeetings.length
    });
  }, [user]);

  const handlePunchIn = () => {
    const attendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const newRecord = {
      id: Date.now().toString(),
      employeeId: user?.id,
      employeeName: user?.name,
      date: new Date().toISOString(),
      punchIn: new Date().toLocaleTimeString(),
      punchOut: null,
      status: 'present',
      workMode: 'office'
    };
    
    attendance.push(newRecord);
    localStorage.setItem('attendance_records', JSON.stringify(attendance));
    
    setTodayAttendance(newRecord);
  };

  const handlePunchOut = () => {
    const attendance = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const updatedAttendance = attendance.map((record: any) => {
      if (record.id === todayAttendance.id) {
        return { ...record, punchOut: new Date().toLocaleTimeString() };
      }
      return record;
    });
    
    localStorage.setItem('attendance_records', JSON.stringify(updatedAttendance));
    
    setTodayAttendance({
      ...todayAttendance,
      punchOut: new Date().toLocaleTimeString()
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 mt-1">
              {user?.designation} • {user?.department}
            </p>
            <p className="text-blue-100 text-sm">
              Employee ID: {user?.employeeId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Today's Date</p>
            <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
            <p className="text-sm text-blue-100">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
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
              <CardTitle className="text-sm font-medium">Leaves Used</CardTitle>
              <Plane className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leavesUsed}</div>
              <p className="text-xs text-muted-foreground">Out of 24 days</p>
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
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
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
              <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingMeetings}</div>
              <p className="text-xs text-muted-foreground">Today & tomorrow</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Punch In</p>
                    <p className="text-lg font-semibold text-green-600">{todayAttendance.punchIn}</p>
                  </div>
                  {todayAttendance.punchOut && (
                    <div>
                      <p className="text-sm text-gray-600">Punch Out</p>
                      <p className="text-lg font-semibold text-red-600">{todayAttendance.punchOut}</p>
                    </div>
                  )}
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Present
                  </Badge>
                </div>
                {!todayAttendance.punchOut && (
                  <Button 
                    onClick={handlePunchOut}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Punch Out
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Ready to start your day?</p>
                  <p className="text-gray-600">Mark your attendance to begin</p>
                </div>
                <Button 
                  onClick={handlePunchIn}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Punch In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions & Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    className={`h-20 flex flex-col gap-2 ${action.color}`}
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Meetings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-gray-600">{meeting.time} • {meeting.date}</p>
                    </div>
                    <Badge variant="outline">{meeting.date}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'project' ? 'bg-blue-500' :
                    activity.type === 'attendance' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeDashboardHome;
