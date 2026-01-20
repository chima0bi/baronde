import "dotenv/config";
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { usermodel } from '../model/user';
import sendmail from '../utils/mailer';
import userRoutes from '../routes/userroute'; 

// Mock dependencies
jest.mock('../model/user');
jest.mock('../utils/mailer');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');


jest.mock('../middleware/authtoken', () => ({
  authToken: jest.fn((req: any, res: any, next: any) => {
 
    req.user = { id: 'defaultUserId', role: 'user' }; 
    next();
  }),
}));

jest.mock('../middleware/rbac', () => ({
  Admin: jest.fn((req: any, res: any, next: any) => {
    if (req.user?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  }),
}));


import { authToken } from '../middleware/authtoken';
import { Admin } from '../middleware/rbac';


const app = express();
app.use(express.json());

app.use('/api/users', userRoutes); 


process.env.SECRET_KEY = 'test-secret-key';
process.env.EMAIL_USER_NAME = 'barondetest@gmail.com';

describe('User Controller Tests', () => {
  let mockUser: any;
  let mockTempOtpHolder: any;

  beforeEach(() => {
    jest.clearAllMocks();

    
    (authToken as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = { id: 'defaultUserId', role: 'user' };
      next();
    });
    (Admin as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      if (req.user?.role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'Access denied' });
      }
    });

    // Mock user data
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      id: 'user123',
      name: 'Test User',
      email: 'barondetest@gmail.com',
      password: '$2b$12$hashedPassword',
      role: 'user',
      loginAttempts: 0,
      lockUntil: null,
      save: jest.fn().mockResolvedValue(true), 
      updateOne: jest.fn().mockResolvedValue({ nModified: 1 }) 
    };

    mockTempOtpHolder = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Temp-Test User',
      email: 'temp-1234567890-barondetest@gmail.com',
      password: '$2b$12$hashedTempPassword',
      role: 'user',
      otp: {
        code: '12345',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // Valid for 2 hours
      },
      save: jest.fn().mockResolvedValue(true) 
    };

    
    (usermodel.findOne as jest.Mock).mockImplementation(() => ({
     
      select: jest.fn().mockResolvedValue(null) 
    }));
    (usermodel.findById as jest.Mock).mockResolvedValue(null); 
    (usermodel.find as jest.Mock).mockImplementation(() => ({
    
      select: jest.fn().mockResolvedValue([]) 
    }));
    (usermodel.findByIdAndDelete as jest.Mock).mockResolvedValue(null); 
    (usermodel as any).mockImplementation((data: any) => ({ 
        ...data, 
        save: jest.fn().mockResolvedValue(data), 
        _id: new mongoose.Types.ObjectId() 
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/users/request-otp (User Registration)', () => { 
    it('should request OTP successfully', async () => {
      // Mock findOne to return null (no existing user)
      (usermodel.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null) 
      });
      
      (usermodel as any).mockImplementationOnce(() => ({
        ...mockTempOtpHolder,
        save: jest.fn().mockResolvedValue(mockTempOtpHolder)
      }));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (sendmail as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/users/request-user-otp') 
        .send({
          email: 'barondetest@gmail.com',
          name: 'Test User'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP has been sent to your email');
      expect(response.body.otpId).toBeDefined();
      expect(sendmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'barondetest@gmail.com',
          subject: 'BarondeMusical - User Registration'
        })
      );
    });

    it('should return 400 if email or name is missing', async () => {
      const response = await request(app)
        .post('/api/users/request-user-otp')
        .send({
          email: 'barondetest@gmail.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Name and email are required');
    });

    it('should return 400 if email is already in use', async () => {
      (usermodel.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockUser) 
      });

      const response = await request(app)
        .post('/api/users/request-user-otp')
        .send({
          email: 'barondetest@gmail.com',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already in use');
    });

    it('should handle server errors', async () => {
      (usermodel.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .post('/api/users/request-user-otp')
        .send({
          email: 'barondetest@gmail.com',
          name: 'Test User'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to request OTP');
    });
  });

  describe('POST /api/users/SignUp', () => {
    it('should sign up user successfully with valid OTP', async () => {
      (usermodel.findOne as jest.Mock)
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) }) 
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockTempOtpHolder) }); // OTP verification
      (usermodel.findByIdAndDelete as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');
      (sendmail as jest.Mock).mockResolvedValue(true);

     
      (usermodel as any).mockImplementationOnce((data: any) => ({
        ...mockUser, 
        ...data, 
        save: jest.fn().mockResolvedValue({ 
          ...mockUser,
          ...data,
          id: mockUser._id.toString() 
        })
      }));

      const response = await request(app)
        .post('/api/users/SignUp')
        .send({
          name: 'Test User',
          email: 'barondetest@gmail.com',
          password: 'password123',
          role: 'user',
          otp: '12345',
          otpId: mockTempOtpHolder._id.toString() 
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Account created successfully');
      expect(response.body.user).toBeDefined();
      expect(response.headers.authorization).toBe('Bearer jwt-token');
      expect(sendmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'barondetest@gmail.com',
          subject: 'Welcome to BarondeMusical'
        })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/users/SignUp')
        .send({
          name: 'Test User',
          email: 'barondetest@gmail.com'
          
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Name, email and password are required');
    });

    it('should return 400 if email already exists', async () => {
      (usermodel.findOne as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/api/users/SignUp')
        .send({
          name: 'Test User',
          email: 'barondetest@gmail.com',
          password: 'password123',
          role: 'user',
          otp: '12345',
          otpId: mockTempOtpHolder._id.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already in use');
    });

    it('should return 400 if OTP is invalid', async () => {
      (usermodel.findOne as jest.Mock)
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) }) // No existing user
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) }); // Invalid OTP (findOne for verifyAndCleanupOTP)

      const response = await request(app)
        .post('/api/users/SignUp')
        .send({
          name: 'Test User',
          email: 'barondetest@gmail.com',
          password: 'password123',
          role: 'user',
          otp: 'invalid',
          otpId: mockTempOtpHolder._id.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid or expired OTP');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login successfully with valid credentials', async () => {
      (usermodel.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser) 
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'barondetest@gmail.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.headers.authorization).toBe('Bearer jwt-token');
      expect(mockUser.save).toHaveBeenCalled(); // Ensure login attempts are reset
    });

    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'barondetest@gmail.com'
          // password is missing
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password are required');
    });

    it('should return 400 if user does not exist', async () => {
      (usermodel.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null) // No user found
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 400 if password is invalid', async () => {
      // Mock user with current loginAttempts
      const userWithAttempts = { ...mockUser, loginAttempts: 0 };
      (usermodel.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithAttempts)
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'barondetest@gmail.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email or password');
      expect(userWithAttempts.save).toHaveBeenCalled(); 
      expect(userWithAttempts.loginAttempts).toBe(1); 
    });

    it('should lock account after max login attempts', async () => {
      const lockedUser = {
        ...mockUser,
        loginAttempts: 4, // One less than max
        save: jest.fn()
      };

      (usermodel.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(lockedUser)
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Incorrect password

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'barondetest@gmail.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400); // Still returns 400 for invalid credentials
      expect(lockedUser.loginAttempts).toBe(5); // Now at max attempts
      expect(lockedUser.lockUntil).toBeDefined(); // Should be locked
      expect(lockedUser.save).toHaveBeenCalled();
    });

    it('should return 423 if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockUntil: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      };

      (usermodel.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(lockedUser)
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'barondetest@gmail.com',
          password: 'password123'
        });

      expect(response.status).toBe(423);
      expect(response.body.message).toContain('Account locked');
    });
  });

  describe('GET /api/users/getuser/:id', () => {
    it('should get user successfully', async () => {
      (usermodel.findById as jest.Mock).mockResolvedValue(mockUser);
      (authToken as jest.Mock).mockImplementationOnce((req: any, res: any, next: any) => {
          req.user = { id: 'adminUser123', role: 'admin' };
          next();
      });

      const response = await request(app)
        .get(`/api/users/getuser/${mockUser._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/users/getuser/invalid-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    it('should return 404 if user not found', async () => {
      (usermodel.findById as jest.Mock).mockResolvedValue(null);
      (authToken as jest.Mock).mockImplementationOnce((req: any, res: any, next: any) => {
          req.user = { id: 'adminUser123', role: 'admin' };
          next();
      });

      const response = await request(app)
        .get(`/api/users/getuser/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /api/users/alluser', () => {
    beforeEach(() => {
        
        (authToken as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
            req.user = { id: 'adminUser123', role: 'admin' }; // Mock as admin
            next();
        });
    });

    it('should get all users successfully', async () => {
      const mockUsers = [
        mockUser,
        { ...mockUser, _id: new mongoose.Types.ObjectId(), email: 'another@example.com' }
      ];
      (usermodel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers)
      });

      const response = await request(app)
        .get('/api/users/alluser')
        .set('Authorization', 'Bearer valid-admin-token'); // This token will now be processed as admin

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.count).toBe(2);
      expect(response.body.users).toHaveLength(2);
    });

    it('should handle empty user list', async () => {
      (usermodel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      const response = await request(app)
        .get('/api/users/alluser')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.users).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      (usermodel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .get('/api/users/alluser')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('An error occurred while retrieving users');
    });
  });

  describe('Password Reset Flow', () => {
    describe('POST /api/users/request-password-reset-otp', () => {
      it('should request password reset OTP successfully', async () => {
        (usermodel.findOne as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockUser) // User exists for password reset
        });
        (usermodel as any).mockImplementationOnce(() => ({ // Mock for createTempOtpHolder
          ...mockTempOtpHolder,
          save: jest.fn().mockResolvedValue(mockTempOtpHolder)
        }));
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword'); // For createTempOtpHolder's internal hashing
        (sendmail as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
          .post('/api/users/request-password-reset-otp')
          .send({
            email: 'barondetest@gmail.com'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Password reset OTP has been sent to your email');
        expect(response.body.otpId).toBeDefined();
        expect(sendmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'barondetest@gmail.com',
            subject: 'BarondeMusical - Password Reset'
          })
        );
      });

      it('should return 400 if user does not exist', async () => {
        (usermodel.findOne as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(null) // User does not exist
        });

        const response = await request(app)
          .post('/api/users/request-password-reset-otp')
          .send({
            email: 'nonexistent@example.com'
          });

        expect(response.status).toBe(400); // Controller returns 400 for USER_NOT_FOUND
        expect(response.body.message).toBe('User not found');
      });
    });

    describe('POST /api/users/reset-password', () => {
      it('should reset password successfully', async () => {
       
        (usermodel.findOne as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockUser) // Mock user exists and select(+password) works
        });
        // Mock usermodel.findOne for OTP verification in verifyAndCleanupOTP
        (usermodel.findOne as jest.Mock).mockReturnValueOnce({
            select: jest.fn().mockResolvedValue(mockTempOtpHolder) // OTP record is valid
        });
        (usermodel.findByIdAndDelete as jest.Mock).mockResolvedValue(true); // OTP cleaned up
        (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword'); // New password hashed

        const response = await request(app)
          .post('/api/users/reset-password')
          .send({
            email: 'barondetest@gmail.com',
            otp: '12345',
            otpId: mockTempOtpHolder._id.toString(),
            newPassword: 'newPassword123'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Password updated successfully');
        expect(mockUser.updateOne).toHaveBeenCalledWith({
          password: 'newHashedPassword'
        });
      });

      it('should return 400 if required fields are missing', async () => {
        const response = await request(app)
          .post('/api/users/reset-password')
          .send({
            email: 'barondetest@gmail.com',
            otp: '12345'
            // otpId and newPassword are missing
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Email, OTP, OTP ID, and new password are required');
      });

      it('should return 400 if OTP is invalid', async () => {
        // Mock usermodel.findOne for initial user check
        (usermodel.findOne as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockUser)
        });
        // Mock usermodel.findOne for OTP verification (returns null for invalid OTP)
        (usermodel.findOne as jest.Mock).mockReturnValueOnce({
            select: jest.fn().mockResolvedValue(null)
        });

        const response = await request(app)
          .post('/api/users/reset-password')
          .send({
            email: 'barondetest@gmail.com',
            otp: 'invalid',
            otpId: mockTempOtpHolder._id.toString(),
            newPassword: 'newPassword123'
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid or expired OTP');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .set('Content-Type', 'application/json')
        .send('invalid json'); // Send malformed JSON directly

      // Express's body-parser typically catches malformed JSON and returns 400.
      expect(response.status).toBe(400);
    });

    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);

      
      const response = await request(app)
        .post('/api/users/SignUp')
        .send({
          name: longString,
          email: 'barondetest@gmail.com', 
          password: 'password123',
          role: 'user',
          otp: '12345', 
          otpId: new mongoose.Types.ObjectId().toString()
        });
      
      
      expect(response.status).not.toBeGreaterThanOrEqual(500); 
    });

    it('should handle database connection errors', async () => {
    
      (usermodel.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Connection lost'))
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'barondetest@gmail.com',
          password: 'password123'
        });

      
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to login'); 
    });
  });
});