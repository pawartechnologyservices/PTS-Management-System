
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Clock, User } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employeeName: string;
  department: string;
  punchIn: string;
  date: string;
  status: 'present' | 'late' | 'absent';
}

interface AttendancePopupProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceData: AttendanceRecord[];
}

const AttendancePopup: React.FC<AttendancePopupProps> = ({
  isOpen,
  onClose,
  attendanceData
}) => {
  const lateEmployees = attendanceData.filter(record => record.status === 'late');
  const presentEmployees = attendanceData.filter(record => record.status === 'present');
  const absentEmployees = attendanceData.filter(record => record.status === 'absent');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Attendance Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Latecomers Section */}
          <div>
            <h3 className="text-lg font-semibold text-red-600 mb-3">Latecomers ({lateEmployees.length})</h3>
            <div className="space-y-2">
              {lateEmployees.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-medium">{record.employeeName}</p>
                      <p className="text-sm text-gray-600">{record.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{record.punchIn}</p>
                    <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Present Employees */}
          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-3">Present ({presentEmployees.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {presentEmployees.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{record.employeeName}</p>
                    <p className="text-sm text-gray-600">{record.department}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {record.punchIn}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Absent Employees */}
          <div>
            <h3 className="text-lg font-semibold text-gray-600 mb-3">Absent ({absentEmployees.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {absentEmployees.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{record.employeeName}</p>
                    <p className="text-sm text-gray-600">{record.department}</p>
                  </div>
                  <Badge variant="outline" className="text-gray-600">
                    Absent
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendancePopup;
