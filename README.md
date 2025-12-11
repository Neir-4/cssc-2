# CSSC - CompScie Smart Class

A comprehensive scheduling system for Computer Science classes with real-time updates and notifications.

## Project Structure

```
CSSC-main/
├── client/          # React frontend application
│   ├── src/         # Source code
│   ├── public/      # Static assets
│   └── package.json # Frontend dependencies
└── server/          # Node.js backend API
    ├── config/      # Database configuration
    ├── middleware/  # Express middleware
    ├── migrations/  # Database migrations
    ├── routes/      # API routes
    ├── scripts/     # Utility scripts
    ├── seeds/       # Database seeding
    ├── setup/       # Setup and maintenance files
    ├── debug/       # Debug and testing utilities
    └── server.js    # Main application entry point
```

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Seed the database:
   ```bash
   npm run seed
   ```

6. Start the server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### Frontend Setup

1. Navigate to client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- **User Authentication**: Secure login system with JWT tokens
- **Role-based Access**: Different permissions for Admin and Komting
- **Schedule Management**: Create, update, and manage class schedules
- **Room Booking**: Check room availability and book classrooms
- **Real-time Updates**: Live notifications for schedule changes
- **Course Materials**: Upload and access course materials
- **Announcements**: Create and view important announcements
- **Responsive Design**: Works on desktop and mobile devices

## API Documentation

The backend provides RESTful APIs for:

- `/api/auth` - Authentication and user management
- `/api/courses` - Course management and subscriptions
- `/api/schedule` - Schedule operations and updates
- `/api/rooms` - Room availability and booking
- `/api/announcements` - Announcement system
- `/api/notifications` - Real-time notifications

## Development

### Available Scripts (Backend)

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm run debug:db` - Test database connection
- `npm run setup:phase1` - Initial setup

### Available Scripts (Frontend)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

Create a `.env` file in the server directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cssc_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.