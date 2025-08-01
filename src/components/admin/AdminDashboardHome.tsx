import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Calendar, Clock, FolderOpen, Camera, Bell, X } from 'lucide-react';
import DashboardCard from './DashboardCard';
import AttendancePopup from './popups/AttendancePopup';
import LeavePopup from './popups/LeavePopup';
import EmployeesPopup from './popups/EmployeesPopup';
import ProjectsPopup from './popups/ProjectsPopup';
import MarketingPostsPopup from './popups/MarketingPostsPopup';
import { ref, onValue, off, query, orderByChild } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employeeId: string;
  isActive: boolean;
  createdAt: string;
  profileImage?: string;
  addedBy?: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  department: string;
  assignedTeamLeader: string;
  assignedEmployees: string[];
  startDate: string;
  endDate: string;
  priority: string;
  status: 'active' | 'completed' | 'paused';
  projectType: string;
  specificDepartment?: string;
  createdAt: string;
  createdBy: string;
  progress: number;
}

interface MarketingPost {
  id: string;
  platform: string;
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  postUrl?: string;
  imageUrl?: string;
  status: string;
  createdBy: string;
  createdByName: string;
  department: string;
  createdAt: string;
  updatedAt: string;
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
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  workMode: 'office' | 'remote' | 'hybrid';
  timestamp: number;
  department?: string;
  hoursWorked?: number;
}

