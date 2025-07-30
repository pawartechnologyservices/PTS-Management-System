import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
<<<<<<< HEAD
import { Calendar, Clock, Download, Filter, Search, Users, AlertTriangle, Trash2, Clock3 } from 'lucide-react';
=======
import { Calendar, Clock, Download, Filter, Search, Users, AlertTriangle, Trash2, Sun, Bell } from 'lucide-react';
>>>>>>> dc553ae1e5c7ca72affa8a180c014fe0da7f519e
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../ui/use-toast';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../firebase';
import { ref, onValue, query, orderByChild, update, remove, off, limitToLast } from 'firebase/database';

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  status: string;
}

interface BreakRecord {
  breakIn: string;
  breakOut?: string;
  duration?: string;
  timestamp: number;
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
  markedLateBy?: string;
  markedLateAt?: string;
  markedHalfDayBy?: string;
  markedHalfDayAt?: string;
  breaks?: {
    [key: string]: BreakRecord;
  };
}

interface Notification {
  id: string;
  type: 'punch-in' | 'punch-out' | 'break-in' | 'break-out';
  employeeName: string;
  employeeId: string;
  department?: string;
  email?: string;
  time: string;
  timestamp: number;
  read: boolean;
}

const AttendanceManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  // Fetch employees data
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    const employeesRef = ref(database, `users/${user.id}/employees`);
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      try {
        const employeesData = snapshot.val();
        if (employeesData) {
          const employeesList: Employee[] = Object.entries(employeesData).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Employee, 'id'>)
          }));
          setEmployees(employeesList);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast({
          title: "Error",
          description: "Failed to load employee data",
          variant: "destructive",
        });
      }
    });

    return () => unsubscribeEmployees();
  }, [user]);

  // Setup real-time listeners for attendance changes
  useEffect(() => {
    if (!user?.id || employees.length === 0) {
      setLoading(false);
      return;
    }

    const allRecords: AttendanceRecord[] = [];
    const unsubscribeFunctions: (() => void)[] = [];
    const notificationUnsubscribes: (() => void)[] = [];
    const processedPunchOuts = new Set<string>();
    const processedBreaks = new Set<string>();

    employees.forEach(employee => {
      // Listen for attendance records
      const attendanceRef = ref(database, `users/${user.id}/employees/${employee.id}/punching`);
      const attendanceQuery = query(attendanceRef, orderByChild('timestamp'));
      
      const unsubscribeAttendance = onValue(attendanceQuery, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
              id: key,
              employeeId: employee.id,
              employeeName: employee.name,
              ...(value as Omit<AttendanceRecord, 'id' | 'employeeId' | 'employeeName'>),
              breaks: (value as any)?.breaks || {}
            }));
            
            const existingRecords = allRecords.filter(r => r.employeeId !== employee.id);
            allRecords.splice(0, allRecords.length, ...existingRecords, ...records);
            setAttendanceRecords([...allRecords].sort((a, b) => b.timestamp - a.timestamp));
          } else {
            const updatedRecords = allRecords.filter(r => r.employeeId !== employee.id);
            allRecords.splice(0, allRecords.length, ...updatedRecords);
            setAttendanceRecords([...allRecords]);
          }
        } catch (error) {
          console.error(`Error fetching attendance for employee ${employee.id}:`, error);
        }
      });

      // Listen for new punch in/out events
      const newAttendanceRef = ref(database, `users/${user.id}/employees/${employee.id}/punching`);
      const newAttendanceQuery = query(newAttendanceRef, orderByChild('timestamp'), limitToLast(1));
      
      const unsubscribeNewAttendance = onValue(newAttendanceQuery, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
              id: key,
              employeeId: employee.id,
              employeeName: employee.name,
              ...(value as Omit<AttendanceRecord, 'id' | 'employeeId' | 'employeeName'>),
              breaks: (value as any)?.breaks || {}
            }));

            records.forEach(record => {
              // Check if this is a new record (timestamp within last 5 minutes)
              if (record.timestamp > Date.now() - 300000) {
                const recordKey = `${record.employeeId}-${record.id}`;
                
                if (record.punchIn && !record.punchOut) {
                  // New punch in
                  showSystemNotification({
                    type: 'punch-in',
                    employeeName: record.employeeName,
                    employeeId: record.employeeId,
                    department: employee.department,
                    email: employee.email,
                    time: record.punchIn,
                    timestamp: record.timestamp
                  });
                } else if (record.punchOut && !processedPunchOuts.has(recordKey)) {
                  // New punch out (only trigger once per record)
                  processedPunchOuts.add(recordKey);
                  showSystemNotification({
                    type: 'punch-out',
                    employeeName: record.employeeName,
                    employeeId: record.employeeId,
                    department: employee.department,
                    email: employee.email,
                    time: record.punchOut,
                    timestamp: record.timestamp
                  });
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error checking new attendance for employee ${employee.id}:`, error);
        }
      });

      // Listen for break changes
      const breaksRef = ref(database, `users/${user.id}/employees/${employee.id}/punching`);
      
      const unsubscribeBreaks = onValue(breaksRef, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            Object.entries(data).forEach(([recordId, recordData]: [string, any]) => {
              if (recordData.breaks) {
                Object.entries(recordData.breaks).forEach(([breakId, breakData]: [string, any]) => {
                  // Check if this break was recently added (timestamp within last 5 minutes)
                  if (breakData.timestamp > Date.now() - 300000) {
                    const breakKey = `${employee.id}-${recordId}-${breakId}`;
                    
                    if (breakData.breakIn && !breakData.breakOut && !processedBreaks.has(breakKey)) {
                      // New break in
                      processedBreaks.add(breakKey);
                      showSystemNotification({
                        type: 'break-in',
                        employeeName: employee.name,
                        employeeId: employee.id,
                        department: employee.department,
                        email: employee.email,
                        time: breakData.breakIn,
                        timestamp: breakData.timestamp
                      });
                    } else if (breakData.breakOut && !processedBreaks.has(breakKey)) {
                      // New break out (only trigger once per break)
                      processedBreaks.add(breakKey);
                      showSystemNotification({
                        type: 'break-out',
                        employeeName: employee.name,
                        employeeId: employee.id,
                        department: employee.department,
                        email: employee.email,
                        time: breakData.breakOut,
                        timestamp: breakData.timestamp
                      });
                    }
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error checking breaks for employee ${employee.id}:`, error);
        }
      });

      unsubscribeFunctions.push(unsubscribeAttendance, unsubscribeNewAttendance, unsubscribeBreaks);
    });

    setLoading(false);
    
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      notificationUnsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, employees]);

  const showSystemNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${notification.employeeId}-${notification.timestamp}`,
      read: false
    };

    // Add to in-app notifications
    setNotifications(prev => [newNotification, ...prev]);
    setCurrentNotification(newNotification);
    setShowNotification(true);

    // Show browser notification if permission is granted
    if (notificationPermission === 'granted') {
      const notificationDetails = getNotificationDetails(notification.type);
      try {
        new Notification(`${notificationDetails.title}: ${notification.employeeName}`, {
          body: `${notificationDetails.title} at ${notification.time}` +
                (notification.department ? ` (${notification.department})` : ''),
          icon: '/logo.png', // Replace with your app's icon
          tag: `attendance-${notification.type}-${notification.timestamp}`
        });
      } catch (error) {
        console.error('Error showing system notification:', error);
      }
    }

    // Auto-hide after 5 seconds
    const timeoutId = setTimeout(() => {
      setShowNotification(false);
      // Delay clearing current notification to allow animation to complete
      setTimeout(() => setCurrentNotification(null), 500);
    }, 5000);

    return () => clearTimeout(timeoutId);
  };

  // Apply filters to attendance records
  useEffect(() => {
    let filtered = [...attendanceRecords];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.employeeName?.toLowerCase().includes(term) ||
        record.employeeId?.toLowerCase().includes(term)
      );
    }

    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getFullYear() === filterDateObj.getFullYear() &&
          recordDate.getMonth() === filterDateObj.getMonth() &&
          recordDate.getDate() === filterDateObj.getDate()
        );
      });
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, filterDate, filterStatus, attendanceRecords]);

  const markAsLate = async (recordId: string, employeeId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordRef = ref(database, `users/${user.id}/employees/${employeeId}/punching/${recordId}`);
      
      await update(recordRef, {
        status: 'late',
        markedLateBy: user.name || 'admin',
        markedLateAt: new Date().toISOString(),
        markedHalfDayBy: null,
        markedHalfDayAt: null
      });

      toast({
        title: "Success",
        description: "Employee marked as late successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error marking as late:", error);
      toast({
        title: "Error",
        description: "Failed to mark as late",
        variant: "destructive",
      });
    }
  };

  const markAsHalfDay = async (recordId: string, employeeId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordRef = ref(database, `users/${user.id}/employees/${employeeId}/punching/${recordId}`);
      
      await update(recordRef, {
        status: 'half-day',
        markedHalfDayBy: user.name || 'admin',
<<<<<<< HEAD
        markedHalfDayAt: new Date().toISOString()
=======
        markedHalfDayAt: new Date().toISOString(),
        markedLateBy: null,
        markedLateAt: null
>>>>>>> dc553ae1e5c7ca72affa8a180c014fe0da7f519e
      });

      toast({
        title: "Success",
        description: "Employee marked as half day successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error marking as half day:", error);
      toast({
        title: "Error",
        description: "Failed to mark as half day",
        variant: "destructive",
      });
    }
  };

<<<<<<< HEAD
=======
  const resetStatus = async (recordId: string, employeeId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordRef = ref(database, `users/${user.id}/employees/${employeeId}/punching/${recordId}`);
      
      await update(recordRef, {
        status: 'present',
        markedLateBy: null,
        markedLateAt: null,
        markedHalfDayBy: null,
        markedHalfDayAt: null
      });

      toast({
        title: "Success",
        description: "Attendance status reset to present",
        variant: "default",
      });
    } catch (error) {
      console.error("Error resetting status:", error);
      toast({
        title: "Error",
        description: "Failed to reset status",
        variant: "destructive",
      });
    }
  };

>>>>>>> dc553ae1e5c7ca72affa8a180c014fe0da7f519e
  const deleteAttendanceRecord = async (recordId: string, employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordRef = ref(database, `users/${user.id}/employees/${employeeId}/punching/${recordId}`);
      await remove(recordRef);

      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting record:", error);
      toast({
        title: "Error",
        description: "Failed to delete attendance record",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
<<<<<<< HEAD
      case 'half-day': return 'bg-blue-100 text-blue-700';
=======
      case 'half-day': return 'bg-purple-100 text-purple-700';
>>>>>>> dc553ae1e5c7ca72affa8a180c014fe0da7f519e
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateTimeDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'N/A';
    
    try {
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let totalHours = hours;
        
        if (period === 'PM' && hours < 12) {
          totalHours += 12;
        } else if (period === 'AM' && hours === 12) {
          totalHours = 0;
        }
        
        return totalHours * 60 + minutes;
      };

      const startMinutes = parseTime(startTime);
      const endMinutes = parseTime(endTime);

      let durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }

      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error calculating time duration:', error);
      return 'N/A';
    }
  };

  const calculateTotalBreakTime = (breaks: Record<string, BreakRecord> | undefined) => {
    if (!breaks) return 'N/A';

    let totalBreakMinutes = 0;
    
    Object.values(breaks).forEach(breakRecord => {
      if (breakRecord.breakOut && breakRecord.duration) {
        const [hours, minutes] = breakRecord.duration.split(':').map(Number);
        totalBreakMinutes += hours * 60 + minutes;
      }
    });

    const hours = Math.floor(totalBreakMinutes / 60);
    const minutes = totalBreakMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const exportAttendance = async () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No records to export",
        variant: "destructive",
      });
      return;
    }

    setExportLoading(true);
    try {
      const headers = [
        'Employee Name',
        'Employee ID',
        'Date',
        'Punch In',
        'Punch Out',
        'Total Hours',
        'Total Break Time',
        'Status',
        'Work Mode',
        'Marked Late By',
        'Marked Late At',
        'Marked Half Day By',
        'Marked Half Day At',
        'Breaks'
      ];

      const rows = filteredRecords.map(record => [
        record.employeeName,
        record.employeeId,
        new Date(record.date).toLocaleDateString(),
        record.punchIn || '-',
        record.punchOut || '-',
        calculateTimeDuration(record.punchIn, record.punchOut),
        calculateTotalBreakTime(record.breaks),
        record.status,
        record.workMode || 'office',
        record.markedLateBy || '-',
        record.markedLateAt ? new Date(record.markedLateAt).toLocaleString() : '-',
        record.markedHalfDayBy || '-',
        record.markedHalfDayAt ? new Date(record.markedHalfDayAt).toLocaleString() : '-',
        record.breaks ? Object.entries(record.breaks).map(([breakId, breakData]) => 
          `Break ${breakId}: ${breakData.breakIn} to ${breakData.breakOut || 'ongoing'} (${breakData.duration || 'N/A'})`
          .join('; ') ): 'No breaks'
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Attendance data has been exported",
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting attendance:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
    setFilterStatus('all');
  };

  const renderBreaksTooltip = (breaks: Record<string, BreakRecord> | undefined) => {
    if (!breaks || Object.keys(breaks).length === 0) {
      return <span className="text-gray-400">No breaks</span>;
    }

    return (
      <div className="max-w-xs">
        {Object.entries(breaks).map(([breakId, breakData]) => (
          <div key={breakId} className="mb-1 last:mb-0">
            <div className="font-medium">Break {breakId}</div>
            <div className="text-sm">
              <span className="text-green-600">{breakData.breakIn}</span> to{' '}
              {breakData.breakOut ? (
                <span className="text-red-600">{breakData.breakOut}</span>
              ) : (
                <span className="text-yellow-600">ongoing</span>
              )}
              {breakData.duration && (
                <span className="block text-gray-500">Duration: {breakData.duration}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getNotificationDetails = (type: string) => {
    switch (type) {
      case 'punch-in':
        return { title: 'Punched In', color: 'bg-green-100 text-green-800' };
      case 'punch-out':
        return { title: 'Punched Out', color: 'bg-blue-100 text-blue-800' };
      case 'break-in':
        return { title: 'Break Started', color: 'bg-yellow-100 text-yellow-800' };
      case 'break-out':
        return { title: 'Break Ended', color: 'bg-purple-100 text-purple-800' };
      default:
        return { title: 'Notification', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Notification Popup */}
      {showNotification && currentNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm w-full ${getNotificationDetails(currentNotification.type).color} border-l-4 ${
            currentNotification.type === 'punch-in' ? 'border-green-500' :
            currentNotification.type === 'punch-out' ? 'border-blue-500' :
            currentNotification.type === 'break-in' ? 'border-yellow-500' :
            'border-purple-500'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium">
                {getNotificationDetails(currentNotification.type).title}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-semibold">{currentNotification.employeeName}</span>
                {currentNotification.department && (
                  <span> ({currentNotification.department})</span>
                )}
              </p>
              <p className="mt-1 text-sm">
                {currentNotification.type.includes('punch') ? 'Punch' : 'Break'} time: {currentNotification.time}
              </p>
              {currentNotification.email && (
                <p className="mt-1 text-xs text-gray-600">
                  {currentNotification.email}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => setShowNotification(false)}
                className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
          <p className="text-gray-600">Track and manage employee attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search employee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={exportAttendance} 
                    disabled={exportLoading || filteredRecords.length === 0}
                    className="w-full"
                  >
                    {exportLoading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export ({filteredRecords.length})
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendance Records ({filteredRecords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Employee</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Punch In</th>
                        <th className="text-left p-3">Punch Out</th>
                        <th className="text-left p-3">Total Hours</th>
                        <th className="text-left p-3">Break Time</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Work Mode</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record, index) => (
                        <motion.tr
                          key={`${record.id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{record.employeeName}</p>
                              <p className="text-sm text-gray-500">{record.employeeId}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-500" />
                              {record.punchIn || '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-red-500" />
                              {record.punchOut || '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            {calculateTimeDuration(record.punchIn, record.punchOut)}
                          </td>
                          <td className="p-3">
                            <div className="group relative">
                              <span className="cursor-help underline">
                                {calculateTotalBreakTime(record.breaks)}
                              </span>
                              <div className="absolute z-10 hidden group-hover:block bg-white p-3 border rounded shadow-lg w-64">
                                {renderBreaksTooltip(record.breaks)}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                            {record.markedLateBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                Marked late by {record.markedLateBy}
                              </p>
                            )}
                            {record.markedHalfDayBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                Marked half day by {record.markedHalfDayBy}
                              </p>
                            )}
                            {record.markedHalfDayBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                Marked half day by {record.markedHalfDayBy}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {record.workMode || 'office'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
<<<<<<< HEAD
                              {record.status !== 'late' && record.status !== 'absent' && record.status !== 'half-day' && (
=======
                              {record.status === 'late' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markAsHalfDay(record.id, record.employeeId)}
                                    className="text-purple-600 hover:text-purple-700"
                                  >
                                    <Sun className="h-3 w-3 mr-1" />
                                    Half Day
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resetStatus(record.id, record.employeeId)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    Reset
                                  </Button>
                                </>
                              ) : record.status === 'half-day' ? (
>>>>>>> dc553ae1e5c7ca72affa8a180c014fe0da7f519e
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markAsLate(record.id, record.employeeId)}
                                    className="text-yellow-600 hover:text-yellow-700"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
<<<<<<< HEAD
                                    Mark Late
=======
                                    Late
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resetStatus(record.id, record.employeeId)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    Reset
                                  </Button>
                                </>
                              ) : record.status === 'present' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markAsLate(record.id, record.employeeId)}
                                    className="text-yellow-600 hover:text-yellow-700"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Late
>>>>>>> dc553ae1e5c7ca72affa8a180c014fe0da7f519e
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markAsHalfDay(record.id, record.employeeId)}
<<<<<<< HEAD
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Clock3 className="h-3 w-3 mr-1" />
                                    Half Day
                                  </Button>
                                </>
                              )}
=======
                                    className="text-purple-600 hover:text-purple-700"
                                  >
                                    <Sun className="h-3 w-3 mr-1" />
                                    Half Day
                                  </Button>
                                </>
                              ) : null}
>>>>>>> dc553ae1e5c7ca72affa8a180c014fe0da7f519e
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteAttendanceRecord(record.id, record.employeeId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecords.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No attendance records found matching your filters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AttendanceManagement;