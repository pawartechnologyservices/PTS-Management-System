
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Plus, Users, Calendar, Target, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { toast } from '../ui/use-toast';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    assignedEmployees: [],
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'not_started'
  });

  const departments = ['Software', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['not_started', 'in_progress', 'on_hold', 'completed'];

  useEffect(() => {
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    setProjects(savedProjects);

    const allUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const employeeUsers = allUsers.filter(user => user.role === 'employee' && user.isActive);
    setEmployees(employeeUsers);
  }, []);

  const sendNotificationToEmployee = (employee, project) => {
    // Create notification for employee
    const notification = {
      id: Date.now().toString(),
      type: 'project_assigned',
      title: 'New Project Assigned',
      message: `You have been assigned to project: ${project.name}`,
      projectId: project.id,
      employeeId: employee.id,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Save notification to localStorage (in real app, this would be sent to backend)
    const existingNotifications = JSON.parse(localStorage.getItem(`notifications_${employee.id}`) || '[]');
    existingNotifications.push(notification);
    localStorage.setItem(`notifications_${employee.id}`, JSON.stringify(existingNotifications));

    console.log(`Notification sent to ${employee.name} for project ${project.name}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.assignedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Please assign at least one employee to the project.",
        variant: "destructive"
      });
      return;
    }

    const newProject = {
      id: Date.now().toString(),
      ...formData,
      progress: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'admin' // In real app, get from auth context
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    
    // Send notifications to assigned employees
    formData.assignedEmployees.forEach(employeeId => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        sendNotificationToEmployee(employee, newProject);
      }
    });

    toast({
      title: "Project Created",
      description: `Project "${newProject.name}" has been created and assigned to ${formData.assignedEmployees.length} employee(s).`
    });
    
    setFormData({
      name: '',
      description: '',
      department: '',
      assignedEmployees: [],
      startDate: '',
      endDate: '',
      priority: 'medium',
      status: 'not_started'
    });
    setShowAddForm(false);
  };

  const handleEmployeeAssignment = (employeeId, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        assignedEmployees: [...formData.assignedEmployees, employeeId]
      });
    } else {
      setFormData({
        ...formData,
        assignedEmployees: formData.assignedEmployees.filter(id => id !== employeeId)
      });
    }
  };

  const getAssignedEmployeeNames = (assignedEmployeeIds) => {
    return assignedEmployeeIds
      .map(id => employees.find(emp => emp.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Project Management</h1>
          <p className="text-gray-600">Create and manage company projects</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </motion.div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Project Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  placeholder="Project Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />

                <div>
                  <label className="text-sm font-medium mb-2 block">Assign Team Members</label>
                  <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                    {employees.length === 0 ? (
                      <p className="text-gray-500 text-sm">No active employees available</p>
                    ) : (
                      <div className="space-y-2">
                        {employees.map(employee => (
                          <div key={employee.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={employee.id}
                              checked={formData.assignedEmployees.includes(employee.id)}
                              onCheckedChange={(checked) => handleEmployeeAssignment(employee.id, checked)}
                            />
                            <label 
                              htmlFor={employee.id} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {employee.name} - {employee.department} ({employee.designation})
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.assignedEmployees.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {formData.assignedEmployees.length} employee(s) selected
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Start Date</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">End Date</label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <Bell className="h-4 w-4 mr-2" />
                    Create & Assign Project
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
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
              ))}
            </div>
            {projects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No projects created yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProjectManagement;
