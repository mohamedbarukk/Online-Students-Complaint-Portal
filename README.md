# Online Students Complaint Portal

## Overview
The Online Students Complaint Portal is a digital platform designed to help students submit, track, and manage complaints efficiently.  
It promotes transparency, accountability, and timely resolution by facilitating structured communication between students and administrators.

---

## Features
- Complaint submission with category and description.
- Real-time complaint status tracking.
- Admin dashboard for complaint review and resolution.
- Email notifications for updates and resolutions.
- Secure authentication for students and administrators.
- File attachment support for complaint evidence.

---

## Technology Stack

| Layer | Technologies Used |
|--------|-------------------|
| **Frontend** | React.js, CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL |
| **Authentication & Security** | JWT, bcrypt.js |
| **Other Tools** | Nodemailer, Multer |

---

## System Architecture
The application follows a modular **MERN-like architecture**:
1. **Frontend (React)** – Handles user interface and API communication.
2. **Backend (Node + Express)** – Processes API requests and connects to the database.
3. **Database (MySQL)** – Stores user, complaint, and admin data.

---

## Installation and Setup

### Prerequisites
Ensure the following are installed:
- Node.js (v16 or above)
- MySQL Server
- Git

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/mohamedbarukk/Online-Students-Complaint-Portal.git
   cd Online-Students-Complaint-Portal
   ```

2. Set up the backend:
   ```bash
   cd backend
   npm install
   npm start
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. Access the application in your browser at:
   ```
   http://localhost:5173
   ```

---

## Folder Structure
```
Online-Students-Complaint-Portal/
│
├── backend/          # Node.js + Express API
├── frontend/         # React.js frontend
├── .gitignore
├── LICENSE
└── README.md
```

---

## Future Enhancements
- Integration with institution ERP systems.
- Role-based access control for multiple authority levels.
- Mobile application for Android/iOS.
- Complaint analytics and reporting dashboard.
- AI-based complaint classification and priority prediction.

---

## License
This project is licensed under the **MIT License** – see the [LICENSE](./LICENSE) file for details.

---

## Author
**Mohamed Baruk K**  
GitHub: [mohamedbarukk](https://github.com/mohamedbarukk)  
Email: [mohamedbarukk@example.com]
