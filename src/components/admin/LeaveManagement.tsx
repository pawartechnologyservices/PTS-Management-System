import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Download, Filter, Search, AlertTriangle, Check, X, RotateCcw, Trash2 } from 'lucide-react';
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

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
}

const LeaveManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
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

    const allRequests: LeaveRequest[] = [];
    const unsubscribeFunctions: (() => void)[] = [];

    employees.forEach(employee => {
      const leavesRef = ref(database, `users/${user.id}/employees/${employee.id}/leaves`);
      const leavesQuery = query(leavesRef, orderByChild('appliedAt'));
      
      const unsubscribe = onValue(leavesQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const requests: LeaveRequest[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            employeeId: employee.id,
            employeeName: employee.name,
            employeeEmail: employee.email,
            department: employee.department || 'No Department',
            ...(value as Omit<LeaveRequest, 'id' | 'employeeId' | 'employeeName' | 'employeeEmail' | 'department'>)
          }));
          
          // Update allRequests with new data for this employee
          const existingRequests = allRequests.filter(r => r.employeeId !== employee.id);
          allRequests.splice(0, allRequests.length, ...existingRequests, ...requests);
          setLeaveRequests([...allRequests].sort((a, b) => 
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          ));
        } else {
          // Remove requests for this employee if no data exists
          const updatedRequests = allRequests.filter(r => r.employeeId !== employee.id);
          allRequests.splice(0, allRequests.length, ...updatedRequests);
          setLeaveRequests([...allRequests]);
        }
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    setLoading(false);
    
    return () => unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  }, [user, employees]);

  useEffect(() => {
    let filtered = leaveRequests;

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter(request => 
        new Date(request.appliedAt).toDateString() === new Date(filterDate).toDateString()
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(request => request.status === filterStatus);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, filterDate, filterStatus, leaveRequests]);

  const updateLeaveStatus = async (request: LeaveRequest, newStatus: 'approved' | 'rejected' | 'pending') => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const updates: Partial<LeaveRequest> = {
        status: newStatus
      };

      if (newStatus === 'approved') {
        updates.approvedAt = new Date().toISOString();
        updates.approvedBy = user.name || 'Admin';
      } else if (newStatus === 'rejected') {
        updates.rejectedAt = new Date().toISOString();
      } else if (newStatus === 'pending') {
        updates.rejectedAt = '';
        updates.approvedAt = '';
        updates.approvedBy = '';
      }

      const leaveRef = ref(database, `users/${user.id}/employees/${request.employeeId}/leaves/${request.id}`);
      await update(leaveRef, updates);

      toast({
        title: `Leave ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        description: `Leave request has been ${newStatus} successfully.`
      });
    } catch (error) {
      console.error("Error updating leave request:", error);
      toast({
        title: "Error",
        description: `Failed to ${newStatus} leave request`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request: LeaveRequest) => {
    updateLeaveStatus(request, 'approved');
  };

  const handleReject = (request: LeaveRequest) => {
    updateLeaveStatus(request, 'rejected');
  };

  const handleReapprove = (request: LeaveRequest) => {
    updateLeaveStatus(request, 'pending');
  };

  const handleDelete = async (request: LeaveRequest) => {
    if (!user?.id) return;

    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        setLoading(true);
        const leaveRef = ref(database, `users/${user.id}/employees/${request.employeeId}/leaves/${request.id}`);
        await remove(leaveRef);

        toast({
          title: "Leave Request Deleted",
          description: "Leave request has been deleted successfully"
        });
      } catch (error) {
        console.error("Error deleting leave request:", error);
        toast({
          title: "Error",
          description: "Failed to delete leave request",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const exportLeaves = () => {
    const csvContent = [
      ['Employee Name', 'Employee ID', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Status', 'Reason', 'Applied At'],
      ...filteredRequests.map(request => [
        request.employeeName,
        request.employeeId,
        request.department,
        request.leaveType,
        new Date(request.startDate).toLocaleDateString(),
        new Date(request.endDate).toLocaleDateString(),
        calculateDays(request.startDate, request.endDate),
        request.status,
        request.reason,
        new Date(request.appliedAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && leaveRequests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-600">Manage all employee leave requests</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Leaves: {leaveRequests.length} | Showing: {filteredRequests.length}
        </div>
      </motion.div>

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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportLeaves} className="w-full">
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
              <Calendar className="h-4 w-4" />
              Leave Requests ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Employee</th>
                    <th className="text-left p-3">Leave Type</th>
                    <th className="text-left p-3">Dates</th>
                    <th className="text-left p-3">Duration</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Applied On</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request, index) => (
                    <motion.tr
                      key={`${request.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{request.employeeName}</p>
                          <p className="text-sm text-gray-500">{request.employeeId}</p>
                          <p className="text-sm text-gray-500">{request.department}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {request.leaveType}
                      </td>
                      <td className="p-3">
                        <div>
                          <p>{new Date(request.startDate).toLocaleDateString()}</p>
                          <p>to</p>
                          <p>{new Date(request.endDate).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {calculateDays(request.startDate, request.endDate)} days
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {request.approvedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Approved by {request.approvedBy}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        {new Date(request.appliedAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request)}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={loading}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(request)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                disabled={loading}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {(request.status === 'approved' || request.status === 'rejected') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReapprove(request)}
                              className="text-blue-600 hover:bg-blue-50"
                              disabled={loading}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Re-open
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(request)}
                            className="text-red-600 hover:bg-red-50"
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {leaveRequests.length === 0 ? (
                    "No leave requests found in the system"
                  ) : (
                    "No leave requests match the current filter"
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LeaveManagement;