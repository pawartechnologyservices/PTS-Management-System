import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { format } from 'date-fns';

interface ProjectListItemProps {
  project: any;
  employees: any[];
  index: number;
  onEdit: (project: any) => void;
  onDelete: (projectId: string) => void;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({
  project,
  employees,
  index,
  onEdit,
  onDelete
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const teamLeader = employees.find(emp => emp.id === project.assignedTeamLeader);
  const assignedEmployees = employees.filter(emp => project.assignedEmployees.includes(emp.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{project.name}</h3>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority}
            </Badge>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-gray-600 text-sm">{project.description}</p>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Team Leader:</span>
            {teamLeader ? (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={teamLeader?.image} />
                  <AvatarFallback>{teamLeader?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{teamLeader.name}</span>
              </div>
            ) : (
              <span className="text-gray-400">Not assigned</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Team Members:</span>
            {assignedEmployees.length > 0 ? (
              <div className="flex items-center -space-x-2">
                {assignedEmployees.slice(0, 3).map(emp => (
                  <Avatar key={emp.id} className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={emp?.image} />
                    <AvatarFallback>{emp?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {assignedEmployees.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                    +{assignedEmployees.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">No members</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <span>Start:</span>
              <span className="text-gray-700">
                {format(new Date(project.startDate), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <span>End:</span>
              <span className="text-gray-700">
                {format(new Date(project.endDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(project)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectListItem;