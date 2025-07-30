import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Users, Video, Clock, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from 'react-hot-toast';
import { ref, push, set, onValue, remove, query, orderByChild } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const JitsiMeeting = lazy(() => import('@jitsi/react-sdk').then(mod => ({ default: mod.JitsiMeeting })));

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  type: 'common' | 'department';
  department?: string;
  meetingLink: string;
  agenda?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
  employeeId?: string;
  employeeName?: string;
  employeeDepartment?: string;
}

const MeetingManagement = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(new Date().getTime() + 30 * 60000), 'HH:mm'),
    duration: '30',
    type: 'common',
    department: '',
    agenda: ''
  });

  const departments = ['Software Development', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing'];

  useEffect(() => {
    if (!user) return;

    const fetchMeetings = async () => {
      try {
        const employeesRef = ref(database, `users/${user.id}/employees`);
        
        onValue(employeesRef, (employeesSnapshot) => {
          const allMeetings: Meeting[] = [];
          const meetingPromises: Promise<void>[] = [];

          employeesSnapshot.forEach((employeeSnapshot) => {
            const employeeId = employeeSnapshot.key;
            const employeeData = employeeSnapshot.val();

            const employeeMeetingsRef = query(
              ref(database, `users/${user.id}/employees/${employeeId}/meetings`),
              orderByChild('date')
            );
            
            const promise = new Promise<void>((resolve) => {
              onValue(employeeMeetingsRef, (meetingsSnapshot) => {
                meetingsSnapshot.forEach((meetingSnapshot) => {
                  const meetingData = meetingSnapshot.val() as Meeting;
                  
                  allMeetings.push({
                    id: meetingSnapshot.key,
                    ...meetingData,
                    employeeId,
                    employeeName: employeeData.name,
                    employeeDepartment: employeeData.department
                  });
                });
                resolve();
              });
            });

            meetingPromises.push(promise);
          });

          Promise.all(meetingPromises).then(() => {
            const sortedMeetings = allMeetings.sort((a, b) => {
              const dateA = new Date(`${a.date} ${a.time}`).getTime();
              const dateB = new Date(`${b.date} ${b.time}`).getTime();
              return dateA - dateB;
            });

            const uniqueMeetings = Array.from(new Map(sortedMeetings.map(m => [m.id, m])).values());
            setMeetings(uniqueMeetings);
          });
        });
      } catch (error) {
        console.error('Error fetching meetings:', error);
        toast.error('Failed to load meetings');
      }
    };

    fetchMeetings();
  }, [user]);

  const generateMeetingLink = (meetingId: string) => {
    return `hrms-meeting-${meetingId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const meetingId = editingMeeting?.id || push(ref(database, 'meetingIds')).key;
      if (!meetingId) throw new Error('Failed to generate meeting ID');

      const meetingLink = generateMeetingLink(meetingId);
      
      const meetingData: Meeting = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        meetingLink,
        agenda: formData.agenda,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        status: 'scheduled',
        type: formData.type as 'common' | 'department',
        department: formData.type === 'department' ? formData.department : 'common'
      };

      const employeesRef = ref(database, `users/${user.id}/employees`);
      onValue(employeesRef, (employeesSnapshot) => {
        employeesSnapshot.forEach((employeeSnapshot) => {
          const employeeId = employeeSnapshot.key;
          const employeeData = employeeSnapshot.val();
          
          if (formData.type === 'common' || employeeData.department === formData.department) {
            const employeeMeetingRef = ref(database, 
              `users/${user.id}/employees/${employeeId}/meetings/${meetingId}`
            );
            set(employeeMeetingRef, meetingData);
          }
        });
      });

      toast.success(editingMeeting ? 'Meeting updated successfully' : 'Meeting scheduled successfully');
      resetForm();
      setShowAddForm(false);
      setEditingMeeting(null);
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast.error('Failed to save meeting');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(new Date().getTime() + 30 * 60000), 'HH:mm'),
      duration: '30',
      type: 'common',
      department: '',
      agenda: ''
    });
  };

  const editMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      type: meeting.type,
      department: meeting.department || '',
      agenda: meeting.agenda || ''
    });
    setShowAddForm(true);
  };

  const deleteMeeting = async (meeting: Meeting) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    if (!user) return;

    try {
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

      toast.success('Meeting deleted successfully');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  const startMeeting = (meeting: Meeting) => {
    setActiveMeeting(meeting);
  };

  const handleJitsiClose = () => {
    setActiveMeeting(null);
  };

  const getTypeColor = (type: string) => {
    return type === 'common' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  };

  const isMeetingActive = (meeting: Meeting) => {
    const now = new Date();
    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
    const meetingEnd = new Date(meetingDate.getTime() + parseInt(meeting.duration) * 60000);
    return now >= meetingDate && now <= meetingEnd;
  };

  return (
    <div className="space-y-6">
      {activeMeeting && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{activeMeeting.title}</h3>
              <Button variant="outline" onClick={handleJitsiClose}>
                Close Meeting
              </Button>
            </div>
            <div className="h-[calc(90vh-60px)]">
              <Suspense fallback={<div className="flex items-center justify-center h-full">Loading meeting...</div>}>
                <JitsiMeeting
                  roomName={`hrms-meeting-${activeMeeting.id}`}
                  getIFrameRef={(iframeRef: HTMLIFrameElement) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                  }}
                  configOverwrite={{
                    startWithAudioMuted: true,
                    startWithVideoMuted: true,
                    enableWelcomePage: false,
                    disableModeratorIndicator: true,
                    enableNoisyMicDetection: false,
                    enableClosePage: false,
                  }}
                  interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_CHROME_EXTENSION_BANNER: false,
                    MOBILE_APP_PROMO: false,
                    HIDE_INVITE_MORE_HEADER: true,
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

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
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      type: value as 'common' | 'department',
                      department: value === 'common' ? '' : formData.department
                    })}
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
                    min={format(new Date(), 'yyyy-MM-dd')}
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
              {meetings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No meetings scheduled
                </div>
              ) : (
                meetings.map((meeting) => {
                  const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
                  const isActive = isMeetingActive(meeting);
                  const isPast = new Date() > new Date(meetingDate.getTime() + parseInt(meeting.duration) * 60000);

                  return (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        isActive ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{meeting.title}</h3>
                            <Badge className={getTypeColor(meeting.type)}>
                              {meeting.type === 'common' ? 'Common' : meeting.department}
                            </Badge>
                            {isActive && (
                              <Badge className="bg-green-100 text-green-700">Live Now</Badge>
                            )}
                            {isPast && (
                              <Badge variant="outline">Completed</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2">{meeting.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {meetingDate.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {meeting.time} ({meeting.duration}min)
                            </span>
                            <span className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              {meeting.meetingLink ? 'Online' : 'In-Person'}
                            </span>
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
                            onClick={() => deleteMeeting(meeting)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                          {meeting.meetingLink && (isActive || user?.role === 'admin') && (
                            <Button 
                              size="sm" 
                              onClick={() => startMeeting(meeting)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {isActive ? 'Join' : 'Start'} Meeting
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MeetingManagement;