const AdminDashboardHome = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayPresent: 0,
    todayLate: 0,
    todayHalfDay: 0,
    todayOnLeave: 0,
    todayAbsent: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pausedProjects: 0,
    digitalMarketingPosts: 0
  });

  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [showEmployeesPopup, setShowEmployeesPopup] = useState(false);
  const [showActiveEmployeesPopup, setShowActiveEmployeesPopup] = useState(false);
  const [showProjectsPopup, setShowProjectsPopup] = useState(false);
  const [showMarketingPopup, setShowMarketingPopup] = useState(false);

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [activeNotification, setActiveNotification] = useState<{
    post: MarketingPost;
    timer: number;
  } | null>(null);
  const [notificationTimeout, setNotificationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check and request notification permission
  useEffect(() => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Check for posts scheduled for today and upcoming posts
  useEffect(() => {
    if (marketingPosts.length === 0) return;

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    const todayPosts = marketingPosts.filter(post => {
      return (
        post.scheduledDate === todayDateString && 
        post.status === 'scheduled'
      );
    });

    if (todayPosts.length > 0 && notificationPermission === 'granted') {
      showScheduledPostsNotification(todayPosts);
    }

    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      todayPosts.forEach(post => {
        const [hours, minutes] = post.scheduledTime.split(':').map(Number);
        
        if (currentHour === hours && currentMinute === minutes) {
          showCenteredPostNotification(post);
        }
        
        if (
          currentHour === hours && 
          currentMinute === minutes - 15 && 
          notificationPermission === 'granted'
        ) {
          showUpcomingPostNotification(post);
        }
      });
    }, 60000);

    return () => clearInterval(checkInterval);
  }, [marketingPosts, notificationPermission]);

  const showScheduledPostsNotification = (posts: MarketingPost[]) => {
    const notificationOptions = {
      body: `There are ${posts.length} marketing post(s) scheduled for today.`,
      icon: '/notification-icon.png',
      tag: 'today-marketing-posts-notification'
    };

    new Notification('Scheduled Marketing Posts', notificationOptions);
  };

  const showUpcomingPostNotification = (post: MarketingPost) => {
    const notificationOptions = {
      body: `Marketing post scheduled for ${post.scheduledTime}: ${post.content.substring(0, 50)}...`,
      icon: '/notification-icon.png',
      tag: 'upcoming-marketing-post-notification'
    };

    new Notification(`Upcoming ${post.platform} Post`, notificationOptions);
  };

  const showCenteredPostNotification = (post: MarketingPost) => {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      setNotificationTimeout(null);
    }

    setActiveNotification({
      post,
      timer: 10
    });

    const interval = setInterval(() => {
      setActiveNotification(prev => {
        if (prev && prev.timer > 1) {
          return { ...prev, timer: prev.timer - 1 };
        } else {
          clearInterval(interval);
          return null;
        }
      });
    }, 1000);

    const timeout = setTimeout(() => {
      setActiveNotification(null);
    }, 10000);

    setNotificationTimeout(timeout);
  };

  const closeNotification = () => {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      setNotificationTimeout(null);
    }
    setActiveNotification(null);
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

  const requestNotificationPermission = () => {
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Notification permission granted!');
      } else {
        toast.error('You need to allow notifications for this feature');
      }
    });
  };

  useEffect(() => {
    if (!user?.id) return;

    const employeesRef = ref(database, `users/${user.id}/employees`);
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      const employeesData = snapshot.val();
      if (employeesData) {
        const employeesList: Employee[] = Object.entries(employeesData).map(([key, value]) => ({
          id: key,
          ...(value as Omit<Employee, 'id'>),
          isActive: (value as any).status === 'active',
          employeeId: (value as any).employeeId || `EMP-${key.slice(0, 8)}`
        }));
        setEmployees(employeesList);
      } else {
        setEmployees([]);
      }
      setInitialLoadComplete(true);
    }, (error) => {
      console.error('Error fetching employees:', error);
      setInitialLoadComplete(true);
    });

    return () => {
      off(employeesRef);
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const projectsRef = ref(database, `users/${user.id}/projects`);
    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectsData: Project[] = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as Omit<Project, 'id'>),
          status: (value as any).status || 'active',
          progress: (value as any).progress || 0
        }));
        setProjects(projectsData);
      } else {
        setProjects([]);
      }
    }, (error) => {
      console.error('Error fetching projects:', error);
    });

    return () => {
      off(projectsRef);
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id || employees.length === 0) return;

    const allLeaveRequests: LeaveRequest[] = [];
    const leaveUnsubscribes: (() => void)[] = [];

    employees.forEach(employee => {
      const leavesRef = ref(database, `users/${user.id}/employees/${employee.id}/leaves`);
      const leavesQuery = query(leavesRef, orderByChild('appliedAt'));
      
      const unsubscribe = onValue(leavesQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const requests: LeaveRequest[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            employeeId: employee.id,
            employeeName: employee.name,
            employeeEmail: employee.email,
            department: employee.department || 'No Department',
            ...(value as Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'employeeEmail' | 'department'>)
          }));
          
          const existingRequests = allLeaveRequests.filter(r => r.employeeId !== employee.id);
          allLeaveRequests.splice(0, allLeaveRequests.length, ...existingRequests, ...requests);
          setLeaveRequests([...allLeaveRequests].sort((a, b) => 
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          ));
        } else {
          const updatedRequests = allLeaveRequests.filter(r => r.employeeId !== employee.id);
          allLeaveRequests.splice(0, allLeaveRequests.length, ...updatedRequests);
          setLeaveRequests([...allLeaveRequests]);
        }
      });

      leaveUnsubscribes.push(unsubscribe);
    });

    const allAttendanceRecords: AttendanceRecord[] = [];
    const attendanceUnsubscribes: (() => void)[] = [];

    employees.forEach(employee => {
      const attendanceRef = ref(database, `users/${user.id}/employees/${employee.id}/punching`);
      const attendanceQuery = query(attendanceRef, orderByChild('timestamp'));
      
      const unsubscribe = onValue(attendanceQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => {
            // Calculate hours worked for half-day status
            let hoursWorked = 0;
            if (value.punchIn && value.punchOut) {
              const punchInTime = new Date(`1970-01-01T${value.punchIn}`);
              const punchOutTime = new Date(`1970-01-01T${value.punchOut}`);
              hoursWorked = (punchOutTime.getTime() - punchInTime.getTime()) / (1000 * 60 * 60);
            }

            return {
              id: key,
              employeeId: employee.id,
              employeeName: employee.name,
              department: employee.department,
              ...(value as Omit<AttendanceRecord, 'id' | 'employeeId' | 'employeeName' | 'department'>),
              status: value?.status || 'absent',
              workMode: value?.workMode || 'office',
              hoursWorked
            };
          });
          
          const existingRecords = allAttendanceRecords.filter(r => r.employeeId !== employee.id);
          allAttendanceRecords.splice(0, allAttendanceRecords.length, ...existingRecords, ...records);
          setAttendanceRecords([...allAttendanceRecords].sort((a, b) => b.timestamp - a.timestamp));
        } else {
          const updatedRecords = allAttendanceRecords.filter(r => r.employeeId !== employee.id);
          allAttendanceRecords.splice(0, allAttendanceRecords.length, ...updatedRecords);
          setAttendanceRecords([...allAttendanceRecords]);
        }
      });

      attendanceUnsubscribes.push(unsubscribe);
    });

    return () => {
      leaveUnsubscribes.forEach(unsubscribe => unsubscribe());
      attendanceUnsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, employees]);

  useEffect(() => {
    if (!user?.id) return;

    const digitalMarketingEmployees = employees.filter(emp => emp.department === 'Digital Marketing');
    
    const allMarketingPosts: MarketingPost[] = [];
    const marketingUnsubscribes: (() => void)[] = [];

    digitalMarketingEmployees.forEach(employee => {
      const postsRef = ref(database, `users/${user.id}/employees/${employee.id}/socialmedia`);
      const postsQuery = query(postsRef, orderByChild('createdAt'));
      
      const unsubscribe = onValue(postsQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const posts: MarketingPost[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<MarketingPost, 'id'>)
          }));
          
          const existingPosts = allMarketingPosts.filter(p => 
            !posts.some(newPost => newPost.id === p.id)
          );
          allMarketingPosts.splice(0, allMarketingPosts.length, ...existingPosts, ...posts);
          setMarketingPosts([...allMarketingPosts].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        } else {
          setMarketingPosts(prev => prev.filter(p => 
            !digitalMarketingEmployees.some(emp => emp.id === p.createdBy)
          ));
        }
      });

      marketingUnsubscribes.push(unsubscribe);
    });

    return () => {
      marketingUnsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, employees]);

  useEffect(() => {
    if (employees.length > 0 || projects.length > 0 || marketingPosts.length > 0) {
      const activeCount = employees.filter(emp => emp.isActive).length;
      const today = new Date().toISOString().split('T')[0];
      
      const todayAttendance = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === today;
      });

      // Calculate various attendance statuses
      const todayPresent = todayAttendance.filter(a => a.status === 'present').length;
      const todayLate = todayAttendance.filter(a => a.status === 'late').length;
      const todayHalfDay = todayAttendance.filter(a => a.status === 'half-day' || 
        (a.hoursWorked && a.hoursWorked < 4)).length; // Also count <4 hours as half-day
      const todayOnLeave = todayAttendance.filter(a => a.status === 'on-leave').length;
      const todayAbsent = activeCount - (todayPresent + todayLate + todayHalfDay + todayOnLeave);

      const pendingLeaves = leaveRequests.filter(request => 
        request.status === 'pending'
      ).length;

      const activeProjects = projects.filter(project => 
        project.status === 'active'
      ).length;

      const completedProjects = projects.filter(project => 
        project.status === 'completed'
      ).length;

      const pausedProjects = projects.filter(project => 
        project.status === 'paused'
      ).length;

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeCount,
        pendingLeaves,
        todayPresent,
        todayLate,
        todayHalfDay,
        todayOnLeave,
        todayAbsent,
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        pausedProjects,
        digitalMarketingPosts: marketingPosts.length
      });
    }
  }, [employees, leaveRequests, attendanceRecords, projects, marketingPosts]);

  const dashboardCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      subtitle: 'All registered employees',
      icon: Users,
      color: 'from-blue-50 to-blue-100 text-blue-700',
      onClick: () => setShowEmployeesPopup(true)
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      subtitle: 'Currently active workforce',
      icon: UserCheck,
      color: 'from-green-50 to-green-100 text-green-700',
      onClick: () => setShowActiveEmployeesPopup(true)
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      subtitle: 'Awaiting approval',
      icon: Calendar,
      color: 'from-orange-50 to-orange-100 text-orange-700',
      onClick: () => setShowLeavePopup(true)
    },
    {
      title: 'Today\'s Attendance',
      value: `${stats.todayPresent + stats.todayLate + stats.todayHalfDay}/${stats.activeEmployees}`,
      subtitle: `Present: ${stats.todayPresent} | Late: ${stats.todayLate} | Half-day: ${stats.todayHalfDay} | On Leave: ${stats.todayOnLeave} | Absent: ${stats.todayAbsent}`,
      icon: Clock,
      color: 'from-purple-50 to-purple-100 text-purple-700',
      onClick: () => setShowAttendancePopup(true)
    },
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      subtitle: `Active: ${stats.activeProjects} | Completed: ${stats.completedProjects} | Paused: ${stats.pausedProjects}`,
      icon: FolderOpen,
      color: 'from-indigo-50 to-indigo-100 text-indigo-700',
      onClick: () => setShowProjectsPopup(true)
    },
    {
      title: 'Marketing Posts',
      value: stats.digitalMarketingPosts,
      subtitle: 'Scheduled posts',
      icon: Camera,
      color: 'from-pink-50 to-pink-100 text-pink-700',
      onClick: () => setShowMarketingPopup(true)
    }
  ];

  return (
    <div className="space-y-6 relative">
      {/* Centered Notification Popup */}
      {activeNotification && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
          >
            <button
              onClick={closeNotification}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${getPlatformColor(activeNotification.post.platform)}`}>
                <Camera className="h-6 w-6" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">
                    {activeNotification.post.platform} Post Due Now
                  </h3>
                  <div className="bg-gray-100 px-2 py-1 rounded-full text-sm font-medium">
                    {activeNotification.timer}s
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{activeNotification.post.content}</p>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Scheduled for {activeNotification.post.scheduledTime} by {activeNotification.post.createdByName}
                  </span>
                </div>
                
                {activeNotification.post.postUrl && (
                  <div className="mt-3">
                    <a
                      href={activeNotification.post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <Bell className="h-4 w-4" />
                      View Post Link
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Interactive overview of your organization's workforce and activities</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
            onClick={card.onClick}
            delay={index * 0.1}
          />
        ))}
      </div>

      <AttendancePopup
        isOpen={showAttendancePopup}
        onClose={() => setShowAttendancePopup(false)}
        attendanceData={attendanceRecords.filter(record => {
          const today = new Date().toISOString().split('T')[0];
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          return recordDate === today;
        })}
      />

      <LeavePopup
        isOpen={showLeavePopup}
        onClose={() => setShowLeavePopup(false)}
        leaveRequests={leaveRequests.filter(request => request.status === 'pending')}
      />

      <EmployeesPopup
        isOpen={showEmployeesPopup}
        onClose={() => setShowEmployeesPopup(false)}
        employees={employees}
        title="All Employees"
      />

      <EmployeesPopup
        isOpen={showActiveEmployeesPopup}
        onClose={() => setShowActiveEmployeesPopup(false)}
        employees={employees.filter(emp => emp.isActive)}
        title="Active Employees"
      />

      <ProjectsPopup
        isOpen={showProjectsPopup}
        onClose={() => setShowProjectsPopup(false)}
        projects={projects}
      />

      <MarketingPostsPopup
        isOpen={showMarketingPopup}
        onClose={() => setShowMarketingPopup(false)}
        posts={marketingPosts}
      />
    </div>
  );
};

export default AdminDashboardHome;