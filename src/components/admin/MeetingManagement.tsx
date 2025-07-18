import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Users, Video, Clock, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from '../ui/use-toast';
import { ref, push, set, onValue, remove, query, orderByChild } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

const MeetingManagement = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    type: 'common',
    department: '',
    meetingLink: '',
    agenda: ''
  });

  const departments = ['Software Development', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing'];

  useEffect(() => {
    if (!user) return;

    const fetchMeetings = async () => {
      try {
        // Get all employees under the current admin
        const employeesRef = ref(database, `users/${user.id}/employees`);
        
        onValue(employeesRef, (employeesSnapshot) => {
          const allMeetings = [];
          const meetingPromises = [];

          employeesSnapshot.forEach((employeeSnapshot) => {
            const employeeId = employeeSnapshot.key;
            const employeeData = employeeSnapshot.val();

            // Get meetings for this employee
            const employeeMeetingsRef = query(
              ref(database, `users/${user.id}/employees/${employeeId}/meetings`),
              orderByChild('date')
            );
            
            const promise = new Promise((resolve) => {
              onValue(employeeMeetingsRef, (meetingsSnapshot) => {
                meetingsSnapshot.forEach((meetingSnapshot) => {
                  const meetingData = meetingSnapshot.val();
                  
                  // For admin, show all meetings
                  if (user.role === 'admin') {
                    allMeetings.push({
                      id: meetingSnapshot.key,
                      ...meetingData,
                      employeeId,
                      employeeName: employeeData.name,
                      employeeDepartment: employeeData.department
                    });
                  } 
                  // For employee, show all meetings (both common and department)
                  else {
                    allMeetings.push({
                      id: meetingSnapshot.key,
                      ...meetingData,
                      employeeId,
                      employeeName: employeeData.name,
                      employeeDepartment: employeeData.department
                    });
                  }
                });
                resolve();
              });
            });

            meetingPromises.push(promise);
          });

          Promise.all(meetingPromises).then(() => {
            // Sort meetings by date and time
            const sortedMeetings = allMeetings.sort((a, b) => {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateA - dateB;
            });

            // Remove duplicates (meetings might appear in multiple employees)
            const uniqueMeetings = [];
            const meetingIds = new Set();
            
            sortedMeetings.forEach(meeting => {
              if (!meetingIds.has(meeting.id)) {
                meetingIds.add(meeting.id);
                uniqueMeetings.push(meeting);
              }
            });

            setMeetings(uniqueMeetings);
          });
        });
      } catch (error) {
        console.error('Error fetching meetings:', error);
        toast({
          variant: 'destructive',
          title: "Error",
          description: "Failed to load meetings"
        });
      }
    };

    fetchMeetings();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const meetingData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        meetingLink: formData.meetingLink,
        agenda: formData.agenda,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        status: 'scheduled',
        type: formData.type,
        department: formData.type === 'department' ? formData.department : 'common'
      };

      if (editingMeeting) {
        // Update existing meeting for all relevant employees
        const employeesRef = ref(database, `users/${user.id}/employees`);
        onValue(employeesRef, (employeesSnapshot) => {
          employeesSnapshot.forEach((employeeSnapshot) => {
            const employeeId = employeeSnapshot.key;
            const employeeData = employeeSnapshot.val();
            
            // For common meetings, update for all employees
            if (formData.type === 'common') {
              const employeeMeetingRef = ref(database, 
                `users/${user.id}/employees/${employeeId}/meetings/${editingMeeting.id}`
              );
              set(employeeMeetingRef, {
                ...meetingData,
                lastUpdated: new Date().toISOString()
              });
            } 
            // For department meetings, update only for that department
            else if (employeeData.department === formData.department) {
              const employeeMeetingRef = ref(database, 
                `users/${user.id}/employees/${employeeId}/meetings/${editingMeeting.id}`
              );
              set(employeeMeetingRef, {
                ...meetingData,
                lastUpdated: new Date().toISOString()
              });
            }
          });
        });

        toast({
          title: "Meeting Updated",
          description: "Meeting has been updated successfully"
        });
      } else {
        // Create new meeting ID
        const newMeetingId = push(ref(database, 'meetingIds')).key;

        // Store meeting for all relevant employees
        const employeesRef = ref(database, `users/${user.id}/employees`);
        onValue(employeesRef, (employeesSnapshot) => {
          employeesSnapshot.forEach((employeeSnapshot) => {
            const employeeId = employeeSnapshot.key;
            const employeeData = employeeSnapshot.val();
            
            // For common meetings, add to all employees
            if (formData.type === 'common') {
              const employeeMeetingRef = ref(database, 
                `users/${user.id}/employees/${employeeId}/meetings/${newMeetingId}`
              );
              set(employeeMeetingRef, meetingData);
            } 
            // For department meetings, add only to employees in that department
            else if (employeeData.department === formData.department) {
              const employeeMeetingRef = ref(database, 
                `users/${user.id}/employees/${employeeId}/meetings/${newMeetingId}`
              );
              set(employeeMeetingRef, meetingData);
            }
          });
        });

        toast({
          title: "Meeting Scheduled",
          description: "Meeting has been scheduled successfully"
        });
      }

      resetForm();
      setShowAddForm(false);
      setEditingMeeting(null);
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to save meeting"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '',
      type: 'common',
      department: '',
      meetingLink: '',
      agenda: ''
    });
  };

  const editMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      type: meeting.type,
      department: meeting.department || '',
      meetingLink: meeting.meetingLink || '',
      agenda: meeting.agenda || ''
    });
    setShowAddForm(true);
  };

  const deleteMeeting = async (meeting) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;

    try {
      // Remove meeting from all employees
      const employeesRef = ref(database, `users/${user.id}/employees`);
      onValue(employeesRef, (employeesSnapshot) => {
        employeesSnapshot.forEach((employeeSnapshot) => {
          const employeeId = employeeSnapshot.key;
          const employeeMeetingRef = ref(database, 
            `users/${user.id}/employees/${employeeId}/meetings/${meeting.id}`
          );
          remove(employeeMeetingRef);
        });
      });

      toast({
        title: "Meeting Deleted",
        description: "Meeting has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to delete meeting"
      });
    }
  };

  const getTypeColor = (type) => {
    return type === 'common' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meeting Management</h1>
          <p className="text-gray-600">Schedule and manage company meetings</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </motion.div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Meeting Title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value, department: value === 'common' ? '' : formData.department})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Meeting Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common Meeting</SelectItem>
                      <SelectItem value="department">Department Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'department' && (
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({...formData, department: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Textarea
                  placeholder="Meeting Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Duration (minutes)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    required
                    min="1"
                  />
                </div>

                <Input
                  placeholder="Meeting Link (optional)"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                />

                <Textarea
                  placeholder="Meeting Agenda (optional)"
                  value={formData.agenda}
                  onChange={(e) => setFormData({...formData, agenda: e.target.value})}
                />

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingMeeting(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Meetings ({meetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetings.map((meeting, index) => (
                <motion.div
                  key={`${meeting.id}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <Badge className={getTypeColor(meeting.type)}>
                          {meeting.type === 'common' ? 'Common' : meeting.department}
                        </Badge>
                        {user?.role === 'admin' && meeting.employeeDepartment && (
                          <span className="text-sm text-gray-500">(Department: {meeting.employeeDepartment})</span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{meeting.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(meeting.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {meeting.time} ({meeting.duration}min)
                        </span>
                        {meeting.meetingLink && (
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            Online
                          </span>
                        )}
                      </div>
                      {meeting.agenda && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Agenda:</p>
                          <p className="text-sm text-gray-600">{meeting.agenda}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {user?.role === 'admin' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editMeeting(meeting)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMeeting(meeting)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                      {meeting.meetingLink && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                            Join
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {meetings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No meetings scheduled
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MeetingManagement;