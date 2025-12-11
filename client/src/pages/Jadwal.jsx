import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api.js";
import { FaChevronLeft, FaChevronRight, FaExchangeAlt, FaCalendarAlt, FaSearch } from "react-icons/fa";
import RoomAvailability from "../components/RoomAvailability";
import DirectRescheduleForm from "../components/DirectRescheduleForm";

// Helper function to check if a date is within the allowed range (up to Dec 5, 2025)
const isDateInRange = (date) => {
  const maxDate = new Date('2025-12-05T23:59:59');
  return new Date(date) <= maxDate;
};

// Helper function to format time for display
const formatTimeDisplay = (timeStr) => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

const Jadwal = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [showRoomSearch, setShowRoomSearch] = useState(false);
    const [directReschedule, setDirectReschedule] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        date: '',
        startTime: '08:00',
        endTime: '09:30',
        roomId: '',
        roomName: ''
    });

    const START_HOUR = 7;
    const END_HOUR = 23; // Extend to 11 PM
    const ROW_HEIGHT = 60;

    // 5 days only (Senin-Jumat)
    const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Handle reschedule button click
    const handleRescheduleClick = (event) => {
        setSelectedEvent(event);
        setIsRescheduling(true);
        setShowRoomSearch(false);
        setDirectReschedule(false);
        // Pre-fill with current event details
        setNewSchedule({
            date: event.event_date || new Date().toISOString().split('T')[0],
            startTime: event.start_time || '08:00',
            endTime: event.end_time || '09:30',
            roomId: event.room_id || '',
            roomName: event.room_name || ''
        });
    };

    // Handle direct reschedule form change
    const handleScheduleChange = (e) => {
        const { name, value } = e.target;
        setNewSchedule(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle direct reschedule submission
    const handleDirectReschedule = async (scheduleData) => {
        try {
            setRescheduleLoading(true);
            setError('');
            
            // Call API to update the schedule with weekly logic
            await apiService.updateSchedule(scheduleData);
            
            setIsRescheduling(false);
            setDirectReschedule(false);
            setError('');
            
            // Add delay and force refresh
            setTimeout(() => {
                fetchSchedule();
            }, 500);
        } catch (error) {
            console.error('Error rescheduling:', error);
            setError(error.message || 'Gagal mengubah jadwal. Silakan coba lagi.');
        } finally {
            setRescheduleLoading(false);
        }
    };

    // Handle slot selection from RoomAvailability
    const handleSlotSelect = async (slot) => {
        try {
            setRescheduleLoading(true);
            // Calculate week number for the selected date
            const eventDate = new Date(slot.date);
            const semesterStart = new Date('2024-08-26');
            const weekNumber = Math.ceil((eventDate - semesterStart) / (7 * 24 * 60 * 60 * 1000));
            
            // Call API to update the schedule with weekly logic
            await apiService.updateSchedule({
                courseId: selectedEvent.course_id,
                newDate: slot.date,
                newStartTime: slot.start_time,
                newEndTime: slot.end_time,
                newRoomId: slot.room_id || null,
                weekNumber: weekNumber,
                meetingNumber: selectedEvent.meeting_number || null
            });
            
            setShowRoomSearch(false);
            setIsRescheduling(false);
            setError('');
            
            // Add delay and force refresh
            setTimeout(() => {
                fetchSchedule();
            }, 500);
        } catch (error) {
            console.error('Error updating schedule:', error);
            setError(error.message || 'Gagal mengubah jadwal. Silakan coba lagi.');
        } finally {
            setRescheduleLoading(false);
        }
    };

    // Close the reschedule dialog
    const closeRescheduleDialog = () => {
        setIsRescheduling(false);
        setSelectedEvent(null);
        setShowRoomSearch(false);
        setDirectReschedule(false);
    };

    // Filter out dates after December 5, 2025
    const filteredScheduleData = useMemo(() => {
        if (!scheduleData) return [];

        return scheduleData.map(day => ({
            ...day,
            classes: day.classes?.filter(cls => {
                if (!cls.event_date) return true;
                return isDateInRange(cls.event_date);
            })
        }));
    }, [scheduleData]);

    // Helper functions for schedule processing
    const getWeekDateRange = (date) => {
        const monday = getMonday(date);
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        return { monday, friday };
    };

    const convertDefaultToEvents = (defaultSchedule, monday) => {
        const eventsByDate = {};
        defaultSchedule.forEach(course => {
            const eventDate = new Date(monday);
            eventDate.setDate(monday.getDate() + (course.default_day - 1));
            const dateStr = eventDate.toISOString().split('T')[0];
            
            if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
            
            eventsByDate[dateStr].push({
                id: course.id,
                course_id: course.id,
                course_name: course.name,
                lecturer_name: course.lecturer_name,
                room: { name: course.room_name },
                start_time: course.default_start_time?.substring(0, 5) || '08:00',
                end_time: course.default_end_time?.substring(0, 5) || '09:30'
            });
        });
        return { events: eventsByDate };
    };

    const transformScheduleData = (events) => {
        const colorMap = {
            'Pemrograman Website': 'bg-blue-100 text-blue-700',
            'Kecerdasan Buatan': 'bg-purple-100 text-purple-700',
            'Basis Data': 'bg-indigo-100 text-indigo-700',
            'Etika Profesi': 'bg-pink-100 text-pink-700',
            'Wirausaha Digital': 'bg-orange-100 text-orange-700',
            'Struktur Data': 'bg-green-100 text-green-700'
        };

        const schedules = [];
        console.log('🔄 Transforming events:', events);
        
        Object.keys(events).forEach(date => {
            console.log(`📅 Processing date ${date}:`, events[date]);
            events[date].forEach(event => {
                const eventDate = new Date(date);
                const dayOfWeek = eventDate.getDay() === 0 ? 7 : eventDate.getDay();
                
                const transformedEvent = {
                    id: event.id,
                    course_id: event.course_id,
                    course_name: event.course_name,
                    day_of_week: dayOfWeek,
                    start_time: event.start_time,
                    end_time: event.end_time,
                    room_code: event.room?.name || 'TBA',
                    lecturer_name: event.lecturer_name || 'Dosen',
                    event_date: date,
                    color: colorMap[event.course_name] || 'bg-gray-100 text-gray-700'
                };
                
                console.log('➕ Adding event:', transformedEvent);
                schedules.push(transformedEvent);
            });
        });

        console.log('📊 Final transformed schedules:', schedules);
        return schedules;
    };

    // Fetch schedule data from backend
    const fetchSchedule = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const { monday, friday } = getWeekDateRange(currentDate);
            
            let response;
            try {
                response = await apiService.getRealSchedule({
                    start_date: monday.toISOString().split('T')[0],
                    end_date: friday.toISOString().split('T')[0]
                });
            } catch (error) {
                const defaultResponse = await apiService.getDefaultSchedule();
                response = defaultResponse.schedule ? 
                    convertDefaultToEvents(defaultResponse.schedule, monday) : 
                    { events: {} };
            }
            
            const events = response.events || {};
            const transformedData = transformScheduleData(events);
            setScheduleData(transformedData);
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError(err.message || 'Gagal memuat jadwal');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        if (isMounted) {
            fetchSchedule();
        }
        return () => {
            isMounted = false;
        };
    }, [user, currentDate]);

    // Get Monday of the week containing the given date
    const getMonday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        // Ensure we don't mutate the original date
        return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
    };

    // Navigate to previous/next week
    const navigateWeek = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setCurrentDate(newDate);
    };

    // Navigate to specific date
    const navigateToDate = (date) => {
        setCurrentDate(new Date(date));
    };

    // Get week days starting from Monday (5 working days only)
    const getWeekDays = () => {
        const monday = getMonday(currentDate);
        const DAY_INDICES = [1, 2, 3, 4, 5]; // Monday to Friday (1-5)

        return DAY_INDICES.map((apiDayOfWeek, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);

            const classesForDay = scheduleData.filter(s => {
                const scheduleDay = typeof s.day_of_week === 'string' ?
                    parseInt(s.day_of_week, 10) : s.day_of_week;
                return scheduleDay === apiDayOfWeek;
            });

            return {
                dateObj: date,
                dayName: DAY_NAMES[apiDayOfWeek],
                dateNum: date.getDate(),
                classes: classesForDay,
                dayOfWeek: apiDayOfWeek
            };
        });
    };

    // Get calendar days for mini calendar
    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const calculateTopPosition = (timeString) => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        const totalMinutes = (hours * 60) + minutes;
        const startOfDay = START_HOUR * 60; // 7:00 AM in minutes
        const minutesFromStart = totalMinutes - startOfDay;
        return (minutesFromStart / 60) * ROW_HEIGHT;
    };

    const calculateHeight = (startTime, endTime) => {
        if (!startTime || !endTime) return ROW_HEIGHT * 2; // Default height
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = endMinutes - startMinutes;
        return Math.max((duration / 60) * ROW_HEIGHT, ROW_HEIGHT); // Ensure minimum height
    };

    const getCurrentTimePosition = () => {
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        if (hour < START_HOUR || hour > END_HOUR) return null;
        const totalMinutesFromStart = (hour - START_HOUR) * 60 + minute;
        return (totalMinutesFromStart / 60) * ROW_HEIGHT;
    };

    const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
        const hour = START_HOUR + i;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    const weekDays = useMemo(() => getWeekDays(), [currentDate, scheduleData]);
    const calendarDays = useMemo(() => getCalendarDays(), [currentDate]);
    const currentTimeTop = useMemo(() => getCurrentTimePosition(), [currentTime]);

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <div className="min-h-screen bg-[#f5f5f0] pt-24 pb-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Memuat jadwal...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {!loading && (
                    <div className="flex gap-6">
                        {/* LEFT SIDEBAR - Mini Calendar */}
                        <div className="w-64 shrink-0">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => {
                                            const newDate = new Date(currentDate);
                                            newDate.setMonth(newDate.getMonth() - 1);
                                            setCurrentDate(newDate);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded transition"
                                    >
                                        <FaChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            const newDate = new Date(currentDate);
                                            newDate.setMonth(newDate.getMonth() + 1);
                                            setCurrentDate(newDate);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded transition"
                                    >
                                        <FaChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                                        <div key={idx} className="text-center text-xs font-semibold text-gray-500 py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((day, idx) => {
                                        if (!day) {
                                            return <div key={`empty-${idx}`} className="aspect-square"></div>;
                                        }

                                        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                        const isCurrentDay = isToday(dateObj);
                                        const isSelected = dateObj.toDateString() === currentDate.toDateString();

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => navigateToDate(dateObj)}
                                                className={`aspect-square text-sm rounded flex items-center justify-center transition ${
                                                    isCurrentDay
                                                        ? 'bg-blue-600 text-white font-bold'
                                                        : isSelected
                                                        ? 'bg-blue-100 text-blue-600 font-semibold'
                                                        : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE - Schedule Grid */}
                        <div className="flex-1">
                            {/* Week Navigation Header */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => navigateWeek(-1)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition"
                                        title="Previous Week"
                                    >
                                        <FaChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    
                                    <div className="text-center">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {getMonday(currentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - {' '}
                                            {new Date(getMonday(currentDate).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </h2>
                                        <p className="text-sm text-gray-500">Minggu ke-{Math.ceil((currentDate - new Date('2024-08-26')) / (7 * 24 * 60 * 60 * 1000))}</p>
                                    </div>
                                    
                                    <button
                                        onClick={() => navigateWeek(1)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition"
                                        title="Next Week"
                                    >
                                        <FaChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Schedule Grid */}
                            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                {/* Main Schedule Container */}
                                <div className="relative h-[calc(100vh-200px)] overflow-y-auto">
                                    {/* Time slots column - Fixed position */}
                                    <div className="absolute left-0 w-20 z-20 bg-white">
                                        <div className="h-16"></div> {/* Spacer for day headers */}
                                        {timeSlots.map((time, idx) => (
                                            <div
                                                key={idx}
                                                className="h-15 text-xs text-right pr-2 border-r border-gray-200"
                                                style={{ height: `${ROW_HEIGHT}px` }}
                                            >
                                                {time}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Schedule grid */}
                                    <div className="ml-20">
                                        {/* Day headers row - Fixed at the top */}
                                        <div className="grid grid-cols-5 gap-1 sticky top-0 z-20 bg-white">
                                            {weekDays.map((day, dayIdx) => (
                                                <div
                                                    key={`header-${dayIdx}`}
                                                    className={`border-b-2 border-gray-200 p-2 text-center font-medium ${
                                                        isToday(day.dateObj) ? 'bg-blue-50' : ''
                                                    }`}
                                                >
                                                    <div className="font-semibold">{day.dayName}</div>
                                                    <div className={`text-sm ${
                                                        isToday(day.dateObj)
                                                            ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                                                            : 'text-gray-500'
                                                    }`}>
                                                        {day.dateNum}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Schedule content */}
                                        <div className="grid grid-cols-5 gap-1 relative">
                                            {weekDays.map((day, dayIdx) => (
                                                <div
                                                    key={dayIdx}
                                                    className="border border-t-0 border-gray-200 bg-white relative"
                                                    style={{ minHeight: `${(END_HOUR - START_HOUR) * ROW_HEIGHT}px` }}
                                                >

                                                    {/* Schedule items */}
                                                    <div className="relative" style={{ minHeight: `${(END_HOUR - START_HOUR) * ROW_HEIGHT}px` }}>
                                                        {day.classes?.map((cls, clsIdx) => {
                                                            console.log(`🎯 Rendering class for day ${day.dayName}:`, cls);
                                                            const top = calculateTopPosition(cls.start_time);
                                                            const height = calculateHeight(cls.start_time, cls.end_time);

                                                            return (
                                                                <div
                                                                    key={clsIdx}
                                                                    className={`absolute left-1 right-1 rounded p-2 text-xs overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer ${cls.color} z-10`}
                                                                    style={{
                                                                        top: `${top}px`,
                                                                        height: `${height}px`,
                                                                        minHeight: '40px' // Ensure minimum height for visibility
                                                                    }}
                                                                    title={`${cls.course_name}\n${cls.lecturer_name || 'Dosen'}\n${cls.room_code || 'TBA'}`}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="font-semibold truncate">{cls.course_name || 'Mata Kuliah'}</p>
                                                                            <p className="text-xs opacity-75 truncate">
                                                                                {cls.start_time} - {cls.end_time}
                                                                            </p>
                                                                            <p className="text-xs opacity-75 truncate">{cls.room_code || 'TBA'}</p>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRescheduleClick(cls);
                                                                            }}
                                                                            className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                                                                            title="Reschedule"
                                                                        >
                                                                            <FaExchangeAlt size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Current time indicator */}
                                    {currentTimeTop !== null && (
                                        <div
                                            className="absolute left-20 right-0 h-0.5 bg-red-500 z-30 pointer-events-none"
                                            style={{ top: `${64 + currentTimeTop}px` }}
                                        >
                                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reschedule Dialog */}
            {isRescheduling && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Reschedule Kelas</h3>
                            <button 
                                onClick={closeRescheduleDialog}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Detail Kelas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Mata Kuliah:</span>
                                    <span className="ml-2 font-medium">{selectedEvent.course_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dari:</span>
                                    <span className="ml-2 font-medium">
                                        {selectedEvent.event_date} {selectedEvent.start_time}-{selectedEvent.end_time}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Ruangan Saat Ini:</span>
                                    <span className="ml-2 font-medium">{selectedEvent.room_code || 'Belum ditentukan'}</span>
                                </div>
                            </div>
                        </div>

                        {!showRoomSearch && !directReschedule && (
                            <div className="space-y-4">
                                <h4 className="font-medium">Pilih Opsi Reschedule:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowRoomSearch(true)}
                                        className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center h-32"
                                    >
                                        <FaSearch className="text-2xl text-blue-600 mb-2" />
                                        <span className="font-medium">Cari Ruangan Tersedia</span>
                                        <span className="text-sm text-gray-500 mt-1">Temukan slot waktu yang kosong</span>
                                    </button>
                                    <button
                                        onClick={() => setDirectReschedule(true)}
                                        className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center h-32"
                                    >
                                        <FaCalendarAlt className="text-2xl text-green-600 mb-2" />
                                        <span className="font-medium">Atur Langsung</span>
                                        <span className="text-sm text-gray-500 mt-1">Tentukan jadwal secara manual</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {showRoomSearch && (
                            <div className="mt-4">
                                <h4 className="font-medium mb-4">Cari Ruangan Tersedia</h4>
                                <RoomAvailability 
                                    onSelectSlot={handleSlotSelect}
                                    selectedEvent={selectedEvent}
                                />
                            </div>
                        )}

                        {directReschedule && (
                            <DirectRescheduleForm 
                                selectedEvent={selectedEvent}
                                onConfirm={handleDirectReschedule}
                                onCancel={() => setDirectReschedule(false)}
                                rescheduleLoading={rescheduleLoading}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Jadwal;
