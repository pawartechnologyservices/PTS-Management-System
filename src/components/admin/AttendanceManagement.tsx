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
import { ref, onValue, query, orderByChild, update } from 'firebase/database';

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  status: string;
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

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    const employeesRef = ref(database, `users/${user.id}/employees`);
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
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
    });

    return () => unsubscribeEmployees();
  }, [user]);

  useEffect(() => {
    if (!user?.id || employees.length === 0) return;

    const allRecords: AttendanceRecord[] = [];
    const unsubscribeFunctions: (() => void)[] = [];

    employees.forEach(employee => {
      const attendanceRef = ref(database, `users/${user.id}/employees/${employee.id}/punching`);
      const attendanceQuery = query(attendanceRef, orderByChild('timestamp'));
      
      const unsubscribe = onValue(attendanceQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const records: AttendanceRecord[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            employeeId: employee.id,
            employeeName: employee.name,
            ...(value as Omit<AttendanceRecord, 'id' | 'employeeId' | 'employeeName'>)
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
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    setLoading(false);
    
    return () => unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  }, [user, employees]);

  useEffect(() => {
    let filtered = attendanceRecords;

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter(record => 
        new Date(record.date).toDateString() === new Date(filterDate).toDateString()
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, filterDate, filterStatus, attendanceRecords]);

  const markAsLate = async (recordId: string, employeeId: string) => {
    try {
      const recordRef = ref(database, `users/${user?.id}/employees/${employeeId}/punching/${recordId}`);
      
      await update(recordRef, {
        status: 'late',
        markedLateBy: user?.name || 'admin',
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

    try {
      const recordRef = ref(database, `users/${user?.id}/employees/${employeeId}/punching/${recordId}`);
      await update(recordRef, null); // Setting to null removes the record

      toast({
        title: "Record Deleted",
        description: "Attendance record has been deleted successfully",
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

  const exportAttendance = () => {
    const csvContent = [
      ['Employee Name', 'Employee ID', 'Date', 'Punch In', 'Punch Out', 'Status', 'Work Mode'],
      ...filteredRecords.map(record => [
        record.employeeName,
        record.employeeId,
        new Date(record.date).toLocaleDateString(),
        record.punchIn || '-',
        record.punchOut || '-',
        record.status,
        record.workMode || 'office'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
                  <Button onClick={exportAttendance} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export
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
                      No attendance records found
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