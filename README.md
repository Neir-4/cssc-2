# CSSC - Sistem Informasi Penjadwalan & Notifikasi Kelas Prodi

Sistem penjadwalan kelas untuk Prodi Ilmu Komputer USU dengan fitur real-time updates dan notifikasi.

## 🚀 Fitur Utama

### User Roles
- **Mahasiswa**: View jadwal pribadi, subscribe mata kuliah, terima notifikasi
- **Dosen**: View jadwal default + update versi komting (view only)
- **Komting**: Update/ganti jadwal, lihat status ruang, kirim notifikasi

### Core Features
- ✅ Kalender default tiap mata kuliah
- ✅ Update jadwal real-time oleh komting
- ✅ Notifikasi massal (Email & WhatsApp)
- ✅ Status ruangan real-time (occupied/available)
- ✅ Validasi bentrok jadwal otomatis
- ✅ History perubahan jadwal

## 📋 Prerequisites

### Backend Requirements
- Node.js 18+ 
- PostgreSQL 12+
- pgAdmin (untuk database management)

### Frontend Requirements
- Node.js 18+
- Modern browser (Chrome, Firefox, Safari)

## 🛠️ Setup Instructions

### 1. Database Setup

1. **Buat Database di pgAdmin:**
   - Buka pgAdmin
   - Klik kanan pada `Databases` → `Create` → `Database`
   - Name: `cssc_db`
   - Save

2. **Update Environment Variables:**
   ```bash
   # Di folder server/.env
   DB_PASSWORD=your_postgresql_password
   JWT_SECRET=your_long_random_secret_key_here
   ```

### 2. Backend Setup

```bash
# Masuk ke folder server
cd server

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Seed database dengan data contoh
npm run seed

# Start development server
npm run dev
```

Backend akan running di `http://localhost:5000`

### 3. Frontend Setup

```bash
# Masuk ke folder client (buka terminal baru)
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend akan running di `http://localhost:5173`

## 🧪 Testing Credentials

Setelah seeding, Anda bisa login dengan:

### Mahasiswa
- **Email**: `yehezkiel@usu.ac.id`
- **Password**: `password123`

### Dosen
- **Email**: `syukron@usu.ac.id`
- **Password**: `password123`

### Komting
- **Email**: `alya@usu.ac.id`
- **Password**: `password123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses/subscribe` - Subscribe to course
- `DELETE /api/courses/unsubscribe` - Unsubscribe from course
- `GET /api/courses/my/subscriptions` - Get user's subscriptions

### Schedule
- `GET /api/schedule/default` - Get default schedule
- `GET /api/schedule/real` - Get real schedule events
- `POST /api/schedule/update` - Update schedule (komting only)
- `GET /api/schedule/history/:course_id` - Get schedule history

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/status` - Get room status for specific time
- `GET /api/rooms/free-slots` - Get available rooms
- `GET /api/rooms/:id/schedule` - Get room schedule

### Notifications
- `GET /api/notifications/preferences` - Get notification preferences
- `POST /api/notifications/schedule-change` - Send schedule change notification
- `POST /api/notifications/test` - Test notification

## 🗄️ Database Schema

### Tables
- **users**: User data (mahasiswa, dosen, komting)
- **rooms**: Room information (Lab 2, Lab 3, D-101, etc.)
- **courses**: Course data with default schedule
- **course_subscriptions**: Many-to-many relationship users-courses
- **schedule_events**: Real-time schedule changes and updates
- **migrations**: Database migration tracking

## 🔄 Workflow Sistem

1. **Default Schedule Loading**: Sistem load jadwal default dari database
2. **Schedule Change Request**: Dosen → Komting (outside system)
3. **Komting Update**: Komting buka dashboard → update jadwal
4. **Validation**: Backend cek bentrok ruangan
5. **Notification**: Auto-send ke semua subscribers
6. **Real-time Update**: Calendar mahasiswa & dosen update otomatis

## 📱 Notifikasi Setup (Optional)

### Email (Gmail SMTP)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

### WhatsApp (Twilio)
```env
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Pastikan PostgreSQL running
   - Check password di .env
   - Verify database name `cssc_db`

2. **Migration Failed**
   - Drop dan recreate database
   - Run `npm run migrate` lagi

3. **Frontend API Error**
   - Pastikan backend running di port 5000
   - Check VITE_API_URL di client/.env

4. **Authentication Error**
   - Check JWT secret di .env
   - Clear browser localStorage

### Development Tips

- Backend: `npm run dev` untuk auto-restart
- Frontend: `npm run dev` untuk hot reload
- Database: Use pgAdmin untuk inspect data
- API Testing: Use Postman/Insomnia untuk test endpoints

## 🚀 Deployment

### Backend (Production)
```bash
npm install --production
npm start
```

### Frontend (Build)
```bash
npm run build
# Deploy build/ folder to web server
```

## 📄 License

MIT License - CSSC Team

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**Built with ❤️ for Prodi Ilmu Komputer USU**
