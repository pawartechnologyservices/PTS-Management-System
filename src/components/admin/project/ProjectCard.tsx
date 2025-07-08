
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from '../../ui/use-toast';
import { Project } from '../../../types/project';

interface ProjectCardProps {
  project: Project;
  employees: any[];
  index: number;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, employees, index, onEdit, onDelete }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: project.name,
    description: project.description,
    priority: project.priority,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'not_started': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleEdit = () => {
    const updatedProject = {
      ...project,
      ...editData,
      priority: editData.priority as 'low' | 'medium' | 'high' | 'urgent',
      status: editData.status as 'not_started' | 'in_progress' | 'on_hold' | 'completed',
      lastUpdated: new Date().toISOString()
    };
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const updatedProjects = projects.map((p: Project) => 
      p.id === project.id ? updatedProject : p
    );
    
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    
    if (onEdit) {
      onEdit(updatedProject);
    }
    
    setIsEditOpen(false);
    toast({
      title: "Project Updated",
      description: "Project has been updated successfully"
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const updatedProjects = projects.filter((p: Project) => p.id !== project.id);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      
      if (onDelete) {
        onDelete(project.id);
      }
      
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully"
      });
    }
  };

  const assignedEmployeesNames = project.assignedEmployees
    .map(empId => employees.find(emp => emp.id === empId)?.name)
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {project.name}
            </CardTitle>
            <div className="flex gap-1">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Project Name"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                    />
                    <Textarea
                      placeholder="Description"
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={editData.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setEditData({...editData, priority: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={editData.status} onValueChange={(value: 'not_started' | 'in_progress' | 'on_hold' | 'completed') => setEditData({...editData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={editData.startDate}
                        onChange={(e) => setEditData({...editData, startDate: e.target.value})}
                      />
                      <Input
                        type="date"
                        value={editData.endDate}
                        onChange={(e) => setEditData({...editData, endDate: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleEdit} className="flex-1">Save</Button>
                      <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority}
            </Badge>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.description}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{new Date(project.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{new Date(project.endDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <div className="flex flex-wrap gap-1">
              {assignedEmployeesNames.slice(0, 3).map((name, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {name}
                </Badge>
              ))}
              {assignedEmployeesNames.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{assignedEmployeesNames.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {project.tasks.filter(task => task.status === 'completed').length} / {project.tasks.length} tasks completed
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
