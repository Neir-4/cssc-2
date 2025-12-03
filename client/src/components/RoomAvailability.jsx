import { useState, useEffect } from 'react';
import apiService from "../services/api";
import { FaCalendarAlt, FaCheck } from 'react-icons/fa';

const RoomAvailability = ({ onSelectSlot, selectedEvent }) => {
    const [step, setStep] = useState(1);
    const [date, setDate] = useState('');
    const [durationType, setDurationType] = useState('default');
    const [customDuration, setCustomDuration] = useState(120);
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [dailySchedule, setDailySchedule] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [courseCredits, setCourseCredits] = useState(null);

    // Fetch course credits to calculate default duration
    useEffect(() => {
        const fetchCourseCredits = async () => {
            if (selectedEvent?.course_id) {
                try {
                    const response = await apiService.getCourseDetails(selectedEvent.course_id);
                    const course = response.course || response; // Handle both response formats
                    
                    // Set credits based on course name if not available in database
                    let credits = course.credits;
                    if (!credits) {
                        // Fallback: set credits based on course name
                        const courseName = selectedEvent.course_name || '';
                        if (courseName.includes('Pemrograman Website') || courseName.includes('Kecerdasan Buatan') || courseName.includes('Basis Data') || courseName.includes('Struktur Data')) {
                            credits = 3;
                        } else if (courseName.includes('Etika Profesi') || courseName.includes('Wirausaha Digital')) {
                            credits = 2;
                        } else {
                            credits = 2; // Default fallback
                        }
                    }
                    
                    setCourseCredits(credits);
                } catch (err) {
                    console.error('Error fetching course credits:', err);
                    // Fallback based on course name
                    const courseName = selectedEvent.course_name || '';
                    let credits = 2;
                    if (courseName.includes('Pemrograman Website') || courseName.includes('Kecerdasan Buatan') || courseName.includes('Basis Data') || courseName.includes('Struktur Data')) {
                        credits = 3;
                    } else if (courseName.includes('Etika Profesi') || courseName.includes('Wirausaha Digital')) {
                        credits = 2;
                    }
                    setCourseCredits(credits);
                }
            }
        };
        fetchCourseCredits();
    }, [selectedEvent]);

    // Calculate duration based on credits or custom input
    const getDurationMinutes = () => {
        if (durationType === 'default' && courseCredits) {
            return courseCredits * 50; // 1 credit = 50 minutes
        }
        return customDuration;
    };

    // Fetch daily schedule for the selected date
    const fetchDailySchedule = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await apiService.getAllSchedules(); // Get all schedules
            const schedules = Array.isArray(response) ? response :
                (response.schedules || response.data?.schedules || []);
            
            const dayOfWeek = new Date(date).getDay(); // 0=Sunday, 1=Monday, etc.
            
            // Filter schedules for the selected day (convert to API day format)
            const apiDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday = 7 in API
            const daySchedules = schedules.filter(schedule => {
                const scheduleDay = typeof schedule.day_of_week === 'string' ?
                    parseInt(schedule.day_of_week, 10) : schedule.day_of_week;
                return scheduleDay === apiDayOfWeek;
            });
            
            setDailySchedule(daySchedules);
            setStep(3);
        } catch (err) {
            setError('Gagal memuat jadwal harian. Silakan coba lagi.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission for step 1-2
    const handleDateTimeSubmit = (e) => {
        e.preventDefault();
        if (!date) {
            setError('Mohon pilih tanggal terlebih dahulu.');
            return;
        }
        fetchDailySchedule();
    };

    // Handle time slot selection
    const handleTimeSlotSelect = async (startTime) => {
        setSelectedStartTime(startTime);
        await fetchAvailableRooms(startTime);
        setStep(4);
    };

    // Fetch available rooms for selected time slot
    const fetchAvailableRooms = async (startTime) => {
        setLoading(true);
        try {
            const endTime = calculateEndTime(startTime);
            const response = await apiService.findAvailableRooms({
                date: date,
                start_time: startTime,
                end_time: endTime
            });
            
            const rooms = Array.isArray(response) ? response :
                (response.rooms || response.data?.rooms || []);
            setAvailableRooms(rooms);
        } catch (err) {
            console.error('Error fetching available rooms:', err);
            // Fallback: show default rooms
            setAvailableRooms([
                { id: 1, name: 'D-101', building: 'Gedung D' },
                { id: 2, name: 'D-102', building: 'Gedung D' },
                { id: 3, name: 'D-103', building: 'Gedung D' },
                { id: 4, name: 'D-104', building: 'Gedung D' },
                { id: 5, name: 'D-105', building: 'Gedung D' },
                { id: 6, name: 'D-106', building: 'Gedung D' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate end time based on start time and duration
    const calculateEndTime = (startTime) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const duration = getDurationMinutes();
        const totalMinutes = hours * 60 + minutes + duration;
        
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    };

    // Handle final confirmation
    const handleConfirmSchedule = () => {
        const endTime = calculateEndTime(selectedStartTime);
        
        onSelectSlot({
            date: date,
            start_time: selectedStartTime,
            end_time: endTime,
            room_id: selectedRoom?.id || null,
            room_name: selectedRoom?.name || 'Akan ditentukan sistem'
        });
    };

    // Generate time slots from 07:00 to 23:00
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 7; hour <= 22; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                
                // Check if this slot is available
                const endTime = calculateEndTime(timeStr);
                const isAvailable = !dailySchedule.some(schedule => {
                    const scheduleStart = schedule.start_time;
                    const scheduleEnd = schedule.end_time;
                    
                    // Check if time slot overlaps with existing schedule
                    return (timeStr >= scheduleStart && timeStr < scheduleEnd) ||
                           (endTime > scheduleStart && endTime <= scheduleEnd) ||
                           (timeStr <= scheduleStart && endTime >= scheduleEnd);
                });
                
                slots.push({
                    time: timeStr,
                    endTime: endTime,
                    available: isAvailable
                });
            }
        }
        return slots;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Step 1-2: Date and Duration Input */}
            {step <= 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FaCalendarAlt className="mr-2" />
                        Pilih Tanggal dan Durasi
                    </h3>
                    
                    <form onSubmit={handleDateTimeSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal yang Dicari
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-2 border rounded"
                                min={new Date().toISOString().split('T')[0]}
                                max="2025-12-31"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Durasi Kelas
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="duration"
                                        value="default"
                                        checked={durationType === 'default'}
                                        onChange={(e) => setDurationType(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span>
                                        Default ({courseCredits ? `${courseCredits} SKS = ${courseCredits * 50} menit` : '2 SKS = 100 menit'})
                                    </span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="duration"
                                        value="custom"
                                        checked={durationType === 'custom'}
                                        onChange={(e) => setDurationType(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span>Custom (menit):</span>
                                    <input
                                        type="number"
                                        min="30"
                                        max="300"
                                        step="30"
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                                        className="ml-2 w-20 p-1 border rounded"
                                        disabled={durationType !== 'custom'}
                                    />
                                </label>
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Memuat...' : 'Lihat Jadwal'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3: Daily Schedule View */}
            {step === 3 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FaCalendarAlt className="mr-2" />
                        Jadwal Harian - {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    
                    <div className="mb-4 text-sm text-gray-600">
                        Durasi: {getDurationMinutes()} menit
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {generateTimeSlots().map((slot, index) => (
                            <div
                                key={index}
                                className={`border rounded p-3 cursor-pointer transition-colors ${
                                    slot.available
                                        ? 'hover:bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                                }`}
                                onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-medium">{slot.time} - {slot.endTime}</span>
                                        {slot.available ? (
                                            <span className="ml-2 text-green-600 text-sm">Tersedia</span>
                                        ) : (
                                            <span className="ml-2 text-red-600 text-sm">Terisi</span>
                                        )}
                                    </div>
                                    {slot.available && (
                                        <FaCheck className="text-green-600" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                        <button
                            onClick={() => setStep(1)}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Room Selection */}
            {step === 4 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FaCheck className="mr-2 text-green-600" />
                        Pilih Ruangan
                    </h3>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium mb-2">Detail Jadwal:</h4>
                        <div className="space-y-1 text-sm">
                            <p><strong>Mata Kuliah:</strong> {selectedEvent?.course_name}</p>
                            <p><strong>Tanggal:</strong> {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p><strong>Waktu:</strong> {selectedStartTime} - {calculateEndTime(selectedStartTime)}</p>
                            <p><strong>Durasi:</strong> {getDurationMinutes()} menit</p>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Ruangan yang Tersedia:
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {loading ? (
                                <div className="text-center py-4">
                                    <span>Memuat ruangan tersedia...</span>
                                </div>
                            ) : (
                                availableRooms.map((room) => (
                                    <label
                                        key={room.id}
                                        className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                                            selectedRoom?.id === room.id
                                                ? 'bg-blue-50 border-blue-300'
                                                : 'hover:bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="room"
                                            value={room.id}
                                            checked={selectedRoom?.id === room.id}
                                            onChange={() => setSelectedRoom(room)}
                                            className="mr-3"
                                        />
                                        <div>
                                            <span className="font-medium">{room.name}</span>
                                            <span className="ml-2 text-sm text-gray-500">{room.building}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(3)}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={() => setStep(5)}
                            disabled={!selectedRoom}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            Lanjut ke Konfirmasi
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Final Confirmation */}
            {step === 5 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FaCheck className="mr-2 text-green-600" />
                        Konfirmasi Perubahan Jadwal
                    </h3>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium mb-2">Detail Perubahan:</h4>
                        <div className="space-y-1 text-sm">
                            <p><strong>Mata Kuliah:</strong> {selectedEvent?.course_name}</p>
                            <p><strong>Tanggal:</strong> {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p><strong>Waktu:</strong> {selectedStartTime} - {calculateEndTime(selectedStartTime)}</p>
                            <p><strong>Durasi:</strong> {getDurationMinutes()} menit</p>
                            <p><strong>Ruangan:</strong> {selectedRoom?.name || 'Akan ditentukan sistem'}</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(4)}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={handleConfirmSchedule}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Konfirmasi Perubahan
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
        </div>
    );
};

export default RoomAvailability;
