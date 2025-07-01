
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Check, X, Clock, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../ui/use-toast';

const LeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const requests = JSON.parse(localStorage.getItem('leave_requests') || '[]');
    setLeaveRequests(requests);
    setFilteredRequests(requests);
  }, []);

  useEffect(() => {
    let filtered = leaveRequests;
    if (filterStatus !== 'all') {
      filtered = leaveRequests.filter(request => request.status === filterStatus);
    }
    setFilteredRequests(filtered);
  }, [filterStatus, leaveRequests]);

  const handleApprove = (requestId) => {
    const updatedRequests = leaveRequests.map(request => 
      request.id === requestId 
        ? { ...request, status: 'approved', approvedAt: new Date().toISOString() }
        : request
    );
    
    setLeaveRequests(updatedRequests);
    localStorage.setItem('leave_requests', JSON.stringify(updatedRequests));
    
    toast({
      title: "Leave Approved",
      description: "Leave request has been approved successfully."
    });
  };

  const handleReject = (requestId) => {
    const updatedRequests = leaveRequests.map(request => 
      request.id === requestId 
        ? { ...request, status: 'rejected', rejectedAt: new Date().toISOString() }
        : request
    );
    
    setLeaveRequests(updatedRequests);
    localStorage.setItem('leave_requests', JSON.stringify(updatedRequests));
    
    toast({
      title: "Leave Rejected",
      description: "Leave request has been rejected.",
      variant: "destructive"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-600">Manage employee leave requests</p>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leave Requests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Leave Requests ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{request.employeeName}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Employee ID: {request.employeeId}</p>
                          <p className="text-sm text-gray-600">Leave Type: {request.leaveType}</p>
                          <p className="text-sm text-gray-600">
                            Duration: {calculateDays(request.startDate, request.endDate)} days
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Start Date: {new Date(request.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            End Date: {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Applied: {new Date(request.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium">Reason:</p>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No leave requests found
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
