
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Download, MapPin, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('attendance_records') || '[]');
    const userRecords = records.filter(record => record.employeeId === user?.id);
    setAttendanceRecords(userRecords);
  }, [user]);

  useEffect(() => {
    const filtered = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    });
    setFilteredRecords(filtered);
  }, [attendanceRecords, selectedMonth, selectedYear]);

  const getAttendanceStats = () => {
    const totalDays = filteredRecords.length;
    const presentDays = filteredRecords.filter(record => record.status === 'present').length;
    const absentDays = filteredRecords.filter(record => record.status === 'absent').length;
    const lateDays = filteredRecords.filter(record => record.status === 'late').length;
    
    return { totalDays, presentDays, absentDays, lateDays };
  };

  const downloadAttendanceReport = () => {
    const csvContent = [
      ['Date', 'Status', 'Punch In', 'Punch Out', 'Work Mode', 'Total Hours'],
      ...filteredRecords.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.status,
        record.punchIn || '-',
        record.punchOut || '-',
        record.workMode || 'office',
        record.totalHours || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${months[selectedMonth]}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
          <p className="text-gray-600">View your attendance records and statistics</p>
        </div>
      </motion.div>

      {/* Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Filter Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-1 block">Month</label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Year</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={downloadAttendanceReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-xl font-bold">{stats.totalDays}</p>
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
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-xl font-bold text-green-600">{stats.presentDays}</p>
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
                <Clock className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-xl font-bold text-red-600">{stats.absentDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Late</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.lateDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Attendance Records - {months[selectedMonth]} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">
                        {new Date(record.date).getDate()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                        {record.workMode && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {record.workMode}
                          </Badge>
                        )}
                        {record.markedLateBy && (
                          <Badge variant="outline" className="flex items-center gap-1 text-yellow-600">
                            <AlertTriangle className="h-3 w-3" />
                            Marked by Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      {record.markedLateBy && (
                        <p className="text-xs text-yellow-600 mt-1">
                          This record was marked as late by admin on {new Date(record.markedLateAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-4 text-sm">
                      {record.punchIn && (
                        <div>
                          <p className="text-gray-500">In</p>
                          <p className="font-medium text-green-600">{record.punchIn}</p>
                        </div>
                      )}
                      {record.punchOut && (
                        <div>
                          <p className="text-gray-500">Out</p>
                          <p className="font-medium text-red-600">{record.punchOut}</p>
                        </div>
                      )}
                      {record.totalHours && (
                        <div>
                          <p className="text-gray-500">Hours</p>
                          <p className="font-medium">{record.totalHours}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found for {months[selectedMonth]} {selectedYear}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeAttendance;
