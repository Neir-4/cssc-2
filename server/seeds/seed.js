import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await pool.query('TRUNCATE TABLE course_subscriptions, schedule_events, courses, rooms, users RESTART IDENTITY CASCADE');
    console.log('🧹 Cleared existing data');
    
    // Insert Rooms
    const roomsData = [
      { name: 'Lab 2', capacity: 30, floor: '2', building: 'Gedung Lab', description: 'Laboratorium Komputer 2' },
      { name: 'Lab 3', capacity: 30, floor: '2', building: 'Gedung Lab', description: 'Laboratorium Komputer 3' },
      { name: 'GL 1', capacity: 50, floor: '1', building: 'Gedung Kuliah', description: 'Gedung Kuliah Lantai 1' },
      { name: 'D-101', capacity: 40, floor: '1', building: 'Gedung D', description: 'Ruang D-101' },
      { name: 'D-103', capacity: 40, floor: '1', building: 'Gedung D', description: 'Ruang D-103' },
      { name: 'D-104', capacity: 40, floor: '1', building: 'Gedung D', description: 'Ruang D-104' }
    ];
    
    const roomsResult = await pool.query(`
      INSERT INTO rooms (name, capacity, floor, building, description)
      VALUES ${roomsData.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4}, $${i*4+5})`).join(', ')}
      RETURNING id, name
    `, roomsData.flatMap(room => [room.name, room.capacity, room.floor, room.building, room.description]));
    
    console.log('🏫 Rooms created:', roomsResult.rows.map(r => r.name));
    
    // Insert Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const usersData = [
      { name: 'Yehezkiel', email: 'yehezkiel@usu.ac.id', role: 'mahasiswa', phone: '+62812345678' },
      { name: 'Muhammad Syukron Jazila', email: 'syukron@usu.ac.id', role: 'dosen', phone: '+62812345679' },
      { name: 'Alya Debora Panggabean', email: 'alya@usu.ac.id', role: 'komting', phone: '+62812345680' },
      { name: 'Anandhini Medianty Nababan', email: 'anandhini@usu.ac.id', role: 'dosen', phone: '+62812345681' },
      { name: 'Muhammad Dzakwan Attaqiy', email: 'dzakwan@usu.ac.id', role: 'komting', phone: '+62812345682' }
    ];
    
    const usersResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ${usersData.map((_, i) => `($${i*5+1}, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5})`).join(', ')}
      RETURNING id, name, role
    `, usersData.flatMap(user => [user.name, user.email, hashedPassword, user.role, user.phone]));
    
    console.log('👥 Users created:', usersResult.rows.map(u => `${u.name} (${u.role})`));
    
    // Get room IDs
    const rooms = roomsResult.rows.reduce((acc, room) => {
      acc[room.name] = room.id;
      return acc;
    }, {});
    
    // Get user IDs
    const users = usersResult.rows.reduce((acc, user) => {
      acc[user.name] = user.id;
      return acc;
    }, {});
    
    // Insert Courses
    const coursesData = [
      {
        code: 'BD202',
        name: 'Praktikum Basis Data',
        lecturer_id: users['Muhammad Syukron Jazila'],
        komting_id: users['Alya Debora Panggabean'],
        default_day: 1, // Senin
        default_start_time: '08:20:00',
        default_end_time: '10:00:00',
        default_room_id: rooms['Lab 2'],
        semester: 'Ganjil 2024/2025',
        academic_year: '2024/2025'
      },
      {
        code: 'KEB202',
        name: 'Komputerisasi Ekon. & Bisnis',
        lecturer_id: users['Muhammad Syukron Jazila'],
        komting_id: users['Alya Debora Panggabean'],
        default_day: 1, // Senin
        default_start_time: '10:30:00',
        default_end_time: '12:10:00',
        default_room_id: rooms['GL 1'],
        semester: 'Ganjil 2024/2025',
        academic_year: '2024/2025'
      },
      {
        code: 'IELTS202',
        name: 'IELTS Preparation',
        lecturer_id: users['Muhammad Syukron Jazila'],
        komting_id: users['Alya Debora Panggabean'],
        default_day: 2, // Selasa
        default_start_time: '08:50:00',
        default_end_time: '10:30:00',
        default_room_id: rooms['D-101'],
        semester: 'Ganjil 2024/2025',
        academic_year: '2024/2025'
      },
      {
        code: 'SD202',
        name: 'Praktikum Struktur Data (Lanjutan)',
        lecturer_id: users['Anandhini Medianty Nababan'],
        komting_id: users['Muhammad Dzakwan Attaqiy'],
        default_day: 2, // Selasa
        default_start_time: '10:30:00',
        default_end_time: '12:10:00',
        default_room_id: rooms['Lab 2'],
        semester: 'Ganjil 2024/2025',
        academic_year: '2024/2025'
      },
      {
        code: 'KB202',
        name: 'Kecerdasan Buatan',
        lecturer_id: users['Anandhini Medianty Nababan'],
        komting_id: users['Muhammad Dzakwan Attaqiy'],
        default_day: 2, // Selasa
        default_start_time: '13:50:00',
        default_end_time: '16:20:00',
        default_room_id: rooms['D-104'],
        semester: 'Ganjil 2024/2025',
        academic_year: '2024/2025'
      },
      {
        code: 'PW202',
        name: 'Pemrograman Website',
        lecturer_id: users['Anandhini Medianty Nababan'],
        komting_id: users['Muhammad Dzakwan Attaqiy'],
        default_day: 3, // Rabu
        default_start_time: '08:00:00',
        default_end_time: '10:30:00',
        default_room_id: rooms['D-103'],
        semester: 'Ganjil 2024/2025',
        academic_year: '2024/2025'
      }
    ];
    
    const coursesResult = await pool.query(`
      INSERT INTO courses (course_code, name, lecturer_id, komting_id, default_day, default_start_time, default_end_time, default_room_id, semester, academic_year)
      VALUES ${coursesData.map((_, i) => `($${i*9+1}, $${i*9+2}, $${i*9+3}, $${i*9+4}, $${i*9+5}, $${i*9+6}, $${i*9+7}, $${i*9+8}, $${i*9+9}, $${i*9+10})`).join(', ')}
      RETURNING id, course_code, name
    `, coursesData.flatMap(course => [
      course.code, course.name, course.lecturer_id, course.komting_id,
      course.default_day, course.default_start_time, course.default_end_time,
      course.default_room_id, course.semester, course.academic_year
    ]));
    
    console.log('📚 Courses created:', coursesResult.rows.map(c => `${c.course_code} - ${c.name}`));
    
    // Create course subscriptions (Yehezkiel subscribes to all courses)
    const courses = coursesResult.rows.reduce((acc, course) => {
      acc[course.course_code] = course.id;
      return acc;
    }, {});
    
    const subscriptions = Object.values(courses).map(courseId => 
      `(${users['Yehezkiel']}, ${courseId})`
    ).join(', ');
    
    await pool.query(`
      INSERT INTO course_subscriptions (user_id, course_id)
      VALUES ${subscriptions}
    `);
    
    console.log('📝 Course subscriptions created for Yehezkiel');
    
    // Create default schedule events for this week
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const scheduleEvents = [];
    
    coursesData.forEach(course => {
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + (course.default_day - 1)); // 1 = Monday
      
      scheduleEvents.push({
        course_id: courses[course.code],
        room_id: course.default_room_id,
        event_date: eventDate.toISOString().split('T')[0],
        start_time: course.default_start_time,
        end_time: course.default_end_time,
        status: 'default'
      });
    });
    
    if (scheduleEvents.length > 0) {
      await pool.query(`
        INSERT INTO schedule_events (course_id, room_id, event_date, start_time, end_time, status)
        VALUES ${scheduleEvents.map((_, i) => `($${i*5+1}, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5}, $${i*5+6})`).join(', ')}
      `, scheduleEvents.flatMap(event => [
        event.course_id, event.room_id, event.event_date, 
        event.start_time, event.end_time, event.status
      ]));
      
      console.log('📅 Default schedule events created for this week');
    }
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
