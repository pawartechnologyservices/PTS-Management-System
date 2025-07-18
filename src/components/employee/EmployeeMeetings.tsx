import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Video, Building, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { toast } from 'react-hot-toast';

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  type: 'common' | 'department';
  department?: string;
  meetingLink?: string;
  agenda?: string;
  createdAt?: number;
  employeeId?: string;
  employeeName?: string;
}

const EmployeeMeetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !user?.adminUid) {
      console.error("User ID or Admin UID not available");
      setLoading(false);
      return;
    }

    setLoading(true);
    const meetingsRef = ref(database, `users/${user.adminUid}/employees/${user.id}/meetings`);
    const meetingsQuery = query(meetingsRef, orderByChild('date'));

    const unsubscribe = onValue(meetingsQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const meetingsData: Meeting[] = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Meeting, 'id'>)
          }));

          // Process meetings
          const now = new Date();
          const upcoming: Meeting[] = [];
          const past: Meeting[] = [];
          
          meetingsData.forEach((meeting) => {
            const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
            if (meetingDateTime.getTime() > now.getTime()) {
              upcoming.push(meeting);
            } else {
              past.push(meeting);
            }
          });

          // Sort meetings
          upcoming.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
          past.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

          setMeetings(meetingsData);
          setUpcomingMeetings(upcoming);
          setPastMeetings(past);
        } else {
          setMeetings([]);
          setUpcomingMeetings([]);
          setPastMeetings([]);
        }
      } catch (error) {
        console.error("Error fetching meetings data:", error);
        toast.error("Failed to load meetings");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const getTypeColor = (type: string) => {
    return type === 'common' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  };

  const formatDateTime = (date: string, time: string) => {
    const meetingDate = new Date(`${date}T${time}`);
    return {
      date: meetingDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: meetingDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const isToday = (dateString: string) => {
    const meetingDate = new Date(dateString);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateString: string) => {
    const meetingDate = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return meetingDate.toDateString() === tomorrow.toDateString();
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-800">My Meetings</h1>
          <p className="text-gray-600">View your scheduled meetings and events</p>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Meetings</p>
                  <p className="text-xl font-bold">{meetings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-xl font-bold text-green-600">{upcomingMeetings.length}</p>
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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-xl font-bold text-purple-600">
                    {upcomingMeetings.filter(meeting => {
                      const meetingDate = new Date(meeting.date);
                      const today = new Date();
                      const weekFromToday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                      return meetingDate >= today && meetingDate <= weekFromToday;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Meetings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Meetings ({upcomingMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No upcoming meetings</h3>
                  <p className="text-gray-500 mt-1">
                    You don't have any meetings scheduled yet
                  </p>
                </div>
              ) : (
                upcomingMeetings.map((meeting, index) => {
                  const { date, time } = formatDateTime(meeting.date, meeting.time);
                  return (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4 w-full sm:w-auto">
                        <div className="text-center min-w-[40px]">
                          <p className="text-lg font-semibold">
                            {new Date(meeting.date).getDate()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{meeting.title}</h3>
                            <Badge className={getTypeColor(meeting.type)}>
                              {meeting.type === 'common' ? 'All Staff' : meeting.department}
                            </Badge>
                            {isToday(meeting.date) && (
                              <Badge className="bg-red-100 text-red-700">Today</Badge>
                            )}
                            {isTomorrow(meeting.date) && (
                              <Badge className="bg-orange-100 text-orange-700">Tomorrow</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{time} ({meeting.duration} min)</span>
                            </div>
                            {meeting.meetingLink && (
                              <div className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                <span>Online Meeting</span>
                              </div>
                            )}
                          </div>
                          
                          {meeting.agenda && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700">Agenda:</p>
                              <p className="text-xs text-gray-600">{meeting.agenda}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 sm:mt-0 w-full sm:w-auto">
                        {meeting.meetingLink && (
                          <Button 
                            size="sm" 
                            asChild
                            className="w-full sm:w-auto"
                          >
                            <a 
                              href={meeting.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Join Meeting
                            </a>
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Past Meetings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Past Meetings ({pastMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {pastMeetings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No past meetings found
                </div>
              ) : (
                pastMeetings.map((meeting, index) => {
                  const { date, time } = formatDateTime(meeting.date, meeting.time);
                  return (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start justify-between p-4 border rounded-lg opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-center min-w-[40px] opacity-70">
                          <p className="text-lg font-semibold">
                            {new Date(meeting.date).getDate()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{meeting.title}</h3>
                            <Badge variant="outline" className={getTypeColor(meeting.type)}>
                              {meeting.type === 'common' ? 'All Staff' : meeting.department}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{meeting.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {time}
                            </span>
                          </div>
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

export default EmployeeMeetings;