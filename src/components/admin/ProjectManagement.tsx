
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from '../ui/use-toast';
import EnhancedProjectForm from './project/EnhancedProjectForm';
import ProjectCard from './project/ProjectCard';
import { useEnhancedProjectManagement } from '../../hooks/useEnhancedProjectManagement';

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  role: string;
  isActive: boolean;
}

const ProjectManagement = () => {
  const { projects, employees, addProject } = useEnhancedProjectManagement();
  const [showAddForm, setShowAddForm] = useState(false);
  const [localProjects, setLocalProjects] = useState(projects);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    assignedTeamLeader: '',
    assignedEmployees: [] as string[],
    tasks: [] as any[],
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'not_started'
  });

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.assignedEmployees.length === 0 && !formData.assignedTeamLeader) {
      toast({
        title: "Error",
        description: "Please assign at least a team leader or employee to the project.",
        variant: "destructive"
      });
      return;
    }

    addProject(formData);
    
    setFormData({
      name: '',
      description: '',
      department: '',
      assignedTeamLeader: '',
      assignedEmployees: [],
      tasks: [],
      startDate: '',
      endDate: '',
      priority: 'medium',
      status: 'not_started'
    });
    setShowAddForm(false);
  };

  const handleEdit = (updatedProject: any) => {
    setLocalProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const handleDelete = (projectId: string) => {
    setLocalProjects(prev => prev.filter(p => p.id !== projectId));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Enhanced Project Management</h1>
          <p className="text-gray-600">Create and manage projects with team leaders and task assignments</p>
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
          <EnhancedProjectForm
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
              Projects ({localProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  employees={employees}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {localProjects.length === 0 && (
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
