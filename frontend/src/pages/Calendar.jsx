import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { teamLeaves, allLeaves, getMyLeaves, getHolidays } from '../services/leaveService';
import { useAuth } from '../context/AuthContext';
import { MANAGER_DIRECTOR_HR } from '../constants/constant';

const leaveColors = {
  casual: 'bg-primary-300',
  sick: 'bg-danger',
  lop: 'bg-warning',
};

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const canViewTeamLeaves = MANAGER_DIRECTOR_HR.includes(user.role);

  const [viewMode, setViewMode] = useState('individual');


  const fetchHolidays = async () => {
    try {
      let holidayData = await getHolidays();
      holidayData = holidayData.holidays;
      // console.log("holidayData", holidayData);
      const transformed = holidayData.map((holiday) => ({
        title: 'holiday',
        start: holiday,
        end: holiday,
        display: 'background',
        backgroundColor: '#10b981',
        borderColor: 'transparent',
        extendedProps: {
          type: 'holiday',
          description: holiday.description || 'Holiday',
        },
      }));

      setHolidays(transformed);
      return transformed;
    } catch (err) {
      console.error('Failed to fetch holidays', err);
      setHolidays([]);
      return [];
    }
  };

  const fetchTeamLeaves = async (holidayEvents = holidays) => {
    try {
      setLoading(true);
      let responseData = await teamLeaves();
      if (user.role === 'hr') {
        responseData = await allLeaves();
      }
      const leaves = responseData.filter((leave) => leave.status === 'approved');
      console.log("leaves", leaves)
      const leaveEvents = leaves.map((leave) => ({
        title: `${leave.employee?.name || user.name}`,
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
      }));

      setEvents([...leaveEvents, ...holidayEvents]);
    } catch (err) {
      toast.error('Failed to fetch team leaves');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLeaves = async (holidayEvents = holidays) => {
    try {
      setLoading(true);
      const myLeaves = await getMyLeaves();
      const leaves = myLeaves.filter((leave) => leave.status === 'approved');

      const leaveEvents = leaves.map((leave) => ({
        title: leave.employee?.name || user.name,
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
      }));
      
      setEvents([...leaveEvents, ...holidayEvents]);
    } catch (err) {
      setEvents([]);
      toast.error('Failed to fetch my leaves');
    } finally {
      setLoading(false);
    }
  };

  // Toggling between team and individual view
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    if(mode === 'individual') {
      fetchMyLeaves(holidays);
    }
    else {
      fetchTeamLeaves(holidays);
    } 
  };

  useEffect(() => {
    const initializeCalendar = async () => {
      const holidayEvents = await fetchHolidays();
      
      if(canViewTeamLeaves && viewMode === 'team') {
        await fetchTeamLeaves(holidayEvents);
      }
      else {
        await fetchMyLeaves(holidayEvents);
      }
    };
    
    initializeCalendar();
  }, []);

  const eventContent = (eventInfo) => {
    if (eventInfo.event.display === 'background') {
      return null;
    }
    
    const leaveType = eventInfo.event.extendedProps.type;
    let bgColor = '';
    
    if (leaveType === 'casual') {
      bgColor = 'bg-primary-300';
    } else if (leaveType === 'sick') {
      bgColor = 'bg-danger';
    } else if (leaveType === 'holiday') {
      bgColor = 'bg-success';
    } else {
      bgColor = 'bg-warning';
    }
    
    return (
      <div className="flex flex-col w-full">
        <span className={`font-semibold text-[10px] h-4 border px-1 overflow-hidden ${bgColor} text-white text-center`}>
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  const handleEventMouseEnter = (info) => {
    if (info.event.display === 'background') {
      return;
    }
    
    const extendedProps = info.event.extendedProps;
    const tooltip = document.createElement('div');
    tooltip.className =
      'fixed z-50 p-2 rounded shadow-lg bg-white border text-xs text-gray-900';
    tooltip.style.top = info.jsEvent.clientY + 10 + 'px';
    tooltip.style.left = info.jsEvent.clientX + 10 + 'px';
    
    if (extendedProps.type === 'holiday') {
      tooltip.innerHTML = `<b>${info.event.title}</b><br/>Holiday`;
    } else {
      const { employee, type, reason, status } = extendedProps;
      tooltip.innerHTML = `<b>${employee}</b><br/>Type: ${type}<br/>Status: ${status}<br/>Reason: ${reason}`;
    }
    
    tooltip.id = 'calendar-tooltip';
    document.body.appendChild(tooltip);
  };

  const handleEventMouseLeave = () => {
    const tooltip = document.getElementById('calendar-tooltip');
    if (tooltip) tooltip.remove();
  };

  return (
    <>
      {canViewTeamLeaves && (
        <div className="flex mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => toggleViewMode('team')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${viewMode === 'team'
                ? 'bg-[#2C3E50] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                } border border-gray-200`}
            >
              Team
            </button>
            <button
              type="button"
              onClick={() => toggleViewMode('individual')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${viewMode === 'individual'
                ? 'bg-[#2C3E50] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                } border border-gray-200`}
            >
              Individual
            </button>
          </div>
        </div>
      )}

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
            height="380px"
          />
        )}
        <div className="mt-4 flex space-x-4 text-sm">
          <span className="flex items-center"><span className="w-4 h-4 rounded bg-primary-300 inline-block mr-2"></span>Casual Leave</span>
          <span className="flex items-center"><span className="w-4 h-4 rounded bg-danger inline-block mr-2"></span>Sick Leave</span>
          <span className="flex items-center"><span className="w-4 h-4 rounded bg-warning inline-block mr-2"></span>Loss of Pay</span>
          <span className="flex items-center"><span className="w-4 h-4 rounded bg-success inline-block mr-2"></span>Holiday</span>
        </div>
      </div>
    </>

  );
};

export default Calendar; 