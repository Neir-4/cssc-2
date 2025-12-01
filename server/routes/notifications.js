import express from 'express';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      details: 'Authorization token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: 'Invalid token',
        details: 'Token is invalid or expired'
      });
    }
    req.user = decoded;
    next();
  });
};

// Email transporter setup
const createEmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// WhatsApp client setup
const createWhatsAppClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('Twilio credentials not configured');
    return null;
  }

  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

// Send email notification
const sendEmailNotification = async (recipient, subject, message) => {
  const transporter = createEmailTransporter();
  if (!transporter) {
    console.warn('Email service not available');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: subject,
      html: message,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send WhatsApp notification
const sendWhatsAppNotification = async (recipient, message) => {
  const client = createWhatsAppClient();
  if (!client) {
    console.warn('WhatsApp service not available');
    return { success: false, error: 'WhatsApp service not configured' };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${recipient}`,
    });

    console.log('WhatsApp message sent successfully:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('WhatsApp sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Get notification preferences for a user
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    // For now, return default preferences
    // In a real implementation, you'd store these in a database table
    const preferences = {
      email_enabled: true,
      whatsapp_enabled: true,
      schedule_changes: true,
      new_announcements: true,
      room_updates: false
    };

    res.json({ preferences });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      error: 'Failed to get notification preferences',
      details: error.message
    });
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferencesSchema = Joi.object({
      email_enabled: Joi.boolean().optional(),
      whatsapp_enabled: Joi.boolean().optional(),
      schedule_changes: Joi.boolean().optional(),
      new_announcements: Joi.boolean().optional(),
      room_updates: Joi.boolean().optional()
    });

    const { error, value } = preferencesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    // For now, just return success
    // In a real implementation, you'd update a database table
    res.json({
      message: 'Notification preferences updated successfully',
      preferences: value
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
      details: error.message
    });
  }
});

// Send schedule change notification (internal endpoint)
router.post('/schedule-change', authenticateToken, async (req, res) => {
  try {
    // Only komting can trigger notifications
    if (req.user.role !== 'komting') {
      return res.status(403).json({
        error: 'Access denied',
        details: 'Only komting can send schedule change notifications'
      });
    }

    const notificationSchema = Joi.object({
      course_id: Joi.number().integer().required(),
      event_details: Joi.object({
        event_date: Joi.string().required(),
        start_time: Joi.string().required(),
        end_time: Joi.string().required(),
        room_name: Joi.string().required(),
        change_reason: Joi.string().optional()
      }).required()
    });

    const { error, value } = notificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { course_id, event_details } = value;

    // Get course details and subscribers
    const courseResult = await pool.query(`
      SELECT c.course_code, c.name as course_name, l.name as lecturer_name, k.name as komting_name
      FROM courses c
      LEFT JOIN users l ON c.lecturer_id = l.id
      LEFT JOIN users k ON c.komting_id = k.id
      WHERE c.id = $1 AND c.is_active = true
    `, [course_id]);

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
        details: 'Course does not exist or is inactive'
      });
    }

    const course = courseResult.rows[0];

    // Get all subscribers (students, lecturer, komting)
    const subscribersResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role
      FROM users u
      WHERE u.id IN (
        SELECT user_id FROM course_subscriptions WHERE course_id = $1
        UNION
        SELECT lecturer_id FROM courses WHERE id = $1 AND lecturer_id IS NOT NULL
        UNION
        SELECT komting_id FROM courses WHERE id = $1 AND komting_id IS NOT NULL
      )
      AND u.email IS NOT NULL
    `, [course_id]);

    const subscribers = subscribersResult.rows;

    if (subscribers.length === 0) {
      return res.json({
        message: 'No subscribers found for this course',
        sent_count: 0
      });
    }

    // Prepare notification content
    const emailSubject = `📅 Perubahan Jadwal: ${course.course_code} - ${course.course_name}`;
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📅 Perubahan Jadwal Kuliah</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">${course.course_code} - ${course.course_name}</h3>
          <p style="color: #6b7280; margin-bottom: 15px;">Dosen: ${course.lecturer_name || 'N/A'}</p>
          
          <div style="border-left: 4px solid #3b82f6; padding-left: 15px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Tanggal:</strong> ${new Date(event_details.event_date).toLocaleDateString('id-ID')}</p>
            <p style="margin: 5px 0;"><strong>Waktu:</strong> ${event_details.start_time} - ${event_details.end_time}</p>
            <p style="margin: 5px 0;"><strong>Ruangan:</strong> ${event_details.room_name}</p>
            ${event_details.change_reason ? `<p style="margin: 5px 0;"><strong>Alasan:</strong> ${event_details.change_reason}</p>` : ''}
          </div>
        </div>
        
        <p style="color: #6b7280;">Harap update jadwal Anda sesuai dengan perubahan ini.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #9ca3af; font-size: 12px;">Email ini dikirim otomatis oleh Sistem Informasi Penjadwalan CSSC</p>
        </div>
      </div>
    `;

    const whatsappMessage = `📅 *PERUBAHAN JADWAL*\n\n${course.course_code} - ${course.course_name}\n📅 Tanggal: ${new Date(event_details.event_date).toLocaleDateString('id-ID')}\n⏰ Waktu: ${event_details.start_time} - ${event_details.end_time}\n🏫 Ruangan: ${event_details.room_name}${event_details.change_reason ? `\n📝 Alasan: ${event_details.change_reason}` : ''}\n\nHarap update jadwal Anda. Terima kasih!`;

    // Send notifications
    let emailSent = 0;
    let whatsappSent = 0;
    const notificationErrors = [];

    for (const subscriber of subscribers) {
      // Send email
      if (subscriber.email) {
        const emailResult = await sendEmailNotification(subscriber.email, emailSubject, emailMessage);
        if (emailResult.success) {
          emailSent++;
        } else {
          notificationErrors.push(`Email to ${subscriber.email}: ${emailResult.error}`);
        }
      }

      // Send WhatsApp (only if phone number is available)
      if (subscriber.phone && subscriber.phone.startsWith('+')) {
        const whatsappResult = await sendWhatsAppNotification(subscriber.phone, whatsappMessage);
        if (whatsappResult.success) {
          whatsappSent++;
        } else {
          notificationErrors.push(`WhatsApp to ${subscriber.phone}: ${whatsappResult.error}`);
        }
      }
    }

    // Update notification_sent flag for the event
    await pool.query(
      'UPDATE schedule_events SET notification_sent = true WHERE course_id = $1 AND event_date = $2',
      [course_id, event_details.event_date]
    );

    res.json({
      message: 'Notifications sent successfully',
      summary: {
        total_subscribers: subscribers.length,
        emails_sent: emailSent,
        whatsapp_sent: whatsappSent,
        errors: notificationErrors.length
      },
      errors: notificationErrors
    });

  } catch (error) {
    console.error('Send schedule change notification error:', error);
    res.status(500).json({
      error: 'Failed to send notifications',
      details: error.message
    });
  }
});

// Test notification endpoint
router.post('/test', authenticateToken, async (req, res) => {
  try {
    // Only komting can test notifications
    if (req.user.role !== 'komting') {
      return res.status(403).json({
        error: 'Access denied',
        details: 'Only komting can test notifications'
      });
    }

    const testSchema = Joi.object({
      type: Joi.string().valid('email', 'whatsapp').required(),
      recipient: Joi.string().required()
    });

    const { error, value } = testSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { type, recipient } = value;

    let result;
    if (type === 'email') {
      result = await sendEmailNotification(
        recipient,
        '🧪 Test Notification - CSSC System',
        '<h2>Test Email Notification</h2><p>This is a test email from CSSC Scheduling System.</p>'
      );
    } else if (type === 'whatsapp') {
      result = await sendWhatsAppNotification(
        recipient,
        '🧪 *TEST NOTIFICATION*\n\nThis is a test WhatsApp message from CSSC Scheduling System.'
      );
    }

    res.json({
      message: 'Test notification completed',
      type,
      recipient,
      result
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      error: 'Failed to send test notification',
      details: error.message
    });
  }
});

export default router;
