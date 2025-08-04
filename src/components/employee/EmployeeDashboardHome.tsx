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
  Target,
  Video,
  MapPin,
  AlertTriangle,
  XCircle,
  Download,
  Share2,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../firebase';
import { ref, push, set, onValue, update, get, query, orderByChild } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
  totalHours?: string;
  markedLateBy?: string;
  markedLateAt?: string;
  department?: string;
  designation?: string;
  breaks?: {
    [key: string]: {
      breakIn: string;
      breakOut?: string;
      duration?: string;
    }
  };
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
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

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  type: 'common' | 'department';
  department?: string;
  meetingLink?: string;
  agenda?: string;
  createdAt?: number;
  employeeId?: string;
  employeeName?: string;
}

interface SocialMediaActivity {
  id: string;
  type: 'social_media';
  action: string;
  platform: string;
  timestamp: number;
  content?: string;
  scheduledDate?: string;
  status?: string;
}

interface RecentActivity {
  id: string;
  type: 'project' | 'attendance' | 'task' | 'social_media' | 'break';
  action: string;
  time: string;
  timestamp: number;
  details?: any;
}

const EmployeeDashboardHome = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [breakLoading, setBreakLoading] = useState(false);
  const [currentBreakId, setCurrentBreakId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    attendanceRate: 0,
    leavesUsed: 0,
    activeProjects: 0,
    upcomingMeetings: 0,
    presentDays: 0,
    totalDays: 0,
    scheduledPosts: 0,
    totalBreakTime: 0
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [socialMediaActivities, setSocialMediaActivities] = useState<SocialMediaActivity[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isTeamLead, setIsTeamLead] = useState(false);
  const navigate = useNavigate();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [quickActions] = useState([
    { icon: Clock, label: 'Mark Attendance', color: 'bg-blue-600 hover:bg-blue-700', onClick: () => navigate('/employee/attendance') },
    { icon: Plane, label: 'Apply Leave', color: 'bg-green-600 hover:bg-green-700', onClick: () => navigate('/employee/leaves') },
    { icon: FolderOpen, label: 'View Projects', color: 'bg-purple-600 hover:bg-purple-700', onClick: () => navigate('/employee/projects') },
    { icon: Calendar, label: 'My Meetings', color: 'bg-orange-600 hover:bg-orange-700', onClick: () => navigate('/employee/meetings') },
  ]);

  // Check if user is team lead
  useEffect(() => {
    if (!user?.adminUid || !user?.id) return;
    
    const employeeRef = ref(database, `users/${user.adminUid}/employees/${user.id}`);
    const unsubscribe = onValue(employeeRef, (snapshot) => {
      const data = snapshot.val();
      setIsTeamLead(data?.designation === 'Team Lead');
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch attendance records and calculate rate
  useEffect(() => {
    if (!user?.id || !user?.adminUid) {
      setLoading(false);
      return;
    }

    const attendanceRef = ref(database, `users/${user.adminUid}/employees/${user.id}/punching`);
    const attendanceQuery = query(attendanceRef, orderByChild('timestamp'));

    const unsubscribe = onValue(attendanceQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<AttendanceRecord, 'id'>)
          })).sort((a, b) => b.timestamp - a.timestamp);

          setAttendanceRecords(records);
          
          // Calculate attendance rate for current month
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const monthlyRecords = records.filter(record => {
            if (!record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && 
                   recordDate.getFullYear() === currentYear;
          });

          const presentDays = monthlyRecords.filter(record => record.status === 'present').length;
          const totalDays = monthlyRecords.length;
          const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

          // Calculate total break time
          let totalBreakTime = 0;
          records.forEach(record => {
            if (record.breaks) {
              Object.values(record.breaks).forEach(breakItem => {
                if (breakItem.duration) {
                  const [hours, minutes] = breakItem.duration.split(':').map(Number);
                  totalBreakTime += hours * 60 + minutes;
                }
              });
            }
          });

          setStats(prev => ({
            ...prev,
            attendanceRate,
            presentDays,
            totalDays,
            totalBreakTime
          }));
        } else {
          setAttendanceRecords([]);
          setStats(prev => ({
            ...prev,
            attendanceRate: 0,
            presentDays: 0,
            totalDays: 0,
            totalBreakTime: 0
          }));
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        toast.error("Failed to load attendance records");
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch project count
  useEffect(() => {
    if (!user?.id || !user?.adminUid) return;

    const fetchProjectCount = async () => {
      try {
        let projectCount = 0;
        
        if (isTeamLead) {
          // Count projects where user is team lead
          const projectsRef = ref(database, `users/${user.adminUid}/projects`);
          const projectsSnapshot = await get(projectsRef);
          
          if (projectsSnapshot.exists()) {
            const projectsData = projectsSnapshot.val();
            projectCount = Object.values(projectsData)
              .filter((project: any) => project.assignedTeamLeader === user.id)
              .length;
          }
        } else {
          // Count projects assigned to employee
          const employeeProjectsRef = ref(database, `users/${user.adminUid}/employees/${user.id}/projects`);
          const employeeProjectsSnapshot = await get(employeeProjectsRef);
          projectCount = employeeProjectsSnapshot.exists() ? Object.keys(employeeProjectsSnapshot.val()).length : 0;
        }

        setStats(prev => ({
          ...prev,
          activeProjects: projectCount
        }));
      } catch (error) {
        console.error("Error fetching project count:", error);
        toast.error("Failed to load project count");
      }
    };

    fetchProjectCount();
  }, [user, isTeamLead]);

  // Fetch upcoming meetings count
  useEffect(() => {
    if (!user?.id || !user?.adminUid) {
      setLoading(false);
      return;
    }

    const meetingsRef = ref(database, `users/${user.adminUid}/employees/${user.id}/meetings`);
    const meetingsQuery = query(meetingsRef, orderByChild('date'));

    const unsubscribe = onValue(meetingsQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const meetingsData: Meeting[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Meeting, 'id'>)
          }));

          // Filter upcoming meetings
          const now = new Date();
          const upcoming = meetingsData.filter((meeting) => {
            const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
            return meetingDateTime.getTime() > now.getTime();
          });

          setUpcomingMeetings(upcoming);
          setStats(prev => ({
            ...prev,
            upcomingMeetings: upcoming.length
          }));
        } else {
          setUpcomingMeetings([]);
          setStats(prev => ({
            ...prev,
            upcomingMeetings: 0
          }));
        }
      } catch (error) {
        console.error("Error fetching meetings data:", error);
        toast.error("Failed to load meetings");
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch social media activities
  useEffect(() => {
    if (!user?.id || !user?.adminUid || user?.department !== 'Digital Marketing') {
      setLoading(false);
      return;
    }

    const socialMediaRef = ref(database, `users/${user.adminUid}/employees/${user.id}/socialmedia`);
    const socialMediaQuery = query(socialMediaRef, orderByChild('createdAt'));

    const unsubscribe = onValue(socialMediaQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const activities: SocialMediaActivity[] = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            type: 'social_media',
            action: `Scheduled ${value.platform} post`,
            platform: value.platform,
            timestamp: new Date(value.createdAt).getTime(),
            content: value.content,
            scheduledDate: value.scheduledDate,
            status: value.status
          })).sort((a, b) => b.timestamp - a.timestamp);

          setSocialMediaActivities(activities);
          setStats(prev => ({
            ...prev,
            scheduledPosts: activities.filter(a => a.status === 'scheduled').length
          }));
        } else {
          setSocialMediaActivities([]);
          setStats(prev => ({
            ...prev,
            scheduledPosts: 0
          }));
        }
      } catch (error) {
        console.error("Error fetching social media activities:", error);
        toast.error("Failed to load social media activities");
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Combine all activities for recent activities section
  useEffect(() => {
    const now = new Date();
    const allActivities: RecentActivity[] = [];

    // Add attendance activities
    attendanceRecords.slice(0, 3).forEach(record => {
      allActivities.push({
        id: record.id,
        type: 'attendance',
        action: `Marked ${record.status} for ${new Date(record.date).toLocaleDateString()}`,
        time: formatTimeDifference(now, new Date(record.timestamp)),
        timestamp: record.timestamp
      });

      // Add break activities if they exist
      if (record.breaks) {
        Object.entries(record.breaks).forEach(([breakId, breakData]) => {
          allActivities.push({
            id: breakId,
            type: 'break',
            action: breakData.breakOut 
              ? `Completed break (${breakData.duration})`
              : `Started break at ${breakData.breakIn}`,
            time: formatTimeDifference(now, new Date(record.timestamp)),
            timestamp: record.timestamp,
            details: breakData
          });
        });
      }
    });

    // Add social media activities
    socialMediaActivities.slice(0, 3).forEach(activity => {
      allActivities.push({
        id: activity.id,
        type: 'social_media',
        action: activity.action,
        time: formatTimeDifference(now, new Date(activity.timestamp)),
        timestamp: activity.timestamp,
        details: {
          platform: activity.platform,
          content: activity.content,
          scheduledDate: activity.scheduledDate
        }
      });
    });

    // Sort all activities by timestamp
    allActivities.sort((a, b) => b.timestamp - a.timestamp);

    // Take the most recent 5 activities
    setRecentActivities(allActivities.slice(0, 5));
  }, [attendanceRecords, socialMediaActivities]);

  const formatTimeDifference = (now: Date, past: Date) => {
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  };

  const calculateLeaveDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const loadLeaveData = async () => {
    if (!user?.id || !user?.adminUid) {
      return;
    }

    try {
      const leavesRef = ref(database, `users/${user.adminUid}/employees/${user.id}/leaves`);
      const snapshot = await get(leavesRef);
      const data = snapshot.val();
      
      if (data) {
        const requests: LeaveRequest[] = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as Omit<LeaveRequest, 'id'>)
        }));
        
        // Calculate total approved leave days
        const approvedDays = requests
          .filter(req => req.status === 'approved')
          .reduce((total, req) => total + calculateLeaveDays(req.startDate, req.endDate), 0);
        
        setLeaveRequests(requests);
        setStats(prev => ({
          ...prev,
          leavesUsed: approvedDays
        }));
      } else {
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error("Error loading leave data:", error);
      toast.error("Failed to load leave data");
    }
  };

  const loadTodayAttendance = async () => {
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
        
        if (todayRecord) {
          setTodayAttendance(todayRecord);
          // Check if there's any active break (break without breakOut)
          if (todayRecord.breaks) {
            const activeBreak = Object.entries(todayRecord.breaks).find(
              ([, breakData]) => !breakData.breakOut
            );
            if (activeBreak) {
              setCurrentBreakId(activeBreak[0]);
            }
          }
        } else {
          setTodayAttendance(null);
          setCurrentBreakId(null);
        }
      } else {
        setTodayAttendance(null);
        setCurrentBreakId(null);
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
          
          if (updatedTodayRecord) {
            setTodayAttendance(updatedTodayRecord);
            // Check if there's any active break (break without breakOut)
            if (updatedTodayRecord.breaks) {
              const activeBreak = Object.entries(updatedTodayRecord.breaks).find(
                ([, breakData]) => !breakData.breakOut
              );
              if (activeBreak) {
                setCurrentBreakId(activeBreak[0]);
              } else {
                setCurrentBreakId(null);
              }
            } else {
              setCurrentBreakId(null);
            }
          } else {
            setTodayAttendance(null);
            setCurrentBreakId(null);
          }
        } else {
          setTodayAttendance(null);
          setCurrentBreakId(null);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error loading attendance data:", error);
      toast.error("Failed to load attendance data");
      setTodayAttendance(null);
      setCurrentBreakId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void;
    
    const fetchData = async () => {
      await loadLeaveData();
      unsubscribe = await loadTodayAttendance();
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

    // Check if there's an active break
    if (currentBreakId) {
      toast.error("Please end your current break before punching out");
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

  const handleBreakIn = async () => {
    if (!user?.id || !user?.adminUid || !todayAttendance?.id) {
      toast.error("Cannot start break - missing required data");
      return;
    }

    if (currentBreakId) {
      toast.error("You already have an active break");
      return;
    }

    setBreakLoading(true);
    try {
      const now = new Date();
      const breakInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const breakId = `break_${now.getTime()}`;
      
      const updates = {
        [`breaks/${breakId}/breakIn`]: breakInTime,
        [`breaks/${breakId}/timestamp`]: now.getTime()
      };
      
      const recordRef = ref(database, `users/${user.adminUid}/employees/${user.id}/punching/${todayAttendance.id}`);
      await update(recordRef, updates);
      
      setCurrentBreakId(breakId);
      toast.success("Break started successfully!");
    } catch (error) {
      console.error("Break-in error:", error);
      toast.error("Failed to start break");
    } finally {
      setBreakLoading(false);
    }
  };

  const calculateBreakDuration = (breakInTime: string, breakOutTime: string) => {
    try {
      // Parse the time strings (format: "HH:MM AM/PM")
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let totalHours = hours;
        
        if (period === 'PM' && hours < 12) {
          totalHours += 12;
        } else if (period === 'AM' && hours === 12) {
          totalHours = 0;
        }
        
        return totalHours * 60 + minutes; // Convert to total minutes
      };

      const inMinutes = parseTime(breakInTime);
      const outMinutes = parseTime(breakOutTime);

      // Handle case where break spans midnight
      let durationMinutes = outMinutes - inMinutes;
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Add 24 hours if negative
      }

      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating break duration:', error);
      return '00:00';
    }
  };

  const handleBreakOut = async () => {
    if (!user?.id || !user?.adminUid || !todayAttendance?.id || !currentBreakId) {
      toast.error("Cannot end break - missing required data");
      return;
    }

    setBreakLoading(true);
    try {
      const now = new Date();
      const breakOutTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Get the break in time
      const breakInTime = todayAttendance.breaks?.[currentBreakId]?.breakIn;
      if (!breakInTime) {
        throw new Error("Break in time not found");
      }
      
      // Calculate duration
      const duration = calculateBreakDuration(breakInTime, breakOutTime);
      
      const updates = {
        [`breaks/${currentBreakId}/breakOut`]: breakOutTime,
        [`breaks/${currentBreakId}/duration`]: duration,
        [`breaks/${currentBreakId}/timestamp`]: now.getTime()
      };
      
      const recordRef = ref(database, `users/${user.adminUid}/employees/${user.id}/punching/${todayAttendance.id}`);
      await update(recordRef, updates);
      
      setCurrentBreakId(null);
      toast.success("Break ended successfully!");
    } catch (error) {
      console.error("Break-out error:", error);
      toast.error("Failed to end break");
    } finally {
      setBreakLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const isToday = (dateString: string) => {
    const meetingDate = new Date(dateString);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateString: string) => {
    const meetingDate = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return meetingDate.toDateString() === tomorrow.toDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
      case 'half-day': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'late': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'Facebook': 'bg-blue-100 text-blue-700',
      'Instagram': 'bg-pink-100 text-pink-700',
      'Twitter': 'bg-sky-100 text-sky-700',
      'LinkedIn': 'bg-indigo-100 text-indigo-700',
      'YouTube': 'bg-red-100 text-red-700',
      'TikTok': 'bg-purple-100 text-purple-700'
    };
    return colors[platform] || 'bg-gray-100 text-gray-700';
  };

  if (loading && leaveRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              <p className="text-xs text-muted-foreground">
                {stats.presentDays} of {stats.totalDays} days
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
              <CardTitle className="text-sm font-medium">Leaves Used</CardTitle>
              <Plane className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leavesUsed}</div>
              <p className="text-xs text-muted-foreground">Days taken this year</p>
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
              <p className="text-xs text-muted-foreground">Currently assigned</p>
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
              <p className="text-xs text-muted-foreground">Scheduled meetings</p>
            </CardContent>
          </Card>
        </motion.div>

        {user?.department === 'Digital Marketing' && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                <Share2 className="h-4 w-4 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
                <p className="text-xs text-muted-foreground">Social media posts</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Upcoming Meetings Preview */}
      {upcomingMeetings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Next Meeting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 w-full sm:w-auto">
                  <div className="text-center min-w-[40px]">
                    <p className="text-lg font-semibold">
                      {new Date(upcomingMeetings[0].date).getDate()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(upcomingMeetings[0].date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{upcomingMeetings[0].title}</h3>
                      <Badge className={upcomingMeetings[0].type === 'common' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                        {upcomingMeetings[0].type === 'common' ? 'All Staff' : upcomingMeetings[0].department}
                      </Badge>
                      {isToday(upcomingMeetings[0].date) && (
                        <Badge className="bg-red-100 text-red-700">Today</Badge>
                      )}
                      {isTomorrow(upcomingMeetings[0].date) && (
                        <Badge className="bg-orange-100 text-orange-700">Tomorrow</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{upcomingMeetings[0].description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(`${upcomingMeetings[0].date}T${upcomingMeetings[0].time}`).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })} ({upcomingMeetings[0].duration} min)
                        </span>
                      </div>
                      {upcomingMeetings[0].meetingLink && (
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          <span>Online Meeting</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
            
              </div>
              {upcomingMeetings.length > 1 && (
                <div className="text-center pt-4">
                  <Button variant="ghost" className="text-blue-600" onClick={() => navigate('/employee/meetings')}>
                    View all {upcomingMeetings.length} upcoming meetings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Attendance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
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
              <div className="space-y-4">
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

                {/* Break Management */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Break Management</h3>
                  {todayAttendance.breaks && Object.entries(todayAttendance.breaks).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Today's Breaks:</h4>
                      <div className="space-y-2">
                        {Object.entries(todayAttendance.breaks).map(([breakId, breakData]) => (
                          <div key={breakId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Break In</p>
                                <p className="font-medium">{breakData.breakIn}</p>
                              </div>
                              {breakData.breakOut ? (
                                <>
                                  <div>
                                    <p className="text-sm text-gray-600">Break Out</p>
                                    <p className="font-medium">{breakData.breakOut}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Duration</p>
                                    <p className="font-medium">{breakData.duration || '--:--'}</p>
                                  </div>
                                </>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-700">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            {!breakData.breakOut && breakId === currentBreakId && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleBreakOut}
                                disabled={breakLoading}
                              >
                                {breakLoading ? "Ending..." : "End Break"}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!todayAttendance.punchOut && (
                    <div className="flex items-center gap-4">
                      {currentBreakId ? (
                        <Button 
                          onClick={handleBreakOut}
                          className="bg-yellow-600 hover:bg-yellow-700"
                          disabled={breakLoading}
                        >
                          {breakLoading ? "Ending Break..." : "End Current Break"}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleBreakIn}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={breakLoading}
                        >
                          {breakLoading ? "Starting..." : "Start New Break"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
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
                      <Clock className="w-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 w-4 mr-2" />
                      Punch In
                    </>
                  )}
                </Button>
              </div>
            )}
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
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
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

      {/* Recent Leaves */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Recent Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No leave requests found
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{request.leaveType}</h3>
                          <Badge className={
                            request.status === 'approved' ? 'bg-green-100 text-green-700' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm text-gray-600">
                          <div>
                            <p className="font-medium">Duration</p>
                            <p>{calculateLeaveDays(request.startDate, request.endDate)} day(s)</p>
                          </div>
                          <div>
                            <p className="font-medium">Start Date</p>
                            <p>{new Date(request.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="font-medium">End Date</p>
                            <p>{new Date(request.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          Applied on: {new Date(request.appliedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {leaveRequests.length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" className="text-blue-600" onClick={() => navigate('/employee/leaves')}>
                      View all {leaveRequests.length} leave requests
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
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
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activities found
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'project' ? 'bg-blue-500' :
                      activity.type === 'attendance' ? 'bg-green-500' :
                      activity.type === 'social_media' ? 'bg-pink-500' : 
                      activity.type === 'break' ? 'bg-yellow-500' : 'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activity.action}</p>
                        {activity.type === 'social_media' && activity.details && (
                          <Badge className={getPlatformColor(activity.details.platform)}>
                            {activity.details.platform}
                          </Badge>
                        )}
                        {activity.type === 'break' && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            Break
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                      {activity.type === 'social_media' && activity.details?.content && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                          <p className="truncate">{activity.details.content}</p>
                          {activity.details.scheduledDate && (
                            <div className="flex items-center gap-1 text-xs mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>Scheduled: {new Date(activity.details.scheduledDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeDashboardHome;