import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ref, push, set, onValue, off } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../ui/use-toast';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  isActive: boolean;
}

interface DailyTask {
  id?: string;
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
}

const DailyTaskEmployee: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [taskHistory, setTaskHistory] = useState<DailyTask[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);

  const [formData, setFormData] = useState<Omit<DailyTask, 'id' | 'createdAt' | 'updatedAt'>>({
    employeeId: '',
    employeeName: '',
    department: '',
    task: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'pending'
  });

  const departments = [
    'Software Development',
    'Digital Marketing',
    'Cyber Security',
    'Sales',
    'Product Designing',
    'Web Development',
    'Graphic Designing'
  ];

  useEffect(() => {
    if (!user) return;

    setEmployeesLoading(true);
    const employeesRef = ref(database, `users/${user.id}/employees`);

    const fetchEmployees = onValue(employeesRef, (snapshot) => {
      try {
        const employeesData: Employee[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const employeeId = childSnapshot.key;
          const employeeData = childSnapshot.val();

          if (employeeData && employeeData.status === 'active') {
            employeesData.push({
              id: employeeId || '',
              name: employeeData.name || '',
              email: employeeData.email || '',
              department: employeeData.department || '',
              designation: employeeData.designation || '',
              isActive: employeeData.status === 'active',
            });
          }
        });

        setEmployees(employeesData);
        setEmployeesLoading(false);
      } catch (err) {
        console.error('Error processing employee data:', err);
        setError('Failed to process employee data');
        setEmployeesLoading(false);
      }
    }, (error) => {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
      setEmployeesLoading(false);
    });

    return () => {
      off(employeesRef);
    };
  }, [user]);

  useEffect(() => {
    if (!user || employees.length === 0) {
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    const allTasks: DailyTask[] = [];
    const unsubscribeFunctions: (() => void)[] = [];

    employees.forEach(employee => {
      const employeeTasksRef = ref(database, `users/${user.id}/employees/${employee.id}/dailyTasks`);
      
      const unsubscribe = onValue(employeeTasksRef, (snapshot) => {
        const employeeTasks: DailyTask[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const taskId = childSnapshot.key;
          const taskData = childSnapshot.val();

          if (taskData) {
            employeeTasks.push({
              id: taskId || '',
              ...taskData
            });
          }
        });

        setTaskHistory(prevTasks => {
          const otherTasks = prevTasks.filter(t => t.employeeId !== employee.id);
          return [...otherTasks, ...employeeTasks]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        setTasksLoading(false);
      }, (error) => {
        console.error(`Error fetching tasks for employee ${employee.id}:`, error);
      });

      unsubscribeFunctions.push(() => off(employeeTasksRef));
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [user, employees]);

  useEffect(() => {
    setLoading(employeesLoading || tasksLoading);
  }, [employeesLoading, tasksLoading]);

  useEffect(() => {
    if (selectedDepartment) {
      const deptEmployees = employees.filter(emp => 
        emp.department === selectedDepartment
      );
      setFilteredEmployees(deptEmployees);
    } else {
      setFilteredEmployees([]);
    }
    setFormData(prev => ({
      ...prev,
      employeeId: '',
      employeeName: '',
      department: selectedDepartment,
      task: '',
      description: '',
      status: 'pending'
    }));
  }, [selectedDepartment, employees]);

  const handleEmployeeChange = (employeeId: string) => {
    const selectedEmployee = filteredEmployees.find(emp => emp.id === employeeId);
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        department: selectedEmployee.department
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employeeId: '',
        employeeName: '',
        department: selectedDepartment
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.employeeId) return;

    setSubmitting(true);

    try {
      const taskData: DailyTask = {
        ...formData,
        createdAt: new Date().toISOString()
      };

      const employeeTaskRef = push(ref(database, `users/${user.id}/employees/${formData.employeeId}/dailyTasks`));
      await set(employeeTaskRef, taskData);

      toast({
        title: "Task Submitted",
        description: "Daily task has been successfully recorded",
      });

      setFormData(prev => ({
        ...prev,
        task: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'pending'
      }));
    } catch (error) {
      console.error('Error submitting daily task:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit daily task. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

  const filteredTasks = taskHistory.filter(task => {
    const departmentMatch = filterDepartment === 'all' || task.department === filterDepartment;
    const dateMatch = !filterDate || task.date === filterDate;
    return departmentMatch && dateMatch;
  });

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Submit Daily Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDepartment && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={handleEmployeeChange}
                    disabled={!selectedDepartment}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.designation})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-employees" disabled>
                          No employees in this department
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task">Task</Label>
                  <Input
                    id="task"
                    value={formData.task}
                    onChange={(e) => setFormData(prev => ({ ...prev, task: e.target.value }))}
                    placeholder="What task was performed?"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the task in detail"
                    rows={4}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      status: value as 'pending' | 'in-progress' | 'completed'
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submitting || !formData.employeeId}
                    className="w-full md:w-auto"
                  >
                    {submitting ? 'Submitting...' : 'Submit Task'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <CardTitle>Task History</CardTitle>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                <Select
                  value={filterDepartment}
                  onValueChange={setFilterDepartment}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="Filter by date"
                  className="w-full md:w-[180px]"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex-1 md:flex-none"
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="flex-1 md:flex-none"
                >
                  Cards
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks found matching your filters
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableCaption>A list of filtered daily tasks</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Department</TableHead>
                    <TableHead className="whitespace-nowrap">Employee</TableHead>
                    <TableHead className="whitespace-nowrap">Task</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(task.date)} at {task.time}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{task.department}</TableCell>
                      <TableCell className="whitespace-nowrap">{task.employeeName}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{task.task}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusBadge(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start space-x-2">
                      <CardTitle className="text-lg truncate">{task.task}</CardTitle>
                      <Badge className={`${getStatusBadge(task.status)} whitespace-nowrap`}>
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {task.department} • {task.employeeName}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm line-clamp-2">
                        {task.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(task.date)} at {task.time}
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                          className="w-full md:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-500">Task Title</Label>
                  <p className="font-medium">{selectedTask.task}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">Status</Label>
                  <Badge className={getStatusBadge(selectedTask.status)}>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">Assigned Date</Label>
                  <p>{formatDate(selectedTask.date)} at {selectedTask.time}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">Department</Label>
                  <p>{selectedTask.department}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">Employee</Label>
                  <p>{selectedTask.employeeName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">Created At</Label>
                  <p>{formatDateTime(selectedTask.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-500">Description</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="whitespace-pre-line">{selectedTask.description}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedTask(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyTaskEmployee;