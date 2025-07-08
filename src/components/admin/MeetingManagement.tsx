
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Users, Video, Clock, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from '../ui/use-toast';

const MeetingManagement = () => {
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

  const departments = ['Software', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing'];

  useEffect(() => {
    const savedMeetings = JSON.parse(localStorage.getItem('meetings') || '[]');
    setMeetings(savedMeetings);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMeeting) {
      // Update existing meeting
      const updatedMeetings = meetings.map(meeting =>
        meeting.id === editingMeeting.id
          ? { ...meeting, ...formData, lastUpdated: new Date().toISOString() }
          : meeting
      );
      setMeetings(updatedMeetings);
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
      setEditingMeeting(null);
      
      toast({
        title: "Meeting Updated",
        description: "Meeting has been updated successfully"
      });
    } else {
      // Create new meeting
      const newMeeting = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };

      const updatedMeetings = [...meetings, newMeeting];
      setMeetings(updatedMeetings);
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
      
      toast({
        title: "Meeting Scheduled",
        description: "Meeting has been scheduled successfully"
      });
    }
    
    resetForm();
    setShowAddForm(false);
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

  const deleteMeeting = (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      const updatedMeetings = meetings.filter(meeting => meeting.id !== meetingId);
      setMeetings(updatedMeetings);
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
      
      toast({
        title: "Meeting Deleted",
        description: "Meeting has been deleted successfully"
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
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
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
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
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
                  <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
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
                  />
                </div>

                <Input
                  placeholder="Meeting Link (optional)"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                />

                <Textarea
                  placeholder="Meeting Agenda"
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
                  key={meeting.id}
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
                        onClick={() => deleteMeeting(meeting.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
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
