
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { FolderOpen, Calendar, Users } from 'lucide-react';

interface Project {
  id: string;
  title: string;
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
  const activeProjects = projects.filter(project => project.status === 'active');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Ongoing Projects ({activeProjects.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {activeProjects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
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
                
                <Button
                  onClick={() => console.log('View project details:', project.id)}
                  className="ml-4"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
          
          {activeProjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No ongoing projects
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsPopup;
