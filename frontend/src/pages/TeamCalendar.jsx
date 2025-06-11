import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getTeamCalendar, getHolidays } from '../services/leaveService';
import { useAuth } from '../context/AuthContext';
import { MANAGER_DIRECTOR_HR } from '../constants/constant';

const TeamCalendar = () => {
    const { user } = useAuth();
    const [teamData, setTeamData] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState([]);

    // Fetch holidays
    const fetchHolidays = async () => {
        try {
            let holidayData = await getHolidays();
            holidayData = holidayData.holidays || [];
            setHolidays(holidayData);
            console.log("holidayData", holidayData);
            return holidayData;
        } catch (err) {
            console.error('Failed to fetch holidays', err);
            setHolidays([]);
            return [];
        }
    };

    // Fetch team calendar data
    const fetchTeamCalendar = async () => {
        try {
            const data = await getTeamCalendar();
            console.log("data", data);

            setTeamData(data);
            return data;
        } catch (err) {
            console.error('Failed to fetch team calendar data', err);
            toast.error('Failed to load team calendar data');
            setTeamData([]);
            return [];
        }
    };

    // Generate calendar days for the current month
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // Get the first day of the month
        const firstDay = new Date(year, month, 1);
        // Get the last day of the month
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const days = [];

        // Add days to the array
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push(date);
        }

        setCalendarDays(days);
    };

    // Check if a date is a weekend (Saturday or Sunday)
    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    };

    // Check if a date is a holiday
    const isHoliday = (date) => {
        const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        return holidays.includes(dateString);
    };

    // Get holiday name if it exists
    // const getHolidayName = (date) => {
    //     const dateString = date.toISOString().split('T')[0];
    //     const holiday = holidays.find(h => h.date === dateString);
    //     return holiday ? holiday.name : '';
    // };

    // Check if an employee has leave on a specific date
    const getLeaveType = (employeeId, date) => {
        const dateString = date.toISOString().split('T')[0];
        const employee = teamData.find(item => item.employee.id === employeeId);

        if (!employee || !employee.leaves || employee.leaves.length === 0) {
            return null;
        }

        const leave = employee.leaves.find(leave => {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const checkDate = new Date(dateString);

            return checkDate >= startDate && checkDate <= endDate && leave.status === 'approved';
        });

        return leave ? leave.type : null;
    };

    // Format date as DD
    const formatDay = (date) => {
        return date.getDate();
    };

    // Format month and year (shorter version)
    const formatMonthYear = (date) => {
        const options = { month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Navigate to previous month
    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    // Navigate to next month
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Navigate to current month
    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    // Load data when component mounts
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchHolidays(), fetchTeamCalendar()]);

            setLoading(false);
        };

        loadData();
    }, []);

    // Regenerate calendar days when month changes
    useEffect(() => {
        generateCalendarDays();
    }, [currentMonth]);

    // Get cell background color based on leave type, weekend, or holiday
    const getCellStyle = (date, employeeId) => {
        if (isWeekend(date)) {
            return { backgroundColor: '#e5f1b2' }; // Light gray for weekends
        }

        if (isHoliday(date)) {
            return { backgroundColor: '#22c55e' }; // Light orange for holidays
        }

        const leaveType = getLeaveType(employeeId, date);

        if (leaveType === 'sick') {
            return { backgroundColor: '#ef4444' }; // Light red for sick leave
        } else if (leaveType === 'casual') {
            return { backgroundColor: '#7dd3fc' }; // Light green for casual leave
        }
        else if (leaveType === 'lop') {
            return { backgroundColor: '#eab308' }; // Light green for casual leave
        }

        return {};
    };

    if (loading) {
        return <div className="text-center p-5">Loading team calendar...</div>;
    }

    return (
        <div className="team-calendar-container p-2">

            {/* Calendar navigation */}
            <div className="flex justify-between items-center mb-2">
                <button
                    onClick={prevMonth}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                >
                    &lt; Previous
                </button>
                <h3 className="text-sm font-semibold">{formatMonthYear(currentMonth)}</h3>
                <div>
                    <button
                        onClick={goToToday}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-1 text-xs"
                    >
                        Today
                    </button>
                    <button
                        onClick={nextMonth}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                    >
                        Next &gt;
                    </button>
                </div>
            </div>

            {/* Calendar table */}
            <div className="overflow-x-auto mt-5">
                <table className="w-full border border-gray-300 text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-1 sticky left-0 bg-gray-100 z-10 w-20 ">Employee</th>
                            {calendarDays.map((day, index) => (
                                <th
                                    key={index}
                                    className={`border border-gray-300 p-0 text-center w-6 ${isWeekend(day) ? 'bg-gray-200' :
                                        isHoliday(day) ? 'bg-orange-100' : ''
                                        }`}
                                    title={isHoliday(day) ? "Holiday" : ''}
                                >
                                    {/* <div className="font-medium text-[10px]">{formatDay(day)}</div> */}
                                    <div className="text-[8px]">{day.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1)}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {teamData.map((item, index) => (
                            <tr key={index}>
                                <td className="border border-gray-300 p-1 font-medium sticky left-0 bg-white z-10 w-20 truncate" title={item.employee.name}>
                                    {item.employee.name}
                                </td>
                                {calendarDays.map((day, dayIndex) => (
                                    <td
                                        key={dayIndex}
                                        className="border border-gray-300 p-0 text-center w-6 h-6"
                                        style={getCellStyle(day, item.employee.id)}
                                        title={
                                            isHoliday(day) ? "Holiday" :
                                                getLeaveType(item.employee.id, day) ? `${getLeaveType(item.employee.id, day)} leave` : ''
                                        }
                                    >
                                        <div className="font-medium text-[10px]">{formatDay(day)}</div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-2 text-xs mt-5">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#e5f1b2] mr-1"></div>
                    <span>Weekend</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-success mr-1"></div>
                    <span>Holiday</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-danger mr-1"></div>
                    <span>Sick Leave</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-primary-300 mr-1"></div>
                    <span>Casual Leave</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-warning mr-1"></div>
                    <span>LOP</span>
                </div>
            </div>
        </div>
    );
};

export default TeamCalendar;