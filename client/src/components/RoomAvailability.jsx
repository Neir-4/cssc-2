import { useState } from 'react';
import apiService from "../services/api";

const RoomAvailability = ({ onSelectSlot, originalDate, originalStartTime, originalEndTime }) => {
    const [date, setDate] = useState(originalDate || '');
    const [startTime, setStartTime] = useState(originalStartTime || '08:00');
    const [endTime, setEndTime] = useState(originalEndTime || '10:30');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await apiService.findAvailableRooms({
                original_date: date,
                original_start_time: startTime,
                original_end_time: endTime,
                from_date: new Date().toISOString().split('T')[0],
                to_date: '2025-12-05'
            });
            setResults(response.data);
        } catch (err) {
            setError('Gagal menemukan ruangan yang tersedia. Silakan coba lagi.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">Cari Ruangan Tersedia</h3>
            
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 border rounded"
                            min={new Date().toISOString().split('T')[0]}
                            max="2025-12-05"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jam Mulai
                        </label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-2 border rounded"
                            step="1800"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jam Selesai
                        </label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-2 border rounded"
                            step="1800"
                            required
                        />
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Mencari...' : 'Cari Ruangan'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {results && (
                <div className="mt-6">
                    <h4 className="font-medium mb-2">Hasil Pencarian:</h4>
                    <div className="space-y-4">
                        {results.map((slot, index) => (
                            <div key={index} className="border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <span className="font-medium">{new Date(slot.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        <span className="mx-2">•</span>
                                        <span>{slot.start_time} - {slot.end_time}</span>
                                        <span className="mx-2">•</span>
                                        <span>{slot.duration_minutes} menit</span>
                                    </div>
                                    <span className="text-sm text-green-600">
                                        {slot.available_rooms.length} ruangan tersedia
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                    {slot.available_rooms.map((room, roomIndex) => (
                                        <div 
                                            key={roomIndex}
                                            className="border p-3 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => onSelectSlot({
                                                ...slot,
                                                room_id: room.room_id,
                                                room_name: room.room_name
                                            })}
                                        >
                                            <div className="font-medium">{room.room_name}</div>
                                            <div className="text-sm text-gray-600">
                                                {room.building} - Lantai {room.floor}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomAvailability;