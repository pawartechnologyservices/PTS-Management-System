import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Plus, List, Grid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from '../../ui/use-toast';
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
  };

  const handleProjectEdit = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Project Management</h1>
          <p className="text-gray-600">Create and manage your projects</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup 
            type="single" 
            value={viewMode}
            onValueChange={(value: 'grid' | 'list') => {
              if (value) setViewMode(value);
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="grid" aria-label="Toggle grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Toggle list view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </motion.div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects ({projects.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {projects.filter(p => p.status === 'completed').length} Completed
              </Badge>
              <Badge variant="outline" className="text-sm">
                {projects.filter(p => p.status === 'in_progress').length} In Progress
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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