import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import PTSLogo from '../../../src/assets/PTS.png'; // Make sure this path is correct
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  FolderOpen,
  Plane,
  CreditCard,
  FileText,
  Receipt,
  Settings,
  X,
  MessageCircle
} from 'lucide-react';
import { Button } from '../ui/button';

interface AdminSidebarProps {
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose }) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/' },
    { icon: Users, label: 'Employee Management', path: '/admin/employees' },
    { icon: Clock, label: 'Attendance Management', path: '/admin/attendance' },
    { icon: Calendar, label: 'Meetings', path: '/admin/meetings' },
    { icon: FolderOpen, label: 'Projects', path: '/admin/projects' },
    { icon: Plane, label: 'Leaves', path: '/admin/leaves' },
    { icon: MessageCircle, label: 'Chat', path: '/admin/chat' },
    { icon: CreditCard, label: 'Salary Management', path: '/admin/salary' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: Receipt, label: 'Expenses Management', path: '/admin/expenses' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <img src={PTSLogo} alt="PTS Logo" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Management System</h2>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.li
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2025 PTS System
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
