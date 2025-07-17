import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { X, Plus } from 'lucide-react';
import { Task } from '../../../types/project';

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  role: string;
  isActive: boolean;
}

interface ProjectFormData {
  name: string;
  description: string;
  department: string;
  assignedTeamLeader: string;
  assignedEmployees: string[];
  tasks: Task[];
  startDate: string;
  endDate: string;
  priority: string;
  status: string;
}

interface EnhancedProjectFormProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  employees: Employee[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const EnhancedProjectForm: React.FC<EnhancedProjectFormProps> = ({
  formData,
  setFormData,
  employees,
  onSubmit,
  onCancel
}) => {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: ''
  });

  const teamLeaders = employees.filter(emp => emp.role === 'team_leader' && emp.isActive);
  const developers = employees.filter(emp => emp.role === 'employee' && emp.isActive);
  const departments = [...new Set(employees.map(emp => emp.department))];

  const handleEmployeeToggle = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(employeeId)
        ? prev.assignedEmployees.filter(id => id !== employeeId)
        : [...prev.assignedEmployees, employeeId]
    }));
  };

  const addTask = () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) return;
    
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, task]
    }));
    
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: ''
    });
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamLeader">Team Leader</Label>
              <Select value={formData.assignedTeamLeader} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTeamLeader: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team leader" />
                </SelectTrigger>
                <SelectContent>
                  {teamLeaders.map(leader => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.name} - {leader.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Assign Developers (Bulk Selection)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
              {developers.map(developer => (
                <div key={developer.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`dev-${developer.id}`}
                    checked={formData.assignedEmployees.includes(developer.id)}
                    onChange={() => handleEmployeeToggle(developer.id)}
                    className="rounded"
                  />
                  <label htmlFor={`dev-${developer.id}`} className="text-sm">
                    {developer.name}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.assignedEmployees.map(empId => {
                const emp = employees.find(e => e.id === empId);
                return emp ? (
                  <Badge key={empId} variant="secondary" className="text-xs">
                    {emp.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          {/* Task Management Section */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-lg font-semibold">Project Tasks</Label>
            
            {/* Add New Task */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              />
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
              />
              <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to developer" />
                </SelectTrigger>
                <SelectContent>
                  {formData.assignedEmployees.map(empId => {
                    const emp = employees.find(e => e.id === empId);
                    return emp ? (
                      <SelectItem key={empId} value={empId}>{emp.name}</SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
              <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Task priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <div className="md:col-span-2">
                <Textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button type="button" onClick={addTask} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>

            {/* Display Added Tasks */}
            {formData.tasks.length > 0 && (
              <div className="space-y-2">
                <Label>Added Tasks ({formData.tasks.length})</Label>
                {formData.tasks.map(task => {
                  const assignedEmployee = employees.find(e => e.id === task.assignedTo);
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.title}</span>
                          <Badge className={
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <p className="text-xs text-gray-500">
                          Assigned to: {assignedEmployee?.name} | Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(task.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Create Project
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedProjectForm;