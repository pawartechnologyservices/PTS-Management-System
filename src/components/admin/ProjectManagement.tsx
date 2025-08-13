import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Plus, List, Grid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from '../ui/use-toast';
import EnhancedProjectForm from './project/EnhancedProjectForm';
import ProjectCard from './project/ProjectCard';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/badge';

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
  status: string;
  projectType: string;
  specificDepartment?: string;
  createdAt: string;
  createdBy: string;
}

const ProjectManagement = () => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!user) return;

    const fetchProjects = () => {
      try {
        setLoading(true);
        setError(null);

        const projectsRef = ref(database, `users/${user.id}/projects`);
        
        const unsubscribe = onValue(projectsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const projectsData: Project[] = Object.entries(data).map(([key, value]) => ({
              id: key,
              ...(value as Omit<Project, 'id'>)
            }));
            setProjects(projectsData);
          } else {
            setProjects([]);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching projects:', error);
          setError('Failed to load projects');
          setLoading(false);
        });

        return () => off(projectsRef);
      } catch (err) {
        console.error('Error in fetchProjects:', err);
        setError('Failed to load projects');
        setLoading(false);
        return () => {};
      }
    };

    return fetchProjects();
  }, [user]);

  const handleProjectCreated = () => {
    setShowAddForm(false);
    toast({
      title: "Project Created",
      description: "Your new project has been created successfully",
    });
  };

  const handleProjectEdit = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    toast({
      title: "Project Updated",
      description: "Project has been updated successfully",
    });
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast({
      title: "Project Deleted",
      description: "Project has been deleted successfully",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Project Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Create and manage your projects</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup 
            type="single" 
            value={viewMode}
            onValueChange={(value: 'grid' | 'list') => {
              if (value) setViewMode(value);
            }}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <ToggleGroupItem value="grid" aria-label="Toggle grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Toggle list view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex-shrink-0"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </motion.div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <EnhancedProjectForm 
            onSuccess={handleProjectCreated}
            onCancel={() => setShowAddForm(false)}
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <Card className="w-full">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FolderOpen className="h-5 w-5" />
              <span>Projects ({projects.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs sm:text-sm">
                {projects.filter(p => p.status === 'completed').length} Completed
              </Badge>
              <Badge variant="outline" className="text-xs sm:text-sm">
                {projects.filter(p => p.status === 'in_progress').length} In Progress
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    projectId={project.id}
                    index={index}
                    onEdit={handleProjectEdit}
                    onDelete={handleProjectDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    projectId={project.id}
                    index={index}
                    onEdit={handleProjectEdit}
                    onDelete={handleProjectDelete}
                  />
                ))}
              </div>
            )}
            {projects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="h-10 w-10 mx-auto text-gray-300" />
                <p className="mt-2 text-sm sm:text-base">No projects created yet</p>
                <Button 
                  onClick={() => setShowAddForm(true)} 
                  className="mt-4"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProjectManagement;