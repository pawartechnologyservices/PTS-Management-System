
import React from 'react';
import { FileText, User, Calendar, BarChart3 } from 'lucide-react';

interface ProjectsReportSummaryProps {
  reportData: any;
}

const ProjectsReportSummary: React.FC<ProjectsReportSummaryProps> = ({ reportData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-blue-600">{reportData.totalProjects || 0}</p>
        <p className="text-sm text-gray-600">Total Projects</p>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-green-600">{reportData.completed || 0}</p>
        <p className="text-sm text-gray-600">Completed</p>
      </div>
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        <Calendar className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-yellow-600">{reportData.inProgress || 0}</p>
        <p className="text-sm text-gray-600">In Progress</p>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-purple-600">{Math.round(reportData.avgProgress || 0)}%</p>
        <p className="text-sm text-gray-600">Avg Progress</p>
      </div>
    </div>
  );
};

export default ProjectsReportSummary;
