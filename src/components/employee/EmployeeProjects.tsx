
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Calendar, Target, Upload, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../ui/use-toast';

const EmployeeProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [updateNote, setUpdateNote] = useState('');

  useEffect(() => {
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    // Filter projects assigned to current user or their department
    const userProjects = allProjects.filter(project => 
      project.assignedTo === user?.email || 
      project.department === user?.department
    );
    setProjects(userProjects);
  }, [user]);

  const updateProjectProgress = (projectId, newProgress, note) => {
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const updatedProjects = allProjects.map(project => {
      if (project.id === projectId) {
        const updates = {
          ...project,
          progress: newProgress,
          lastUpdated: new Date().toISOString(),
          updates: [
            ...(project.updates || []),
            {
              id: Date.now().toString(),
              note,
              progress: newProgress,
              updatedBy: user?.name,
              updatedAt: new Date().toISOString()
            }
          ]
        };
        
        // Auto-update status based on progress
        if (newProgress === 100) {
          updates.status = 'completed';
        } else if (newProgress > 0) {
          updates.status = 'in_progress';
        }
        
        return updates;
      }
      return project;
    });
    
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    
    // Update local state
    const userProjects = updatedProjects.filter(project => 
      project.assignedTo === user?.email || 
      project.department === user?.department
    );
    setProjects(userProjects);
    
    toast({
      title: "Project Updated",
      description: "Project progress has been updated successfully."
    });
    
    setSelectedProject(null);
    setUpdateNote('');
  };

  const handleProgressUpdate = (project) => {
    if (!updateNote.trim()) {
      toast({
        title: "Update Required",
        description: "Please provide an update note.",
        variant: "destructive"
      });
      return;
    }
    
    // For demo, increment progress by 10%
    const newProgress = Math.min(project.progress + 10, 100);
    updateProjectProgress(project.id, newProgress, updateNote);
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

  const getProjectStats = () => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const notStarted = projects.filter(p => p.status === 'not_started').length;
    
    return { total, completed, inProgress, notStarted };
  };

  const stats = getProjectStats();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Projects</h1>
          <p className="text-gray-600">View and update your assigned projects</p>
        </div>
      </motion.div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-green-600">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Not Started</p>
                  <p className="text-xl font-bold text-gray-600">{stats.notStarted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Projects List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              My Projects ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                          <Badge className={getStatusColor(project.status)} variant="outline">
                            {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{project.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>Department: {project.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-600">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    {/* Update Section */}
                    {selectedProject === project.id ? (
                      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                        <Textarea
                          placeholder="Provide an update on your progress..."
                          value={updateNote}
                          onChange={(e) => setUpdateNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleProgressUpdate(project)} size="sm">
                            <Upload className="h-3 w-3 mr-1" />
                            Update Progress
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProject(null);
                              setUpdateNote('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {project.lastUpdated && (
                            <span>Last updated: {new Date(project.lastUpdated).toLocaleDateString()}</span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedProject(project.id)}
                          disabled={project.status === 'completed'}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Add Update
                        </Button>
                      </div>
                    )}
                    
                    {/* Recent Updates */}
                    {project.updates && project.updates.length > 0 && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium mb-2">Recent Updates</h4>
                        <div className="space-y-2">
                          {project.updates.slice(-2).map((update) => (
                            <div key={update.id} className="text-xs bg-blue-50 p-2 rounded">
                              <p className="text-gray-700">{update.note}</p>
                              <p className="text-gray-500 mt-1">
                                {update.updatedBy} • {new Date(update.updatedAt).toLocaleDateString()} • Progress: {update.progress}%
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No projects assigned to you yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeProjects;
