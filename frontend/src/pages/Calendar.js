import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const leaveColors = {
  casual: 'bg-primary-300',
  sick: 'bg-danger',
  lop: 'bg-warning',
};

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        let url = 'http://localhost:7000/api/leave/team-leaves';
        if (user.role === 'hr') {
          url = 'http://localhost:7000/api/leave/all';
        }
        const response = await axios.get(url);
        const leaves = response.data;
        setEvents(
          leaves.map((leave) => ({
            title: `${leave.employee?.name || user.name} (${leave.type})`,
            start: leave.startDate,
            end: leave.endDate,
            backgroundColor:
              leave.type === 'casual'
                ? '#38bdf8'
                : leave.type === 'sick'
                ? '#ef4444'
                : '#eab308',
            borderColor: '#fff',
            extendedProps: {
              employee: leave.employee?.name || user.name,
              type: leave.type,
              reason: leave.reason,
              status: leave.status,
            },
          }))
        );
      } catch (err) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
    // eslint-disable-next-line
  }, []);

  const eventContent = (eventInfo) => {
    return (
      <div className="flex flex-col">
        <span className=" font-semibold text-sm">{eventInfo.event.title}</span>
      </div>
    );
  };

  const handleEventMouseEnter = (info) => {
    const { employee, type, reason, status } = info.event.extendedProps;
    const tooltip = document.createElement('div');
    tooltip.className =
      'fixed z-50 p-2 rounded shadow-lg bg-white border text-xs text-gray-900';
    tooltip.style.top = info.jsEvent.clientY + 10 + 'px';
    tooltip.style.left = info.jsEvent.clientX + 10 + 'px';
    tooltip.innerHTML = `<b>${employee}</b><br/>Type: ${type}<br/>Status: ${status}<br/>Reason: ${reason}`;
    tooltip.id = 'calendar-tooltip';
    document.body.appendChild(tooltip);
  };

  const handleEventMouseLeave = () => {
    const tooltip = document.getElementById('calendar-tooltip');
    if (tooltip) tooltip.remove();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 max-h-[80vh] overflow-auto">
      {loading ? (
        <div className="text-center py-8">Loading calendar...</div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventContent={eventContent}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          height="auto"
        />
      )}
      <div className="mt-4 flex space-x-4">
        <span className="flex items-center"><span className="w-4 h-4 rounded bg-primary-300 inline-block mr-2"></span>Casual Leave</span>
        <span className="flex items-center"><span className="w-4 h-4 rounded bg-danger inline-block mr-2"></span>Sick Leave</span>
        <span className="flex items-center"><span className="w-4 h-4 rounded bg-warning inline-block mr-2"></span>Loss of Pay</span>
      </div>
    </div>
  );
};

export default Calendar; 