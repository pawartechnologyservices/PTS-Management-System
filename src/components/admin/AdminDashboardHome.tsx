
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Calendar, Clock, FolderOpen, Camera } from 'lucide-react';
import DashboardCard from './DashboardCard';
import AttendancePopup from './popups/AttendancePopup';
import LeavePopup from './popups/LeavePopup';
import EmployeesPopup from './popups/EmployeesPopup';
import ProjectsPopup from './popups/ProjectsPopup';
import MarketingPostsPopup from './popups/MarketingPostsPopup';

const AdminDashboardHome = () => {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [marketingPosts, setMarketingPosts] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayPresent: 0,
    ongoingProjects: 0,
    digitalMarketingPosts: 0
  });

  // Popup states
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [showEmployeesPopup, setShowEmployeesPopup] = useState(false);
  const [showActiveEmployeesPopup, setShowActiveEmployeesPopup] = useState(false);
  const [showProjectsPopup, setShowProjectsPopup] = useState(false);
  const [showMarketingPopup, setShowMarketingPopup] = useState(false);

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
    const pendingLeaves = leaves.filter((leave: any) => leave.status === 'pending');
    setLeaveRequests(pendingLeaves);

    // Load attendance data (mock data for today)
    const today = new Date().toISOString().split('T')[0];
    const mockAttendance = employeeUsers.map((emp: any, index: number) => ({
      id: `att_${emp.id}`,
      employeeName: emp.name,
      department: emp.department,
      punchIn: index < 2 ? '09:45 AM' : '09:15 AM',
      date: today,
      status: index < 2 ? 'late' : 'present'
    }));
    setAttendanceData(mockAttendance);

    // Mock projects data
    const mockProjects = [
      {
        id: 'proj_1',
        title: 'Website Redesign',
        description: 'Complete redesign of company website with modern UI/UX',
        startDate: '2024-01-15',
        endDate: '2024-03-15',
        department: 'IT',
        assignedEmployees: ['emp_1', 'emp_2'],
        status: 'active',
        progress: 65
      },
      {
        id: 'proj_2',
        title: 'Marketing Campaign Q1',
        description: 'Digital marketing campaign for Q1 product launch',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        department: 'Marketing',
        assignedEmployees: ['emp_3', 'emp_4'],
        status: 'active',
        progress: 40
      },
      {
        id: 'proj_3',
        title: 'HR Process Automation',
        description: 'Automate HR processes using new PTS system',
        startDate: '2024-02-01',
        endDate: '2024-04-30',
        department: 'HR',
        assignedEmployees: ['emp_5'],
        status: 'active',
        progress: 25
      }
    ];
    setProjects(mockProjects);

    // Mock marketing posts data
    const mockMarketingPosts = [
      {
        id: 'post_1',
        title: 'New Product Launch',
        content: 'Excited to announce our latest product innovation! Check out the amazing features...',
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
        content: 'Congratulations to our development team for achieving this milestone!',
        platform: 'LinkedIn',
        postedAt: '2024-01-19T14:15:00Z',
        likes: 156,
        comments: 23,
        shares: 8,
        status: 'published'
      },
      {
        id: 'post_3',
        title: 'Behind the Scenes',
        content: 'Take a look at how our creative team works their magic...',
        platform: 'Instagram',
        postedAt: '2024-01-18T16:45:00Z',
        likes: 387,
        comments: 45,
        shares: 21,
        status: 'published'
      }
    ];
    setMarketingPosts(mockMarketingPosts);

    // Calculate stats
    const activeCount = employeeUsers.filter((emp: any) => emp.isActive).length;
    const todayPresent = mockAttendance.filter(att => att.status === 'present' || att.status === 'late').length;
    const ongoingProjects = mockProjects.filter(proj => proj.status === 'active').length;

    setStats({
      totalEmployees: employeeUsers.length,
      activeEmployees: activeCount,
      pendingLeaves: pendingLeaves.length,
      todayPresent,
      ongoingProjects,
      digitalMarketingPosts: mockMarketingPosts.length
    });
  };

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
      title: 'Total Attendance',
      value: `${stats.todayPresent}/${stats.activeEmployees}`,
      subtitle: 'Present today',
      icon: Clock,
      color: 'from-purple-50 to-purple-100 text-purple-700',
      onClick: () => setShowAttendancePopup(true)
    },
    {
      title: 'Ongoing Projects',
      value: stats.ongoingProjects,
      subtitle: 'Active projects',
      icon: FolderOpen,
      color: 'from-indigo-50 to-indigo-100 text-indigo-700',
      onClick: () => setShowProjectsPopup(true)
    },
    {
      title: 'Digital Marketing Posts',
      value: stats.digitalMarketingPosts,
      subtitle: 'Recent posts',
      icon: Camera,
      color: 'from-pink-50 to-pink-100 text-pink-700',
      onClick: () => setShowMarketingPopup(true)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Interactive overview of your organization's workforce and activities</p>
      </motion.div>

      {/* Interactive Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => (
          <DashboardCard
            key={card.title}
            {...card}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Popups */}
      <AttendancePopup
        isOpen={showAttendancePopup}
        onClose={() => setShowAttendancePopup(false)}
        attendanceData={attendanceData}
      />

      <LeavePopup
        isOpen={showLeavePopup}
        onClose={() => setShowLeavePopup(false)}
        leaveRequests={leaveRequests}
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
