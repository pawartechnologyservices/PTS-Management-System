
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from '../ui/use-toast';
import ProjectForm from './project/ProjectForm';
import ProjectCard from './project/ProjectCard';
import { sendNotificationToEmployee } from './project/ProjectNotificationService';

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  role: string;
  isActive: boolean;
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
  createdAt: string;
  createdBy: string;
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    assignedEmployees: [] as string[],
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'not_started'
  });

  useEffect(() => {
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    setProjects(savedProjects);

    const allUsers = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const employeeUsers = allUsers.filter((user: Employee) => user.role === 'employee' && user.isActive);
    setEmployees(employeeUsers);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
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
          <ProjectForm
            formData={formData}
            setFormData={setFormData}
            employees={employees}
            onSubmit={handleSubmit}
            onCancel={() => setShowAddForm(false)}
          />
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
                <ProjectCard
                  key={project.id}
                  project={project}
                  employees={employees}
                  index={index}
                />
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
