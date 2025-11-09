# 💰 Splitaa - Smart Expense Splitter

> Split bills, track expenses, and settle up with friends effortlessly.

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Angular](https://img.shields.io/badge/Angular-20.3-red.svg)](https://angular.io/)
[![PHP](https://img.shields.io/badge/PHP-7.4+-purple.svg)](https://php.net/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 Overview

Splitaa is a comprehensive expense splitting platform designed to help groups manage shared expenses efficiently. Whether it's a trip with friends, shared household bills, or group dining, Splitaa makes it simple to track who paid what and who owes whom.

### ✨ Key Features

- 🔐 **Secure Authentication** - Email/password and Google OAuth via Clerk
- 👥 **Group Management** - Create groups for trips, households, or events
- 💸 **Expense Tracking** - Add expenses with custom splits and categories
- 🧮 **Smart Settlements** - Optimized balance calculation and payment tracking
- 📊 **Admin Dashboard** - Comprehensive analytics and user management
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎫 **QR Code Support** - Generate and scan codes for quick group joining

## 🏗️ Architecture

The project consists of three main applications:

```
📦 Splitaa
├── 🎨 Client (React + Vite)      # User-facing web application
├── 🔧 Admin (Angular 20)         # Admin dashboard and analytics
└── ⚙️  Server (PHP + MySQL)      # RESTful API backend
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PHP** 7.4+ with MySQL
- **Apache/XAMPP** or any PHP server
- **Clerk Account** (for authentication)

### Installation

```powershell
# 1. Clone the repository
git clone https://github.com/SN7k/Splitaa.git
cd Splitaa

# 2. Setup Backend
cd server
# Import database/schema.sql into MySQL
# Configure config/database.php with your credentials

# 3. Setup Client
cd ../client
npm install
# Create .env file with your Clerk key:
# VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
# VITE_API_URL=http://localhost:8000/api

# 4. Setup Admin (Optional)
cd ../admin
npm install
```

### Running the Application

```powershell
# Terminal 1 - Start Backend
cd server/public
php -S localhost:8000

# Terminal 2 - Start Client
cd client
npm run dev
# Access at http://localhost:5173

# Terminal 3 - Start Admin (Optional)
cd admin
npm start
# Access at http://localhost:4200
```

## 📚 Documentation

Detailed guides available in the `/doc` folder:

- 📖 [Quick Start Guide](doc/QUICK_START.md)
- 🔐 [Clerk Authentication Setup](doc/CLERK_SETUP.md)
- 🚀 [Deployment Guide](doc/DEPLOYMENT.md)
- 🔌 [API Documentation](doc/API_CONNECTED.md)
- 🗄️ [Database Models](server/MODELS.md)
- 👨‍💼 [Admin Panel Guide](admin/ADMIN_PANEL_GUIDE.md)

## 🛠️ Tech Stack

### Frontend (Client)
- **React 18.3** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Bootstrap 5** - UI framework
- **Clerk** - Authentication
- **QR Code** - Generate and scan QR codes

### Backend (Server)
- **PHP 7.4+** - Server-side language
- **MySQL 5.7+** - Database
- **JWT** - Token-based authentication
- **RESTful API** - Clean architecture with MVC pattern

### Admin Dashboard
- **Angular 20** - Progressive web framework
- **TypeScript** - Type-safe development
- **Bootstrap** - Responsive UI components

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/{id}` - Get expense details
- `DELETE /api/expenses/{id}` - Delete expense

### Groups
- `GET /api/groups` - List user groups
- `POST /api/groups` - Create new group
- `POST /api/groups/{id}/add-member` - Add member to group

### Settlements
- `GET /api/settlements` - List settlements
- `POST /api/settlements` - Record payment
- `GET /api/settlements/calculate` - Calculate balances

*Full API documentation available in [server/README.md](server/README.md)*

## 🎨 Features in Detail

### User Features
- ✅ Email/password and social login
- ✅ Add friends and manage friend list
- ✅ Create and join expense groups
- ✅ Track individual and group expenses
- ✅ Split expenses equally or custom amounts
- ✅ View balance with friends
- ✅ Record and track settlements
- ✅ Generate group invite QR codes

### Admin Features
- ✅ User management dashboard
- ✅ Expense analytics and reports
- ✅ Group activity monitoring
- ✅ System health metrics
- ✅ Data export capabilities

## 🔒 Security

- JWT-based authentication with secure token handling
- Password hashing using bcrypt
- CORS protection
- SQL injection prevention with prepared statements
- Environment-based configuration
- Secure OAuth implementation via Clerk

## 🌐 Deployment

Splitaa can be deployed to various platforms:

- **Client**: Netlify, Vercel, or any static hosting
- **Server**: Traditional hosting (cPanel), Google Cloud, or Docker
- **Database**: MySQL, Aiven, or any MySQL-compatible service

Deployment guides available:
- [Google Cloud Platform](doc/GCP_DEPLOYMENT_GUIDE.md)
- [Alwaysdata Hosting](doc/ALWAYSDATA_DEPLOY.md)
- [InfinityFree Hosting](doc/INFINITYFREE_DEPLOYMENT.md)

## 🧪 Testing

```powershell
# Test backend API
curl http://localhost:8000/health

# Test authentication
# See doc/POSTMAN_TESTING_GUIDE.md for detailed API testing
```

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Development Team

Crafted with passion by a dedicated team:

- **[@SN7k](https://github.com/SN7k)** - Team Lead | Full-Stack Developer (Frontend & Backend)
- **[@RAHUL](https://github.com/rahul771RGX)** - Frontend Developer
- **[@SAPTARSHI](https://github.com/SAPTARSHI5950)** - Testing, Documentation & Research

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Made with passion for making expense splitting simple and stress-free! 🚀**
