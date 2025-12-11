import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import apiService from '../services/api';

const DirectRescheduleForm = ({ 
  selectedEvent, 
  onConfirm, 
  onCancel,
  rescheduleLoading 
}) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '08:00',
    endTime: '10:30',
    roomId: ''
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with current event data
  useEffect(() => {
    if (selectedEvent) {
      setFormData({
        date: selectedEvent.event_date || new Date().toISOString().split('T')[0],
        startTime: selectedEvent.start_time || '08:00',
        endTime: selectedEvent.end_time || '10:30',
        roomId: selectedEvent.room_id || ''
      });
    }
  }, [selectedEvent]);

  // Fetch available rooms when date/time changes
  useEffect(() => {
    if (formData.date && formData.startTime && formData.endTime) {
      fetchAvailableRooms();
    }
  }, [formData.date, formData.startTime, formData.endTime]);

  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.getAvailableRooms(
        formData.date,
        formData.startTime,
        formData.endTime
      );
      
      setAvailableRooms(response.available_rooms || []);
      
      // Reset room selection if current room is not available
      if (formData.roomId && !response.available_rooms?.find(r => r.id === parseInt(formData.roomId))) {
        setFormData(prev => ({ ...prev, roomId: '' }));
      }
      
    } catch (err) {
      console.error('Error fetching available rooms:', err);
      setError('Gagal memuat data ruangan tersedia');
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.startTime || !formData.endTime) {
      setError('Mohon isi semua field yang diperlukan');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Tanggal tidak boleh di masa lalu');
      return;
    }

    // Validate time range
    if (formData.startTime >= formData.endTime) {
      setError('Waktu mulai harus lebih awal dari waktu selesai');
      return;
    }

    // Calculate week number
    const eventDate = new Date(formData.date);
    const semesterStart = new Date('2024-08-26');
    const weekNumber = Math.ceil((eventDate - semesterStart) / (7 * 24 * 60 * 60 * 1000));

    onConfirm({
      courseId: selectedEvent.course_id,
      newDate: formData.date,
      newStartTime: formData.startTime,
      newEndTime: formData.endTime,
      newRoomId: formData.roomId || null,
      weekNumber: weekNumber,
      meetingNumber: selectedEvent.meeting_number || null
    });
  };

  // Generate time options (07:00 to 23:00, every 30 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="bg-white p-6 rounded-lg">
      <h4 className="font-medium mb-4 flex items-center">
        <FaCalendarAlt className="mr-2 text-blue-600" />
        Atur Jadwal Langsung
      </h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" />
            Tanggal
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}

            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaClock className="inline mr-1" />
              Waktu Mulai
            </label>
            <select
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaClock className="inline mr-1" />
              Waktu Selesai
            </label>
            <select
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaMapMarkerAlt className="inline mr-1" />
            Ruangan
          </label>
          
          {loading ? (
            <div className="p-2 text-center text-gray-500">
              Memuat ruangan tersedia...
            </div>
          ) : (
            <select
              name="roomId"
              value={formData.roomId}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Pilih ruangan tersedia...</option>
              {availableRooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} - {room.building} (Kapasitas: {room.capacity})
                </option>
              ))}
            </select>
          )}
          
          {availableRooms.length === 0 && !loading && formData.date && formData.startTime && formData.endTime && (
            <p className="text-sm text-red-600 mt-1">
              Tidak ada ruangan tersedia untuk waktu ini. Silakan pilih waktu lain.
            </p>
          )}
        </div>

        {/* Summary */}
        {formData.date && formData.startTime && formData.endTime && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium mb-2">Ringkasan Perubahan:</h5>
            <div className="space-y-1 text-sm">
              <p><strong>Mata Kuliah:</strong> {selectedEvent?.course_name}</p>
              <p><strong>Tanggal:</strong> {new Date(formData.date).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</p>
              <p><strong>Waktu:</strong> {formData.startTime} - {formData.endTime}</p>
              <p><strong>Ruangan:</strong> {
                formData.roomId 
                  ? availableRooms.find(r => r.id === parseInt(formData.roomId))?.name || 'Loading...'
                  : 'Belum dipilih'
              }</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Kembali
          </button>
          
          <button
            type="submit"
            disabled={rescheduleLoading || !formData.roomId || availableRooms.length === 0}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {rescheduleLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DirectRescheduleForm;