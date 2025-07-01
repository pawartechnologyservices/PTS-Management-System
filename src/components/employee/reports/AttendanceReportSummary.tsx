
import React from 'react';
import { Calendar, User, BarChart3 } from 'lucide-react';

interface AttendanceReportSummaryProps {
  reportData: any;
}

const AttendanceReportSummary: React.FC<AttendanceReportSummaryProps> = ({ reportData }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{reportData.totalDays || 0}</p>
          <p className="text-sm text-gray-600">Total Days</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{reportData.presentDays || 0}</p>
          <p className="text-sm text-gray-600">Present Days</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <Calendar className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{reportData.absentDays || 0}</p>
          <p className="text-sm text-gray-600">Absent Days</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">{reportData.attendanceRate || 0}%</p>
          <p className="text-sm text-gray-600">Attendance Rate</p>
        </div>
      </div>
      
      {reportData.records && reportData.records.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Attendance Records</h3>
          <div className="space-y-2">
            {reportData.records.map((record: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">{record.status}</p>
                </div>
                <div className="text-right text-sm">
                  <p>In: {record.punchIn || '-'}</p>
                  <p>Out: {record.punchOut || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceReportSummary;
