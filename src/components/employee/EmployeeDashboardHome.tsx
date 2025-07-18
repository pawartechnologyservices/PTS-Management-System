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
import { database } from '../../firebase';
import { ref, push, set, onValue, update, get } from 'firebase/database';
import { toast } from 'react-hot-toast';

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
  department: string;
  designation: string;
}

const EmployeeDashboardHome = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
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

  const loadAttendanceData = async () => {
    if (!user?.id || !user?.adminUid) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      const todayDateString = today.toISOString().split('T')[0];
      const attendanceRef = ref(database, `users/${user.adminUid}/employees/${user.id}/punching`);
      
      // First load the data immediately
      const snapshot = await get(attendanceRef);
      const data = snapshot.val();
      
      if (data) {
        const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as Omit<AttendanceRecord, 'id'>)
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        // Find today's record using proper date comparison
        const todayRecord = records.find(record => {
          const recordDate = new Date(record.date);
          return (
            recordDate.getDate() === today.getDate() &&
            recordDate.getMonth() === today.getMonth() &&
            recordDate.getFullYear() === today.getFullYear()
          );
        });
        
        setTodayAttendance(todayRecord || null);
        
        // Calculate stats for the current month
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        const monthlyRecords = records.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === thisMonth && 
                 recordDate.getFullYear() === thisYear;
        });
        
        setStats({
          attendanceRate: Math.round((monthlyRecords.length / 22) * 100),
          leavesUsed: 3,
          activeProjects: 2,
          upcomingMeetings: upcomingMeetings.length
        });
      } else {
        setTodayAttendance(null);
      }

      // Then set up the real-time listener
      const unsubscribe = onValue(attendanceRef, (snapshot) => {
        const updatedData = snapshot.val();
        if (updatedData) {
          const updatedRecords: AttendanceRecord[] = Object.entries(updatedData).map(([key, value]) => ({
            id: key,
            ...(value as Omit<AttendanceRecord, 'id'>)
          })).sort((a, b) => b.timestamp - a.timestamp);
          
          // Find today's record using proper date comparison
          const updatedTodayRecord = updatedRecords.find(record => {
            const recordDate = new Date(record.date);
            return (
              recordDate.getDate() === today.getDate() &&
              recordDate.getMonth() === today.getMonth() &&
              recordDate.getFullYear() === today.getFullYear()
            );
          });
          
          setTodayAttendance(updatedTodayRecord || null);
        } else {
          setTodayAttendance(null);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error loading attendance data:", error);
      toast.error("Failed to load attendance data");
      setTodayAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void;
    
    const fetchData = async () => {
      unsubscribe = await loadAttendanceData();
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handlePunchIn = async () => {
    if (!user?.id || !user?.adminUid) {
      toast.error("User information not available");
      return;
    }

    if (todayAttendance) {
      toast.error("You've already punched in today");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const newRecord: Omit<AttendanceRecord, 'id'> = {
        employeeId: user.id,
        employeeName: user.name || 'Unknown',
        date: now.toISOString(),
        punchIn: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        punchOut: null,
        status: 'present',
        workMode: 'office',
        timestamp: now.getTime(),
        department: user.department || '',
        designation: user.designation || ''
      };
      
      const punchingRef = ref(database, `users/${user.adminUid}/employees/${user.id}/punching`);
      const newRecordRef = push(punchingRef);
      await set(newRecordRef, newRecord);
      
      toast.success("Punched in successfully!");
    } catch (error) {
      console.error("Punch-in error:", error);
      toast.error("Failed to punch in");
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!user?.id || !user?.adminUid || !todayAttendance?.id) {
      toast.error("Cannot punch out - missing required data");
      return;
    }

    if (todayAttendance.punchOut) {
      toast.error("You've already punched out today");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const updates = {
        punchOut: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.getTime()
      };
      
      const recordRef = ref(database, `users/${user.adminUid}/employees/${user.id}/punching/${todayAttendance.id}`);
      await update(recordRef, updates);
      
      toast.success("Punched out successfully!");
    } catch (error) {
      console.error("Punch-out error:", error);
      toast.error("Failed to punch out");
    } finally {
      setLoading(false);
    }
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
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : todayAttendance ? (
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
                {!todayAttendance.punchOut ? (
                  <Button 
                    onClick={handlePunchOut}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Punch Out"}
                  </Button>
                ) : (
                  <div className="text-sm text-gray-500">Attendance completed for today</div>
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
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Punch In
                    </>
                  )}
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
                    className={`h-20 flex flex-col gap-2 ${action.color} text-white`}
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