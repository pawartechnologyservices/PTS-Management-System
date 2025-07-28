import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Download, Filter, Search, Users, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../ui/use-toast';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../firebase';
import { ref, onValue, query, orderByChild, update, remove } from 'firebase/database';

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  status: string;
}

interface BreakRecord {
  breakIn: string;
  breakOut?: string;
  duration?: string;
  timestamp: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  status: string;
  workMode: string;
  timestamp: number;
  markedLateBy?: string;
  markedLateAt?: string;
  breaks?: {
    [key: string]: BreakRecord;
  };
}

const AttendanceManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch employees data
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    const employeesRef = ref(database, `users/${user.id}/employees`);
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      try {
        const employeesData = snapshot.val();
        if (employeesData) {
          const employeesList: Employee[] = Object.entries(employeesData).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Employee, 'id'>)
          }));
          setEmployees(employeesList);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast({
          title: "Error",
          description: "Failed to load employee data",
          variant: "destructive",
        });
      }
    });

    return () => unsubscribeEmployees();
  }, [user]);

  // Fetch attendance records for all employees
  useEffect(() => {
    if (!user?.id || employees.length === 0) {
      setLoading(false);
      return;
    }

    const allRecords: AttendanceRecord[] = [];
    const unsubscribeFunctions: (() => void)[] = [];

    employees.forEach(employee => {
      const attendanceRef = ref(database, `users/${user.id}/employees/${employee.id}/punching`);
      const attendanceQuery = query(attendanceRef, orderByChild('timestamp'));
      
      const unsubscribe = onValue(attendanceQuery, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
              id: key,
              employeeId: employee.id,
              employeeName: employee.name,
              ...(value as Omit<AttendanceRecord, 'id' | 'employeeId' | 'employeeName'>),
              // Ensure breaks exists even if empty
              breaks: (value as any)?.breaks || {}
            }));
            
            // Update allRecords with new data for this employee
            const existingRecords = allRecords.filter(r => r.employeeId !== employee.id);
            allRecords.splice(0, allRecords.length, ...existingRecords, ...records);
            setAttendanceRecords([...allRecords].sort((a, b) => b.timestamp - a.timestamp));
          } else {
            // Remove records for this employee if no data exists
            const updatedRecords = allRecords.filter(r => r.employeeId !== employee.id);
            allRecords.splice(0, allRecords.length, ...updatedRecords);
            setAttendanceRecords([...allRecords]);
          }
        } catch (error) {
          console.error(`Error fetching attendance for employee ${employee.id}:`, error);
        }
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    setLoading(false);
    
    return () => unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  }, [user, employees]);

  // Apply filters to attendance records
  useEffect(() => {
    let filtered = [...attendanceRecords];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.employeeName?.toLowerCase().includes(term) ||
        record.employeeId?.toLowerCase().includes(term)
      );
    }

    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getFullYear() === filterDateObj.getFullYear() &&
          recordDate.getMonth() === filterDateObj.getMonth() &&
          recordDate.getDate() === filterDateObj.getDate()
        );
      });
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, filterDate, filterStatus, attendanceRecords]);

  const markAsLate = async (recordId: string, employeeId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordRef = ref(database, `users/${user.id}/employees/${employeeId}/punching/${recordId}`);
      
      await update(recordRef, {
        status: 'late',
        markedLateBy: user.name || 'admin',
        markedLateAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Employee marked as late successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error marking as late:", error);
      toast({
        title: "Error",
        description: "Failed to mark as late",
        variant: "destructive",
      });
    }
  };

  const deleteAttendanceRecord = async (recordId: string, employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordRef = ref(database, `users/${user.id}/employees/${employeeId}/punching/${recordId}`);
      await remove(recordRef);

      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting record:", error);
      toast({
        title: "Error",
        description: "Failed to delete attendance record",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateTimeDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'N/A';
    
    try {
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let totalHours = hours;
        
        if (period === 'PM' && hours < 12) {
          totalHours += 12;
        } else if (period === 'AM' && hours === 12) {
          totalHours = 0;
        }
        
        return totalHours * 60 + minutes; // Convert to total minutes
      };

      const startMinutes = parseTime(startTime);
      const endMinutes = parseTime(endTime);

      let durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Add 24 hours if negative
      }

      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error calculating time duration:', error);
      return 'N/A';
    }
  };

  const calculateTotalBreakTime = (breaks: Record<string, BreakRecord> | undefined) => {
    if (!breaks) return 'N/A';

    let totalBreakMinutes = 0;
    
    Object.values(breaks).forEach(breakRecord => {
      if (breakRecord.breakOut && breakRecord.duration) {
        const [hours, minutes] = breakRecord.duration.split(':').map(Number);
        totalBreakMinutes += hours * 60 + minutes;
      }
    });

    const hours = Math.floor(totalBreakMinutes / 60);
    const minutes = totalBreakMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const exportAttendance = async () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No records to export",
        variant: "destructive",
      });
      return;
    }

    setExportLoading(true);
    try {
      // Prepare CSV content
      const headers = [
        'Employee Name',
        'Employee ID',
        'Date',
        'Punch In',
        'Punch Out',
        'Total Hours',
        'Total Break Time',
        'Status',
        'Work Mode',
        'Marked Late By',
        'Marked Late At',
        'Breaks'
      ];

      const rows = filteredRecords.map(record => [
        record.employeeName,
        record.employeeId,
        new Date(record.date).toLocaleDateString(),
        record.punchIn || '-',
        record.punchOut || '-',
        calculateTimeDuration(record.punchIn, record.punchOut),
        calculateTotalBreakTime(record.breaks),
        record.status,
        record.workMode || 'office',
        record.markedLateBy || '-',
        record.markedLateAt ? new Date(record.markedLateAt).toLocaleString() : '-',
        record.breaks ? Object.entries(record.breaks).map(([breakId, breakData]) => 
          `Break ${breakId}: ${breakData.breakIn} to ${breakData.breakOut || 'ongoing'} (${breakData.duration || 'N/A'})`
          .join('; ') ): 'No breaks'
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Attendance data has been exported",
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting attendance:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
    setFilterStatus('all');
  };

  const renderBreaksTooltip = (breaks: Record<string, BreakRecord> | undefined) => {
    if (!breaks || Object.keys(breaks).length === 0) {
      return <span className="text-gray-400">No breaks</span>;
    }

    return (
      <div className="max-w-xs">
        {Object.entries(breaks).map(([breakId, breakData]) => (
          <div key={breakId} className="mb-1 last:mb-0">
            <div className="font-medium">Break {breakId}</div>
            <div className="text-sm">
              <span className="text-green-600">{breakData.breakIn}</span> to{' '}
              {breakData.breakOut ? (
                <span className="text-red-600">{breakData.breakOut}</span>
              ) : (
                <span className="text-yellow-600">ongoing</span>
              )}
              {breakData.duration && (
                <span className="block text-gray-500">Duration: {breakData.duration}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
          <p className="text-gray-600">Track and manage employee attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search employee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={exportAttendance} 
                    disabled={exportLoading || filteredRecords.length === 0}
                    className="w-full"
                  >
                    {exportLoading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export ({filteredRecords.length})
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendance Records ({filteredRecords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Employee</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Punch In</th>
                        <th className="text-left p-3">Punch Out</th>
                        <th className="text-left p-3">Total Hours</th>
                        <th className="text-left p-3">Break Time</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Work Mode</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record, index) => (
                        <motion.tr
                          key={`${record.id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{record.employeeName}</p>
                              <p className="text-sm text-gray-500">{record.employeeId}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-500" />
                              {record.punchIn || '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-red-500" />
                              {record.punchOut || '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            {calculateTimeDuration(record.punchIn, record.punchOut)}
                          </td>
                          <td className="p-3">
                            <div className="group relative">
                              <span className="cursor-help underline">
                                {calculateTotalBreakTime(record.breaks)}
                              </span>
                              <div className="absolute z-10 hidden group-hover:block bg-white p-3 border rounded shadow-lg w-64">
                                {renderBreaksTooltip(record.breaks)}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                            {record.markedLateBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                Marked by {record.markedLateBy}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {record.workMode || 'office'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {record.status !== 'late' && record.status !== 'absent' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsLate(record.id, record.employeeId)}
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Mark Late
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteAttendanceRecord(record.id, record.employeeId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecords.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No attendance records found matching your filters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AttendanceManagement;