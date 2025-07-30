import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Check, X, AlertTriangle, FileText, Calendar, User, Link, Edit, Trash2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { useAuth } from '../../../hooks/useAuth';
import { database } from '../../../firebase';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { toast } from '../../ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComp } from '../../ui/calendar';

interface Task {
  id: string;
  date: string;
  employeeName: string;
  employeeId: string;
  department: string;
  designation: string;
  taskTitle: string;
  taskType: string;
  priority: string;
  assignedBy: string;
  assignedDate: string;
  startTime: string;
  endTime: string;
  totalDuration: string;
  status: string;
  workSummary: string;
  pendingWork: string;
  challenges: string;
  verifiedBy: string;
  managerRemarks: string;
  employeeRemarks: string;
  attachments: string[];
}

const DailyTask = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({
    date: new Date().toISOString().split('T')[0],
    employeeName: user?.name || '',
    employeeId: user?.id || '',
    department: user?.department || '',
    designation: user?.designation || '',
    status: 'pending',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  useEffect(() => {
    if (!user?.id || !user?.adminUid) {
      setLoading(false);
      return;
    }

    const tasksRef = ref(database, `users/${user.adminUid}/employees/${user.id}/dailytask`);
    
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const tasksList: Task[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Task, 'id'>)
          }));
          tasksList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTasks(tasksList);
          setFilteredTasks(tasksList);
        } else {
          setTasks([]);
          setFilteredTasks([]);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (dateFilter) {
      const filtered = tasks.filter(task => {
        const taskDate = new Date(task.date);
        return (
          taskDate.getDate() === dateFilter.getDate() &&
          taskDate.getMonth() === dateFilter.getMonth() &&
          taskDate.getFullYear() === dateFilter.getFullYear()
        );
      });
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(tasks);
    }
  }, [dateFilter, tasks]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentTask(prev => ({ ...prev, [name]: value }));
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !user?.adminUid) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const duration = calculateDuration(currentTask.startTime || '', currentTask.endTime || '');
      
      const taskData: Omit<Task, 'id'> = {
        date: currentTask.date || '',
        employeeName: currentTask.employeeName || '',
        employeeId: currentTask.employeeId || '',
        department: currentTask.department || '',
        designation: currentTask.designation || '',
        taskTitle: currentTask.taskTitle || '',
        taskType: currentTask.taskType || '',
        priority: currentTask.priority || 'medium',
        assignedBy: currentTask.assignedBy || '',
        assignedDate: currentTask.assignedDate || '',
        startTime: currentTask.startTime || '',
        endTime: currentTask.endTime || '',
        totalDuration: duration,
        status: currentTask.status || 'pending',
        workSummary: currentTask.workSummary || '',
        pendingWork: currentTask.pendingWork || '',
        challenges: currentTask.challenges || '',
        verifiedBy: currentTask.verifiedBy || '',
        managerRemarks: currentTask.managerRemarks || '',
        employeeRemarks: currentTask.employeeRemarks || '',
        attachments: currentTask.attachments || []
      };

      if (isEditing && currentTask.id) {
        const taskRef = ref(database, `users/${user.adminUid}/employees/${user.id}/dailytask/${currentTask.id}`);
        await update(taskRef, taskData);
        toast({
          title: "Task Updated",
          description: "Your task has been updated successfully."
        });
      } else {
        const tasksRef = ref(database, `users/${user.adminUid}/employees/${user.id}/dailytask`);
        const newTaskRef = push(tasksRef);
        await set(newTaskRef, taskData);
        toast({
          title: "Task Added",
          description: "Your task has been submitted successfully."
        });
      }
      
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: "Error",
        description: "Failed to submit task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask({
      ...task,
      id: task.id
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user?.id || !user?.adminUid) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const taskRef = ref(database, `users/${user.adminUid}/employees/${user.id}/dailytask/${taskId}`);
      await remove(taskRef);
      toast({
        title: "Task Deleted",
        description: "The task has been deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setCurrentTask({
      date: new Date().toISOString().split('T')[0],
      employeeName: user?.name || '',
      employeeId: user?.id || '',
      department: user?.department || '',
      designation: user?.designation || '',
      status: 'pending',
      priority: 'medium'
    });
    setIsEditing(false);
  };

  const clearDateFilter = () => {
    setDateFilter(undefined);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'in-progress': return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-700"><X className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-700">Low</Badge>;
      default: return <Badge>{priority}</Badge>;
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Daily Tasks
            </div>
            <div className="flex items-center gap-2">
              <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    {dateFilter ? new Date(dateFilter).toLocaleDateString() : 'Filter by Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComp
                    mode="single"
                    selected={dateFilter}
                    onSelect={(date) => {
                      setDateFilter(date);
                      setIsDateFilterOpen(false);
                    }}
                    initialFocus
                  />
                  {dateFilter && (
                    <div className="p-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={clearDateFilter}
                      >
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <Button onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of your daily tasks.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{new Date(task.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{task.taskTitle}</TableCell>
                    <TableCell>{task.taskType}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{task.totalDuration}</TableCell>
                    <TableCell>{task.assignedBy}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTask(task)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {dateFilter ? 'No tasks found for selected date' : 'No tasks added yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Task Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Task' : 'Add New Task'}</h2>
              <button onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    name="date"
                    value={currentTask.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Employee Name</label>
                  <Input
                    name="employeeName"
                    value={currentTask.employeeName || ''}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Employee ID</label>
                  <Input
                    name="employeeId"
                    value={currentTask.employeeId || ''}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <Input
                    name="department"
                    value={currentTask.department || ''}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Designation</label>
                  <Input
                    name="designation"
                    value={currentTask.designation || ''}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Task Title</label>
                  <Input
                    name="taskTitle"
                    value={currentTask.taskTitle || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Task Type</label>
                  <Select
                    value={currentTask.taskType || ''}
                    onValueChange={(value) => handleSelectChange('taskType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Select
                    value={currentTask.priority || 'medium'}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Assigned By</label>
                  <Input
                    name="assignedBy"
                    value={currentTask.assignedBy || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Assigned Date</label>
                  <Input
                    type="date"
                    name="assignedDate"
                    value={currentTask.assignedDate || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <Input
                    type="time"
                    name="startTime"
                    value={currentTask.startTime || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <Input
                    type="time"
                    name="endTime"
                    value={currentTask.endTime || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select
                    value={currentTask.status || 'pending'}
                    onValueChange={(value) => handleSelectChange('status', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {currentTask.startTime && currentTask.endTime && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Duration: {calculateDuration(currentTask.startTime, currentTask.endTime)}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Work Summary / Progress</label>
                <Textarea
                  name="workSummary"
                  value={currentTask.workSummary || ''}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Pending Work</label>
                <Textarea
                  name="pendingWork"
                  value={currentTask.pendingWork || ''}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Challenges Faced</label>
                <Textarea
                  name="challenges"
                  value={currentTask.challenges || ''}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Verified By</label>
                  <Input
                    name="verifiedBy"
                    value={currentTask.verifiedBy || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Manager Remarks</label>
                  <Input
                    name="managerRemarks"
                    value={currentTask.managerRemarks || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Employee Remarks</label>
                <Textarea
                  name="employeeRemarks"
                  value={currentTask.employeeRemarks || ''}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Attachments (comma separated)</label>
                <Input
                  name="attachments"
                  value={currentTask.attachments?.join(', ') || ''}
                  onChange={(e) => {
                    const attachments = e.target.value.split(',').map(item => item.trim());
                    setCurrentTask(prev => ({ ...prev, attachments }));
                  }}
                  placeholder="Enter file names or URLs separated by commas"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (isEditing ? "Updating..." : "Submitting...") : (isEditing ? "Update Task" : "Save Task")}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Task Details Modal */}
      {isViewModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Task Details</h2>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Task Title</h3>
                  <p className="text-sm">{selectedTask.taskTitle}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Task Type</h3>
                  <p className="text-sm">{selectedTask.taskType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="text-sm">{new Date(selectedTask.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="text-sm">{getStatusBadge(selectedTask.status)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                  <div className="text-sm">{getPriorityBadge(selectedTask.priority)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                  <p className="text-sm">{selectedTask.totalDuration}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                  <p className="text-sm">{selectedTask.startTime}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                  <p className="text-sm">{selectedTask.endTime}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned By</h3>
                  <p className="text-sm">{selectedTask.assignedBy}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned Date</h3>
                  <p className="text-sm">{new Date(selectedTask.assignedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Employee Name</h3>
                  <p className="text-sm">{selectedTask.employeeName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Employee ID</h3>
                  <p className="text-sm">{selectedTask.employeeId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p className="text-sm">{selectedTask.department}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Designation</h3>
                  <p className="text-sm">{selectedTask.designation}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Work Summary</h3>
                <p className="text-sm mt-1 whitespace-pre-line">{selectedTask.workSummary}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Pending Work</h3>
                <p className="text-sm mt-1 whitespace-pre-line">{selectedTask.pendingWork}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Challenges Faced</h3>
                <p className="text-sm mt-1 whitespace-pre-line">{selectedTask.challenges}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500">Employee Remarks</h3>
                <p className="text-sm mt-1 whitespace-pre-line">{selectedTask.employeeRemarks}</p>
              </div>

              {selectedTask.managerRemarks && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500">Manager Remarks</h3>
                  <p className="text-sm mt-1 whitespace-pre-line">{selectedTask.managerRemarks}</p>
                </div>
              )}

              {selectedTask.verifiedBy && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500">Verified By</h3>
                  <p className="text-sm mt-1">{selectedTask.verifiedBy}</p>
                </div>
              )}

              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500">Attachments</h3>
                  <div className="mt-2 space-y-1">
                    {selectedTask.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center text-sm text-blue-600 hover:underline">
                        <Link className="h-3 w-3 mr-1" />
                        <a href={attachment} target="_blank" rel="noopener noreferrer">
                          {attachment}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DailyTask;