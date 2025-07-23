import React, { useState} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { FolderOpen, Calendar, Users, CheckCircle, PauseCircle, PlayCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  department: string;
  assignedEmployees: string[];
  status: 'active' | 'completed' | 'paused';
  progress: number;
}

interface ProjectsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

const ProjectsPopup: React.FC<ProjectsPopupProps> = ({
  isOpen,
  onClose,
  projects
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'paused'>('all');

  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(project => project.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <PauseCircle className="h-4 w-4" />;
      default: return <FolderOpen className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Projects Overview ({projects.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex space-x-2 mb-4">
          <Button 
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveTab('all')}
            className="flex items-center gap-1"
          >
            All ({projects.length})
          </Button>
          <Button 
            variant={activeTab === 'active' ? 'default' : 'outline'}
            onClick={() => setActiveTab('active')}
            className="flex items-center gap-1"
          >
            <PlayCircle className="h-4 w-4" />
            Active ({projects.filter(p => p.status === 'active').length})
          </Button>
          <Button 
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            onClick={() => setActiveTab('completed')}
            className="flex items-center gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            Completed ({projects.filter(p => p.status === 'completed').length})
          </Button>
          <Button 
            variant={activeTab === 'paused' ? 'default' : 'outline'}
            onClick={() => setActiveTab('paused')}
            className="flex items-center gap-1"
          >
            <PauseCircle className="h-4 w-4" />
            Paused ({projects.filter(p => p.status === 'paused').length})
          </Button>
        </div>
        
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <Badge className={getStatusColor(project.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(project.status)}
                        {project.status}
                      </div>
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{project.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{project.assignedEmployees.length} team members</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* <Button
                  onClick={() => console.log('View project details:', project.id)}
                  className="ml-4"
                >
                  View Details
                </Button> */}
              </div>
            </div>
          ))}
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No projects found in this category
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsPopup;