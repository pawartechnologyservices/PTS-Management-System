
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Calendar, Clock, FolderOpen, Camera } from 'lucide-react';
import DashboardCard from './DashboardCard';
import AttendancePopup from './popups/AttendancePopup';
import LeavePopup from './popups/LeavePopup';

const AdminDashboardHome = () => {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
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
      punchIn: index < 2 ? '09:45 AM' : '09:15 AM', // First 2 are late
      date: today,
      status: index < 2 ? 'late' : 'present'
    }));
    setAttendanceData(mockAttendance);

    // Calculate stats
    const activeCount = employeeUsers.filter((emp: any) => emp.isActive).length;
    const todayPresent = mockAttendance.filter(att => att.status === 'present' || att.status === 'late').length;

    setStats({
      totalEmployees: employeeUsers.length,
      activeEmployees: activeCount,
      pendingLeaves: pendingLeaves.length,
      todayPresent,
      ongoingProjects: 5, // Mock data
      digitalMarketingPosts: 3 // Mock data
    });
  };

  const dashboardCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      subtitle: 'All registered employees',
      icon: Users,
      color: 'from-blue-50 to-blue-100 text-blue-700',
      onClick: () => console.log('Show all employees popup')
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      subtitle: 'Currently active workforce',
      icon: UserCheck,
      color: 'from-green-50 to-green-100 text-green-700',
      onClick: () => console.log('Show active employees popup')
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
      onClick: () => console.log('Show projects popup')
    },
    {
      title: 'Digital Marketing Posts',
      value: stats.digitalMarketingPosts,
      subtitle: 'Recent posts',
      icon: Camera,
      color: 'from-pink-50 to-pink-100 text-pink-700',
      onClick: () => console.log('Show marketing posts popup')
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
    </div>
  );
};

export default AdminDashboardHome;
