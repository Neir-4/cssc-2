import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pool from "../config/database.js";
import { authenticate } from "../middleware/auth.js";
import { requireKomting } from "../middleware/authorization.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/materials");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.params.courseId}-${
        req.params.meeting
      }-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});

// Get materials for a course meeting
router.get("/:courseId/:meeting", authenticate, async (req, res) => {
  try {
    const { courseId, meeting } = req.params;

    // Convert to integers
    const courseIdNum = parseInt(courseId);
    const meetingNum = parseInt(meeting);

    console.log("Getting materials for:", {
      courseId: courseIdNum,
      meeting: meetingNum,
    });

    if (isNaN(courseIdNum) || isNaN(meetingNum)) {
      return res
        .status(400)
        .json({ error: "Invalid courseId or meeting format" });
    }

    const result = await pool.query(
      `
      SELECT m.*, u.name as uploader_name
      FROM materials m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.course_id = $1 AND m.meeting_number = $2
      ORDER BY m.created_at DESC
    `,
      [courseIdNum, meetingNum]
    );

    console.log("Materials found:", result.rows.length);

    const materials = result.rows.map((material) => ({
      id: material.id,
      title: material.title,
      file_name: material.file_name,
      file_path: material.file_path,
      file_size: material.file_size,
      file_type: material.file_type,
      uploaded_by: material.uploader_name || "Unknown",
      created_at: material.created_at,
      updated_at: material.updated_at,
    }));

    res.json({ materials });
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({ error: "Failed to get materials" });
  }
});

// Upload material (Komting only)
router.post(
  "/:courseId/:meeting/upload",
  authenticate,
  requireKomting,
  upload.single("material"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { courseId, meeting } = req.params;
      const { title } = req.body;
      const userId = req.user.id;

      // Validate parameters
      if (!courseId || !meeting) {
        console.error("Missing parameters:", { courseId, meeting });
        return res.status(400).json({ error: "Missing courseId or meeting" });
      }

      const courseIdNum = parseInt(courseId);
      const meetingNum = parseInt(meeting);

      if (isNaN(courseIdNum) || isNaN(meetingNum)) {
        console.error("Invalid parameters:", { courseId, meeting });
        return res
          .status(400)
          .json({ error: "Invalid courseId or meeting format" });
      }

      console.log("Uploading file:", {
        courseId: courseIdNum,
        meeting: meetingNum,
        filename: req.file.originalname,
        userId: userId,
      });

      // Insert material into database
      const result = await pool.query(
        `
      INSERT INTO materials (course_id, meeting_number, title, file_name, file_path, file_size, file_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, file_name, file_size, created_at
    `,
        [
          courseIdNum,
          meetingNum,
          title || req.file.originalname,
          req.file.filename,
          `/uploads/materials/${req.file.filename}`,
          req.file.size,
          path.extname(req.file.originalname).substring(1),
          userId,
        ]
      );

      const material = result.rows[0];

      console.log("Material uploaded successfully:", {
        id: material.id,
        title: material.title,
        courseId: courseIdNum,
        meeting: meetingNum,
      });

      res.status(201).json({
        message: "Material uploaded successfully",
        material: {
          id: material.id,
          title: material.title,
          file_name: material.file_name,
          file_size: material.file_size,
          created_at: material.created_at,
        },
      });
    } catch (error) {
      console.error("Upload material error:", error);
      res.status(500).json({ error: "Failed to upload material" });
    }
  }
);

// Download material
router.get(
  "/:courseId/:meeting/download/:fileId",
  authenticate,
  async (req, res) => {
    try {
      const { fileId } = req.params;

      // Get material info from database
      const materialResult = await pool.query(
        `
      SELECT * FROM materials WHERE id = $1
    `,
        [fileId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];
      const filePath = path.join(
        __dirname,
        "../uploads/materials",
        material.file_name
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.download(filePath, material.title);
    } catch (error) {
      console.error("Download material error:", error);
      res.status(500).json({ error: "Failed to download material" });
    }
  }
);

// Delete material (Komting only)
router.delete(
  "/:courseId/:meeting/:fileId",
  authenticate,
  requireKomting,
  async (req, res) => {
    try {
      const { fileId } = req.params;

      // Get material info from database first
      const materialResult = await pool.query(
        `
      SELECT * FROM materials WHERE id = $1
    `,
        [fileId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];

      // Delete from file system
      const filePath = path.join(
        __dirname,
        "../uploads/materials",
        material.file_name
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await pool.query("DELETE FROM materials WHERE id = $1", [fileId]);

      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Delete material error:", error);
      res.status(500).json({ error: "Failed to delete material" });
    }
  }
);

export default router;
