// server.js
// ============================================================
// 🌐 Student Grievance Portal — Backend (Unified, Fixed)
// ============================================================

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

const app = express();

// ============================================================
// ⚙️ Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploads statically at /uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================================
// 🗄️ MySQL Connection Pool
// ============================================================
let db;
(async () => {
  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });
    console.log("✅ MySQL connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
})();

// ============================================================
// 🔑 JWT Secret
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ============================================================
// 📁 Multer File Upload Configuration
// ============================================================
// We store only the filename in DB. Static middleware serves them from /uploads/<filename>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // unique filename: timestamp-random + original extension
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});
const upload = multer({ storage });

// ============================================================
// 🧩 Verify JWT Middleware
// ============================================================
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// ============================================================
// 🧰 Role Authorization
// ============================================================
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "No user info in token" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Access denied" });
    next();
  };
}

// Helper: allow same user id or admin-type roles
function allowSelfOrAdmin(paramIdName = "id") {
  return (req, res, next) => {
    const paramId = req.params[paramIdName];
    if (!req.user) return res.status(401).json({ message: "No user info in token" });
    if (Number(req.user.id) === Number(paramId)) return next();
    const adminRoles = ["faculty", "hod", "principal", "admin", "super_admin"];
    if (adminRoles.includes(req.user.role)) return next();
    return res.status(403).json({ message: "Access denied" });
  };
}

// ============================================================
// 📧 Email Setup (Gmail App Password or other SMTP)
// ============================================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmailWithAttachments({ to, subject, html, text, attachments = [] }) {
  try {
    const info = await transporter.sendMail({
      from: `"Students Grievance Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log("📩 Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return false;
  }
}

// ============================================================
// 👤 AUTH ROUTES
// ============================================================
app.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role || "student"]
    );
    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ message: "Login successful", token, user });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
});

// ============================================================
// 🎯 COMPLAINT ROUTES (Student & Admin)
// ============================================================

// Submit Complaint (student)
// NOTE: store only filename in complaintfiles.file_path
app.post(
  "/api/complaints",
  verifyToken,
  authorizeRoles("student"),
  upload.array("attachments", 5),
  async (req, res) => {
    const { title, description, category, visibility } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: "Title and description required" });

    try {
      const [result] = await db.query(
        `INSERT INTO complaints (title, description, category, visibility, urgency, status, user_id)
         VALUES (?, ?, ?, ?, 'Normal', 'Pending', ?)`,
        [title, description, category, visibility || "Public", req.user.id]
      );

      const complaintId = result.insertId;

      if (req.files && req.files.length > 0) {
        // store only basename (filename) so static route /uploads/<filename> works cleanly
        const fileRecords = req.files.map((f) => [complaintId, path.basename(f.path)]);
        await db.query("INSERT INTO complaintfiles (complaint_id, file_path) VALUES ?", [fileRecords]);
      }

      const [[insertedComplaint]] = await db.query(
        `SELECT c.*, u.username AS student_name, u.email AS student_email,
           COALESCE((SELECT JSON_ARRAYAGG(file_path) FROM complaintfiles WHERE complaint_id = c.id), JSON_ARRAY()) AS attachments
         FROM complaints c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [complaintId]
      );

      res.json({ message: "Complaint submitted successfully", complaintId, complaint: insertedComplaint || null });
    } catch (err) {
      console.error("Complaint submit error:", err.message);
      res.status(500).json({ message: "Failed to submit complaint" });
    }
  }
);

// Get logged-in student's complaints
// attachments returned as JSON array of filenames (or null)
app.get("/api/complaints", verifyToken, authorizeRoles("student"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*,
              (SELECT JSON_ARRAYAGG(file_path) FROM complaintfiles WHERE complaint_id = c.id) AS attachments
       FROM complaints c
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ complaints: rows });
  } catch (err) {
    console.error("Fetch complaints error:", err.message);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

// Public tracking by complaint id (no auth)
// public_replies returned ASC (oldest to newest) to match student view expectations
app.get("/api/complaints/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.username AS student_name, u.email AS student_email,
              COALESCE((SELECT JSON_ARRAYAGG(file_path) FROM complaintfiles WHERE complaint_id = c.id), JSON_ARRAY()) AS attachments
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Complaint not found" });

    const [replies] = await db.query(
      `SELECT r.id, r.message, r.created_at, u.username AS replied_by
       FROM public_replies r
       LEFT JOIN users u ON r.admin_id = u.id
       WHERE r.complaint_id = ?
       ORDER BY r.created_at ASC`,
      [id]
    );

    const complaint = rows[0];
    complaint.public_replies = Array.isArray(replies) ? replies : [];
    res.json({ complaint });
  } catch (err) {
    console.error("Tracking complaint error:", err.message);
    res.status(500).json({ message: "Failed to fetch complaint" });
  }
});

