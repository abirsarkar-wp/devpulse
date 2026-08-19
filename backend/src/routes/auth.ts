import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/jwt';

const router = Router();

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!valid) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      role: user.role,
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
      });
    }

    const payload = verifyRefreshToken(refreshToken);

    const accessToken = signAccessToken({
      userId: payload.userId,
      role: payload.role,
    });

    return res.json({
      accessToken,
    });
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired refresh token',
    });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Do not reveal whether the email exists in production.
    if (!user) {
      return res.json({
        message:
          'If the account exists, a password reset request has been created.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const resetTokenExpires = new Date(
      Date.now() + 1000 * 60 * 60
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    res.json({
      message:
        'Password reset request created. Use the reset token to continue.',
      resetToken,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        error: 'Email, reset token, and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset request',
      });
    }

    if (!user.resetToken || !user.resetTokenExpires) {
      return res.status(400).json({
        error: 'Invalid or expired reset request',
      });
    }

    if (user.resetToken !== resetToken) {
      return res.status(400).json({
        error: 'Invalid or expired reset request',
      });
    }

    if (user.resetTokenExpires < new Date()) {
      return res.status(400).json({
        error: 'Invalid or expired reset request',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.json({
      message: 'Password reset successful',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});
export default router;
