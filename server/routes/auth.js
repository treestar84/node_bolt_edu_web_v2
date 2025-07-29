import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin credentials - 환경변수에서 비밀번호 읽어와서 해시화
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Password is required'
      });
    }
    
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid password'
      });
    }
    
    const token = generateToken({ 
      role: 'admin',
      loginTime: new Date().toISOString()
    });
    
    res.json({
      success: true,
      token,
      expiresIn: '24h'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Verify admin token
router.get('/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

// Admin logout (client-side token removal)
router.post('/logout', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;