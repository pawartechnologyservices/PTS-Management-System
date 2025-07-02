
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Target, Bell } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  department: string;
  assignedEmployees: string[];
  startDate: string;
  endDate: string;
  priority: string;
  status: string;
  progress: number;
}

interface ProjectCardProps {
  project: Project;
  employees: Employee[];
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, employees, index }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAssignedEmployeeNames = (assignedEmployeeIds: string[]) => {
    return assignedEmployeeIds
      .map(id => employees.find(emp => emp.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold truncate">{project.name}</h3>
          <Badge className={getPriorityColor(project.priority)}>
            {project.priority}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
        
        <div className="space-y-2">
          <Badge className={getStatusColor(project.status)} variant="outline">
            {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.replace('_', ' ').slice(1)}
          </Badge>
          
          <div className="text-xs text-gray-500">
            <div className="flex items-center gap-1 mb-1">
              <Users className="h-3 w-3" />
              {project.department}
            </div>
            <div className="flex items-center gap-1 mb-1">
              <Target className="h-3 w-3" />
              <span className="truncate">
                {getAssignedEmployeeNames(project.assignedEmployees) || 'No assignments'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          {project.assignedEmployees && project.assignedEmployees.length > 0 && (
            <div className="text-xs text-blue-600">
              <Bell className="h-3 w-3 inline mr-1" />
              Assigned to {project.assignedEmployees.length} employee(s)
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