// Public route used by student frontend to fetch replies for a complaint
// (compatibility for StudentComplaints.jsx which calls /api/replies/:id)
app.get("/api/replies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.message, r.created_at, u.username AS replied_by
       FROM public_replies r
       LEFT JOIN users u ON r.admin_id = u.id
       WHERE r.complaint_id = ?
       ORDER BY r.created_at ASC`,
      [id]
    );
    // return plain array (frontend expects array)
    return res.json(rows || []);
  } catch (err) {
    console.error("Public replies compatibility fetch error:", err.message);
    return res.status(500).json([]);
  }
});

// ============================================================
// 📊 STUDENT DASHBOARD Endpoints (stats + recent complaints)
// ============================================================
app.get("/api/student/complaint-stats", verifyToken, authorizeRoles("student"), async (req, res) => {
  try {
    const userId = req.user.id;
    const [[summary]] = await db.query(
      `
      SELECT
        SUM(status='Pending') AS pending,
        SUM(status='Under Process') AS underProcess,
        SUM(status='Resolved') AS resolved,
        COUNT(*) AS total
      FROM complaints
      WHERE user_id = ?
      `,
      [userId]
    );

    res.json({
      pending: Number(summary.pending || 0),
      under_process: Number(summary.underProcess || 0),
      underProcess: Number(summary.underProcess || 0),
      resolved: Number(summary.resolved || 0),
      total: Number(summary.total || 0),
    });
  } catch (err) {
    console.error("Student stats error:", err.message);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

app.get("/api/student/complaint-stats/:id", verifyToken, allowSelfOrAdmin("id"), async (req, res) => {
  try {
    const userId = req.params.id;
    const [[summary]] = await db.query(
      `
      SELECT
        SUM(status='Pending') AS pending,
        SUM(status='Under Process') AS underProcess,
        SUM(status='Resolved') AS resolved,
        COUNT(*) AS total
      FROM complaints
      WHERE user_id = ?
      `,
      [userId]
    );

    res.json({
      pending: Number(summary.pending || 0),
      under_process: Number(summary.underProcess || 0),
      underProcess: Number(summary.underProcess || 0),
      resolved: Number(summary.resolved || 0),
      total: Number(summary.total || 0),
    });
  } catch (err) {
    console.error("Student stats by id error:", err.message);
    res.status(500).json({ message: "Failed to fetch student stats" });
  }
});

app.get("/api/student/recent-complaints", verifyToken, authorizeRoles("student"), async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT id, title, status, created_at
       FROM complaints
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Recent complaints error:", err.message);
    res.status(500).json({ message: "Failed to fetch recent complaints" });
  }
});

app.get("/api/student/recent-complaints/:id", verifyToken, allowSelfOrAdmin("id"), async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await db.query(
      `SELECT id, title, status, created_at
       FROM complaints
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Recent complaints by id error:", err.message);
    res.status(500).json({ message: "Failed to fetch recent complaints" });
  }
});

// ============================================================
// 👨‍💼 ADMIN DASHBOARD Endpoints (summary + recent complaints)
// ============================================================
app.get("/api/admin/summary", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const [[summary]] = await db.query(
      `
      SELECT
        SUM(status='Pending') AS pending,
        SUM(status='Under Process') AS underProcess,
        SUM(status='Resolved') AS resolved,
        COUNT(*) AS total
      FROM complaints
      `
    );

    res.json({
      pending: Number(summary.pending || 0),
      underProcess: Number(summary.underProcess || 0),
      resolved: Number(summary.resolved || 0),
      total: Number(summary.total || 0),
    });
  } catch (err) {
    console.error("Admin summary error:", err.message);
    res.status(500).json({ message: "Server error while loading admin summary." });
  }
});

app.get("/api/admin/recent-complaints", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, category, status, created_at
       FROM complaints
       ORDER BY created_at DESC
       LIMIT 5`
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Admin recent complaints error:", err.message);
    res.status(500).json({ message: "Server error while loading recent complaints." });
  }
});

// ============================================================
// 👨‍💼 ADMIN / FACULTY ROUTES (full management)
// ============================================================

// Get All Complaints (updated to include attachments array)
app.get("/api/admin/complaints", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.username AS student_name, u.email AS student_email,
              COALESCE((SELECT JSON_ARRAYAGG(file_path) FROM complaintfiles WHERE complaint_id = c.id), JSON_ARRAY()) AS attachments
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC`
    );
    res.json({ complaints: rows });
  } catch (err) {
    console.error("Fetch all complaints error:", err.message);
    res.status(500).json({ message: "Failed to load complaints" });
  }
});

