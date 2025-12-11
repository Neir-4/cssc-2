import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { requireKomting } from '../middleware/authorization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/materials');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.params.courseId}-${req.params.meeting}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

// Get materials for a course meeting
router.get('/:courseId/:meeting', authenticate, async (req, res) => {
  try {
    const { courseId, meeting } = req.params;
    const materialsPath = path.join(__dirname, '../uploads/materials');
    
    if (!fs.existsSync(materialsPath)) {
      return res.json({ materials: [] });
    }
    
    const files = fs.readdirSync(materialsPath);
    const materials = files
      .filter(file => file.startsWith(`${courseId}-${meeting}-`))
      .map(file => ({
        id: file,
        filename: file.split('-').slice(2).join('-'),
        originalName: file.split('-').slice(2).join('-').replace(/^\d+-\d+-/, ''),
        uploadedAt: fs.statSync(path.join(materialsPath, file)).mtime,
        size: fs.statSync(path.join(materialsPath, file)).size
      }));
    
    res.json({ materials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to get materials' });
  }
});

// Upload material (Komting only)
router.post('/:courseId/:meeting/upload', 
  authenticate,
  requireKomting,
  upload.single('material'),
  async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { courseId, meeting } = req.params;
    const { title } = req.body;
    
    const material = {
      id: req.file.filename,
      filename: req.file.filename,
      originalName: req.file.originalname,
      title: title || req.file.originalname,
      uploadedAt: new Date(),
      size: req.file.size,
      uploadedBy: req.user.name
    };
    
    res.status(201).json({
      message: 'Material uploaded successfully',
      material
    });
  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({ error: 'Failed to upload material' });
  }
});

// Download material
router.get('/:courseId/:meeting/download/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(__dirname, '../uploads/materials', fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({ error: 'Failed to download material' });
  }
});

// Delete material (Komting only)
router.delete('/:courseId/:meeting/:fileId',
  authenticate,
  requireKomting,
  async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(__dirname, '../uploads/materials', fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

export default router;