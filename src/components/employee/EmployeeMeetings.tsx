
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Video, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';

const EmployeeMeetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);

  useEffect(() => {
    const allMeetings = JSON.parse(localStorage.getItem('meetings') || '[]');
    
    // Filter meetings relevant to the employee
    const relevantMeetings = allMeetings.filter(meeting => 
      meeting.type === 'common' || 
      (meeting.type === 'department' && meeting.department === user?.department)
    );
    
    const now = new Date();
    const upcoming = [];
    const past = [];
    
    relevantMeetings.forEach(meeting => {
      const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
      if (meetingDateTime > now) {
        upcoming.push(meeting);
      } else {
        past.push(meeting);
      }
    });
    
    // Sort by date/time
    upcoming.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    past.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
    
    setMeetings(relevantMeetings);
    setUpcomingMeetings(upcoming);
    setPastMeetings(past);
  }, [user]);

  const getTypeColor = (type) => {
    return type === 'common' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  };

  const formatDateTime = (date, time) => {
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

  const isToday = (dateString) => {
    const meetingDate = new Date(dateString);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateString) => {
    const meetingDate = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return meetingDate.toDateString() === tomorrow.toDateString();
  };

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
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
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
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
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
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
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
              <Calendar className="h-4 w-4" />
              Upcoming Meetings ({upcomingMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.map((meeting, index) => {
                const { date, time } = formatDateTime(meeting.date, meeting.time);
                return (
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
                        
                        <p className="text-gray-600 mb-3">{meeting.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{time} ({meeting.duration} min)</span>
                          </div>
                          {meeting.type === 'department' && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span>{meeting.department}</span>
                            </div>
                          )}
                          {meeting.meetingLink && (
                            <div className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              <span>Online Meeting</span>
                            </div>
                          )}
                        </div>
                        
                        {meeting.agenda && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">Agenda:</p>
                            <p className="text-sm text-gray-600">{meeting.agenda}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        {meeting.meetingLink && (
                          <Button size="sm" asChild>
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                              <Video className="h-3 w-3 mr-1" />
                              Join
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {upcomingMeetings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No upcoming meetings scheduled
                </div>
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
              <Clock className="h-4 w-4" />
              Past Meetings ({pastMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pastMeetings.slice(0, 10).map((meeting, index) => {
                const { date, time } = formatDateTime(meeting.date, meeting.time);
                return (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{meeting.title}</h3>
                          <Badge variant="outline" className={getTypeColor(meeting.type)}>
                            {meeting.type === 'common' ? 'All Staff' : meeting.department}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{meeting.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {pastMeetings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No past meetings found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeMeetings;