// Get Single Complaint (admin view) — already returns attachments, replies, notes
app.get("/api/admin/complaints/:id", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.username AS student_name, u.email AS student_email,
              COALESCE((SELECT JSON_ARRAYAGG(file_path) FROM complaintfiles WHERE complaint_id = c.id), JSON_ARRAY()) AS attachments
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Complaint not found" });

    const [replies] = await db.query(
      `SELECT r.id, r.message, r.created_at, u.username AS replied_by
       FROM public_replies r
       LEFT JOIN users u ON r.admin_id = u.id
       WHERE r.complaint_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    const [notes] = await db.query(
      `SELECT n.id, n.note, n.created_at, u.username AS added_by
       FROM internal_notes n
       LEFT JOIN users u ON n.admin_id = u.id
       WHERE n.complaint_id = ?
       ORDER BY n.created_at DESC`,
      [req.params.id]
    );

    const complaint = rows[0];
    complaint.public_replies = Array.isArray(replies) ? replies : [];
    complaint.internal_notes = Array.isArray(notes) ? notes : [];

    res.json({ complaint });
  } catch (err) {
    console.error("Fetch complaint error:", err.message);
    res.status(500).json({ message: "Failed to load complaint" });
  }
});

// Delete Complaint
app.delete("/api/admin/complaints/:id", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    await db.query("DELETE FROM complaints WHERE id = ?", [req.params.id]);
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("Delete complaint error:", err.message);
    res.status(500).json({ message: "Failed to delete complaint" });
  }
});

// Update Complaint Status
app.put("/api/admin/complaints/:id/status", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query("UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id]);
    const [rows] = await db.query("SELECT * FROM complaints WHERE id = ?", [id]);
    res.json({ message: "Status updated successfully", complaint: rows[0] });
  } catch (err) {
    console.error("Status update error:", err.message);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// ============================================================
// 🗒️ INTERNAL NOTES & PUBLIC REPLIES ROUTES
// ============================================================

// Get internal notes (admin)
app.get("/api/admin/complaints/:id/notes", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.id, n.note, n.created_at, u.username AS added_by
       FROM internal_notes n
       LEFT JOIN users u ON n.admin_id = u.id
       WHERE n.complaint_id = ?
       ORDER BY n.created_at DESC`,
      [req.params.id]
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Notes fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

// Add internal note (admin)
app.post("/api/admin/complaints/:id/notes", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: "Note is required" });
    await db.query("INSERT INTO internal_notes (complaint_id, admin_id, note) VALUES (?, ?, ?)", [req.params.id, req.user.id, note]);

    const [updatedNotes] = await db.query(
      `SELECT n.id, n.note, n.created_at, u.username AS added_by
       FROM internal_notes n
       LEFT JOIN users u ON n.admin_id = u.id
       WHERE n.complaint_id = ?
       ORDER BY n.created_at DESC`,
      [req.params.id]
    );

    res.json({ message: "Note added successfully", notes: updatedNotes || [] });
  } catch (err) {
    console.error("Note add error:", err.message);
    res.status(500).json({ message: "Failed to add note" });
  }
});

// Get public replies (admin)
app.get("/api/admin/complaints/:id/replies", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.message, r.created_at, u.username AS replied_by
       FROM public_replies r
       LEFT JOIN users u ON r.admin_id = u.id
       WHERE r.complaint_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Replies fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch replies" });
  }
});

