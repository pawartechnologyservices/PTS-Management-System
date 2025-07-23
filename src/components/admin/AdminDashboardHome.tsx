import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Calendar, Clock, FolderOpen, Camera } from 'lucide-react';
import DashboardCard from './DashboardCard';
import AttendancePopup from './popups/AttendancePopup';
import LeavePopup from './popups/LeavePopup';
import EmployeesPopup from './popups/EmployeesPopup';
import ProjectsPopup from './popups/ProjectsPopup';
import MarketingPostsPopup from './popups/MarketingPostsPopup';
import { ref, onValue, off, query, orderByChild } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

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
  title: string;
  content: string;
  platform: string;
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
  status: string;
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
  status: string;
  workMode: string;
  timestamp: number;
  department?: string;
}

const AdminDashboardHome = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayPresent: 0,
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

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
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
    }, (error) => {
      console.error('Error fetching employees:', error);
      setLoading(false);
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
          const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            employeeId: employee.id,
            employeeName: employee.name,
            department: employee.department,
            ...(value as Omit<AttendanceRecord, 'id' | 'employeeId' | 'employeeName' | 'department'>)
          }));
          
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
    if (employees.length > 0) {
      const activeCount = employees.filter(emp => emp.isActive).length;
      const today = new Date().toISOString().split('T')[0];
      
      const todayAttendance = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === today && (record.status === 'present' || record.status === 'late');
      }).length;

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

      setStats(prev => ({
        ...prev,
        totalEmployees: employees.length,
        activeEmployees: activeCount,
        pendingLeaves,
        todayPresent: todayAttendance,
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        pausedProjects,
        digitalMarketingPosts: prev.digitalMarketingPosts
      }));

      const mockMarketingPosts: MarketingPost[] = [
        {
          id: 'post_1',
          title: 'New Product Launch',
          content: 'Excited to announce our latest product innovation!',
          platform: 'Facebook',
          postedAt: '2024-01-20T10:30:00Z',
          likes: 245,
          comments: 18,
          shares: 12,
          status: 'published'
        },
        {
          id: 'post_2',
          title: 'Team Achievement',
          content: 'Congratulations to our development team!',
          platform: 'LinkedIn',
          postedAt: '2024-01-19T14:15:00Z',
          likes: 156,
          comments: 23,
          shares: 8,
          status: 'published'
        }
      ];
      setMarketingPosts(mockMarketingPosts);
      setStats(prev => ({ ...prev, digitalMarketingPosts: mockMarketingPosts.length }));
    }
  }, [employees, leaveRequests, attendanceRecords, projects]);

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
      value: `${stats.todayPresent}/${stats.activeEmployees}`,
      subtitle: 'Present today',
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
      subtitle: 'Recent posts',
      icon: Camera,
      color: 'from-pink-50 to-pink-100 text-pink-700',
      onClick: () => setShowMarketingPopup(true)
    }
  ];

  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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