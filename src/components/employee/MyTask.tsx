import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Calendar, Bell, Eye, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Input } from '../ui/input';

interface TaskComment {
  text: string;
  createdAt: string;
  createdBy: string;
}

interface DailyTask {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  task: string;
  description: string;
  date: string;
  time: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt?: string;
  comments?: TaskComment[];
  assignedBy?: string;
}

const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    if (!user?.id || !user?.adminUid) {
      console.error("User ID or Admin UID not available");
      setLoading(false);
      return;
    }

    setLoading(true);
    const tasksRef = ref(database, `users/${user.adminUid}/employees/${user.id}/dailyTasks`);

    const fetchTasks = onValue(tasksRef, (snapshot) => {
      try {
        const tasksData: DailyTask[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const taskId = childSnapshot.key;
          const taskData = childSnapshot.val();

          if (taskData) {
            tasksData.push({
              id: taskId || '',
              ...taskData
            });
          }
        });

        setTasks(tasksData.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
        setLoading(false);
      } catch (err) {
        console.error('Error processing task data:', err);
        setError('Failed to process task data');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      setLoading(false);
    });

    return () => {
      off(tasksRef);
    };
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const dateMatch = !filterDate || task.date === filterDate;
    return statusMatch && dateMatch;
  });

  const clearDateFilter = () => {
    setFilterDate('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <p className="text-lg text-gray-600">{error}</p>
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
          <h1 className="text-2xl font-bold text-gray-800">My Daily Tasks</h1>
          <p className="text-gray-600">View your assigned tasks</p>
        </div>
        <div className="flex space-x-2">
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Filter by date"
              className="w-[180px]"
            />
            {filterDate && (
              <button
                onClick={clearDateFilter}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('card')}
          >
            Card View
          </Button>
        </div>
      </motion.div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No tasks assigned</h3>
            <p className="text-gray-500 mt-1">
              You don't have any tasks assigned to you yet
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>Task List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of your assigned daily tasks</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      {formatDate(task.date)} at {task.time}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{task.task}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{task.description}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.assignedBy || 'Admin'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{task.task}</CardTitle>
                    <Badge className={getStatusBadge(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Assigned on {formatDate(task.createdAt)} by {task.assignedBy || 'Admin'}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-gray-700 mt-1">{task.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Due Date</Label>
                        <p className="text-sm">
                          {formatDate(task.date)} at {task.time}
                        </p>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <p className="text-sm">{task.department}</p>
                      </div>
                    </div>
                    {task.comments && task.comments.length > 0 && (
                      <div>
                        <Label>Comments ({task.comments.length})</Label>
                        <div className="space-y-2 mt-2">
                          {task.comments.map((comment, index) => (
                            <div key={index} className="border-l-2 pl-2 border-gray-200">
                              <p className="text-sm">{comment.text}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)} by {comment.createdBy}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTask(task)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Task Details: {selectedTask.task}</h3>
              <Button variant="ghost" onClick={() => setSelectedTask(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-500">Task Title</Label>
                  <p className="font-medium">{selectedTask.task}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Status</Label>
                  <Badge className={getStatusBadge(selectedTask.status)}>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Assigned Date</Label>
                  <p>{formatDate(selectedTask.date)} at {selectedTask.time}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Assigned By</Label>
                  <p>{selectedTask.assignedBy || 'Admin'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Department</Label>
                  <p>{selectedTask.department}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Created At</Label>
                  <p>{formatDateTime(selectedTask.createdAt)}</p>
                </div>
                {selectedTask.updatedAt && (
                  <div className="space-y-2">
                    <Label className="text-gray-500">Last Updated</Label>
                    <p>{formatDateTime(selectedTask.updatedAt)}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-500">Description</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="whitespace-pre-line text-gray-700">{selectedTask.description}</p>
                </div>
              </div>
              
              {selectedTask.comments && selectedTask.comments.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-gray-500">Comments ({selectedTask.comments.length})</Label>
                  <div className="space-y-3">
                    {selectedTask.comments.map((comment, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md border-l-4 border-gray-300">
                        <p className="text-sm text-gray-700">{comment.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(comment.createdAt)} by {comment.createdBy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;