// Add public reply (admin)
app.post("/api/admin/complaints/:id/replies", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });
    await db.query("INSERT INTO public_replies (complaint_id, admin_id, message) VALUES (?, ?, ?)", [req.params.id, req.user.id, message]);

    const [updatedReplies] = await db.query(
      `SELECT r.id, r.message, r.created_at, u.username AS replied_by
       FROM public_replies r
       LEFT JOIN users u ON r.admin_id = u.id
       WHERE r.complaint_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ message: "Reply added successfully", replies: updatedReplies || [] });
  } catch (err) {
    console.error("Reply add error:", err.message);
    res.status(500).json({ message: "Failed to add reply" });
  }
});

// Public route for public replies (students) - original wrapper (returns { replies: [...] })
app.get("/api/public-replies/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.message, r.created_at, u.username AS replied_by
       FROM public_replies r
       LEFT JOIN users u ON r.admin_id = u.id
       WHERE r.complaint_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ replies: rows || [] });
  } catch (err) {
    console.error("Public replies fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch public replies" });
  }
});

// ============================================================
// 📦 ADMIN REPORT EXPORT (CSV / PDF) — with Anonymous handling
// ============================================================
app.get("/api/admin/reports/export", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  try {
    const { from, to, status, visibility, format } = req.query;
    let where = "WHERE 1=1";
    const values = [];

    if (from && to) {
      where += " AND DATE(c.created_at) BETWEEN ? AND ?";
      values.push(from, to);
    }
    if (status) {
      where += " AND c.status = ?";
      values.push(status);
    }
    if (visibility) {
      where += " AND c.visibility = ?";
      values.push(visibility);
    }

    const [complaints] = await db.query(
      `SELECT 
          c.id, c.user_id, c.title, c.description, c.category, c.visibility, c.urgency, c.status, c.escalated_to,
          DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
          DATE_FORMAT(c.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
          CASE WHEN c.visibility = 'Anonymous' THEN '' ELSE u.username END AS username,
          CASE WHEN c.visibility = 'Anonymous' THEN '' ELSE u.email END AS email
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       ${where}
       ORDER BY c.created_at DESC`,
      values
    );

    if (!complaints.length) return res.status(404).json({ message: "No complaints found" });

    // CSV
    if (format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(complaints);
      res.header("Content-Type", "text/csv");
      res.attachment(`complaints_report_${Date.now()}.csv`);
      return res.send(csv);
    }

    // PDF
    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const filename = `complaints_report_${Date.now()}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      doc.pipe(res);

      doc.fontSize(18).text("Student Grievance Report", { align: "center" });
      doc.moveDown();

      complaints.forEach((c, i) => {
        doc.fontSize(12).text(`Complaint #${i + 1}`, { underline: true });
        doc.moveDown(0.2);
        doc.fontSize(11).text(`ID: ${c.id}`);
        doc.text(`Title: ${c.title || "-"}`);
        doc.text(`Description: ${c.description ? (c.description.length > 200 ? c.description.slice(0, 200) + "..." : c.description) : "-"}`);
        doc.text(`Category: ${c.category || "-"}`);
        doc.text(`Visibility: ${c.visibility || "-"}`);
        doc.text(`Username: ${c.username || ""}`);
        doc.text(`Email: ${c.email || ""}`);
        doc.text(`Status: ${c.status || "-"}`);
        doc.text(`Urgency: ${c.urgency || "-"}`);
        doc.text(`Created: ${c.created_at || "-"}`);
        doc.moveDown();
      });

      doc.end();
      return;
    }

    // Default JSON
    res.json(complaints);
  } catch (err) {
    console.error("Report export error:", err.message);
    res.status(500).json({ message: "Server error exporting report" });
  }
});

// ============================================================
// 🚨 ESCALATION ROUTE
// ============================================================
// Now includes attachment(s) in emails if present
app.post("/api/admin/complaints/escalate", verifyToken, authorizeRoles("faculty", "hod", "principal", "admin", "super_admin"), async (req, res) => {
  const { complaintId, higherAuthority, notifyAll } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM complaints WHERE id = ?", [complaintId]);
    if (!rows.length) return res.status(404).json({ message: "Complaint not found" });

    const complaint = rows[0];

    // fetch attachments (filenames)
    const [files] = await db.query("SELECT file_path FROM complaintfiles WHERE complaint_id = ?", [complaintId]);
    const filenames = Array.isArray(files) ? files.map((r) => r.file_path) : [];

    // prepare attachments for nodemailer (full path)
    const mailAttachments = filenames
      .map((fname) => {
        const fullPath = path.join(__dirname, "uploads", fname);
        if (fs.existsSync(fullPath)) {
          return { filename: fname, path: fullPath };
        }
        return null;
      })
      .filter(Boolean);

    // find recipients by role(s)
    const rolesToFetch = notifyAll ? ["hod", "principal", "super_admin"] : [String(higherAuthority || "").toLowerCase()];
    const [authorities] = await db.query("SELECT email, role FROM users WHERE role IN (?)", [rolesToFetch]);

    if (!authorities.length) return res.status(404).json({ message: "No authority users found" });

    // update urgency
    await db.query("UPDATE complaints SET urgency = 'High' WHERE id = ?", [complaintId]);

    const subject = notifyAll ? "🚨 Complaint Escalation - All Authorities Notified" : `🚨 Complaint Escalated to ${higherAuthority}`;
    const text = `
Complaint ID: ${complaint.id}
Title: ${complaint.title}
Description: ${complaint.description}
Urgency: High
Escalated By: ${req.user.username || req.user.id}
`;

    // send email to each authority (or in batch)
    const toList = authorities.map((a) => a.email).filter(Boolean).join(",");
    const sent = await sendEmailWithAttachments({ to: toList, subject, html: `<pre>${text}</pre>`, text, attachments: mailAttachments });

    if (!sent) {
      return res.status(500).json({ message: "Escalation updated but failed to send emails" });
    }

    res.json({ success: true, message: "Complaint escalated and emails sent successfully" });
  } catch (err) {
    console.error("Escalation error:", err.message);
    res.status(500).json({ message: "Failed to escalate complaint" });
  }
});

// ============================================================
// 🚀 Server Start
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at: http://localhost:${PORT}`));
