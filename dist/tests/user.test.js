"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../model/user");
const mailer_1 = __importDefault(require("../utils/mailer"));
const userroute_1 = __importDefault(require("../routes/userroute"));
// Mock dependencies
jest.mock('../model/user');
jest.mock('../utils/mailer');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../middleware/authtoken', () => ({
    authToken: jest.fn((req, res, next) => {
        req.user = { id: 'defaultUserId', role: 'user' };
        next();
    }),
}));
jest.mock('../middleware/rbac', () => ({
    Admin: jest.fn((req, res, next) => {
        var _a;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
            next();
        }
        else {
            res.status(403).json({ message: 'Access denied' });
        }
    }),
}));
const authtoken_1 = require("../middleware/authtoken");
const rbac_1 = require("../middleware/rbac");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/users', userroute_1.default);
process.env.SECRET_KEY = 'test-secret-key';
process.env.EMAIL_USER_NAME = 'barondetest@gmail.com';
describe('User Controller Tests', () => {
    let mockUser;
    let mockTempOtpHolder;
    beforeEach(() => {
        jest.clearAllMocks();
        authtoken_1.authToken.mockImplementation((req, res, next) => {
            req.user = { id: 'defaultUserId', role: 'user' };
            next();
        });
        rbac_1.Admin.mockImplementation((req, res, next) => {
            var _a;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
                next();
            }
            else {
                res.status(403).json({ message: 'Access denied' });
            }
        });
        // Mock user data
        mockUser = {
            _id: new mongoose_1.default.Types.ObjectId(),
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
            _id: new mongoose_1.default.Types.ObjectId(),
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
        user_1.usermodel.findOne.mockImplementation(() => ({
            select: jest.fn().mockResolvedValue(null)
        }));
        user_1.usermodel.findById.mockResolvedValue(null);
        user_1.usermodel.find.mockImplementation(() => ({
            select: jest.fn().mockResolvedValue([])
        }));
        user_1.usermodel.findByIdAndDelete.mockResolvedValue(null);
        user_1.usermodel.mockImplementation((data) => (Object.assign(Object.assign({}, data), { save: jest.fn().mockResolvedValue(data), _id: new mongoose_1.default.Types.ObjectId() })));
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    describe('POST /api/users/request-otp (User Registration)', () => {
        it('should request OTP successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock findOne to return null (no existing user)
            user_1.usermodel.findOne.mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(null)
            });
            user_1.usermodel.mockImplementationOnce(() => (Object.assign(Object.assign({}, mockTempOtpHolder), { save: jest.fn().mockResolvedValue(mockTempOtpHolder) })));
            bcrypt_1.default.hash.mockResolvedValue('hashedPassword');
            mailer_1.default.mockResolvedValue(true);
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/request-user-otp')
                .send({
                email: 'barondetest@gmail.com',
                name: 'Test User'
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('OTP has been sent to your email');
            expect(response.body.otpId).toBeDefined();
            expect(mailer_1.default).toHaveBeenCalledWith(expect.objectContaining({
                to: 'barondetest@gmail.com',
                subject: 'BarondeMusical - User Registration'
            }));
        }));
        it('should return 400 if email or name is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/request-user-otp')
                .send({
                email: 'barondetest@gmail.com'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Name and email are required');
        }));
        it('should return 400 if email is already in use', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findOne.mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/request-user-otp')
                .send({
                email: 'barondetest@gmail.com',
                name: 'Test User'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email already in use');
        }));
        it('should handle server errors', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findOne.mockReturnValueOnce({
                select: jest.fn().mockRejectedValue(new Error('Database error'))
            });
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/request-user-otp')
                .send({
                email: 'barondetest@gmail.com',
                name: 'Test User'
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to request OTP');
        }));
    });
    describe('POST /api/users/SignUp', () => {
        it('should sign up user successfully with valid OTP', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findOne
                .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) })
                .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockTempOtpHolder) }); // OTP verification
            user_1.usermodel.findByIdAndDelete.mockResolvedValue(true);
            bcrypt_1.default.hash.mockResolvedValue('hashedPassword');
            jsonwebtoken_1.default.sign.mockReturnValue('jwt-token');
            mailer_1.default.mockResolvedValue(true);
            user_1.usermodel.mockImplementationOnce((data) => (Object.assign(Object.assign(Object.assign({}, mockUser), data), { save: jest.fn().mockResolvedValue(Object.assign(Object.assign(Object.assign({}, mockUser), data), { id: mockUser._id.toString() })) })));
            const response = yield (0, supertest_1.default)(app)
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
            expect(mailer_1.default).toHaveBeenCalledWith(expect.objectContaining({
                to: 'barondetest@gmail.com',
                subject: 'Welcome to BarondeMusical'
            }));
        }));
        it('should return 400 if required fields are missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/SignUp')
                .send({
                name: 'Test User',
                email: 'barondetest@gmail.com'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Name, email and password are required');
        }));
        it('should return 400 if email already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findOne.mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            const response = yield (0, supertest_1.default)(app)
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
        }));
        it('should return 400 if OTP is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findOne
                .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) }) // No existing user
                .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) }); // Invalid OTP (findOne for verifyAndCleanupOTP)
            const response = yield (0, supertest_1.default)(app)
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
        }));
    });
    describe('POST /api/users/login', () => {
        it('should login successfully with valid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            bcrypt_1.default.compare.mockResolvedValue(true);
            jsonwebtoken_1.default.sign.mockReturnValue('jwt-token');
            const response = yield (0, supertest_1.default)(app)
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
        }));
        it('should return 400 if email or password is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'barondetest@gmail.com'
                // password is missing
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email and password are required');
        }));
        it('should return 400 if user does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null) // No user found
            });
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'password123'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid email or password');
        }));
        it('should return 400 if password is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock user with current loginAttempts
            const userWithAttempts = Object.assign(Object.assign({}, mockUser), { loginAttempts: 0 });
            user_1.usermodel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(userWithAttempts)
            });
            bcrypt_1.default.compare.mockResolvedValue(false);
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'barondetest@gmail.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid email or password');
            expect(userWithAttempts.save).toHaveBeenCalled();
            expect(userWithAttempts.loginAttempts).toBe(1);
        }));
        it('should lock account after max login attempts', () => __awaiter(void 0, void 0, void 0, function* () {
            const lockedUser = Object.assign(Object.assign({}, mockUser), { loginAttempts: 4, save: jest.fn() });
            user_1.usermodel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(lockedUser)
            });
            bcrypt_1.default.compare.mockResolvedValue(false); // Incorrect password
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'barondetest@gmail.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(400); // Still returns 400 for invalid credentials
            expect(lockedUser.loginAttempts).toBe(5); // Now at max attempts
            expect(lockedUser.lockUntil).toBeDefined(); // Should be locked
            expect(lockedUser.save).toHaveBeenCalled();
        }));
        it('should return 423 if account is locked', () => __awaiter(void 0, void 0, void 0, function* () {
            const lockedUser = Object.assign(Object.assign({}, mockUser), { lockUntil: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
             });
            user_1.usermodel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(lockedUser)
            });
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'barondetest@gmail.com',
                password: 'password123'
            });
            expect(response.status).toBe(423);
            expect(response.body.message).toContain('Account locked');
        }));
    });
    describe('GET /api/users/getuser/:id', () => {
        it('should get user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findById.mockResolvedValue(mockUser);
            authtoken_1.authToken.mockImplementationOnce((req, res, next) => {
                req.user = { id: 'adminUser123', role: 'admin' };
                next();
            });
            const response = yield (0, supertest_1.default)(app)
                .get(`/api/users/getuser/${mockUser._id}`)
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toBeDefined();
        }));
        it('should return 400 for invalid user ID format', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/users/getuser/invalid-id')
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid user ID format');
        }));
        it('should return 404 if user not found', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findById.mockResolvedValue(null);
            authtoken_1.authToken.mockImplementationOnce((req, res, next) => {
                req.user = { id: 'adminUser123', role: 'admin' };
                next();
            });
            const response = yield (0, supertest_1.default)(app)
                .get(`/api/users/getuser/${new mongoose_1.default.Types.ObjectId()}`)
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        }));
    });
    describe('GET /api/users/alluser', () => {
        beforeEach(() => {
            authtoken_1.authToken.mockImplementation((req, res, next) => {
                req.user = { id: 'adminUser123', role: 'admin' }; // Mock as admin
                next();
            });
        });
        it('should get all users successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUsers = [
                mockUser,
                Object.assign(Object.assign({}, mockUser), { _id: new mongoose_1.default.Types.ObjectId(), email: 'another@example.com' })
            ];
            user_1.usermodel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUsers)
            });
            const response = yield (0, supertest_1.default)(app)
                .get('/api/users/alluser')
                .set('Authorization', 'Bearer valid-admin-token'); // This token will now be processed as admin
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.count).toBe(2);
            expect(response.body.users).toHaveLength(2);
        }));
        it('should handle empty user list', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([])
            });
            const response = yield (0, supertest_1.default)(app)
                .get('/api/users/alluser')
                .set('Authorization', 'Bearer valid-admin-token');
            expect(response.status).toBe(200);
            expect(response.body.count).toBe(0);
            expect(response.body.users).toHaveLength(0);
        }));
        it('should handle database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.find.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('Database error'))
            });
            const response = yield (0, supertest_1.default)(app)
                .get('/api/users/alluser')
                .set('Authorization', 'Bearer valid-admin-token');
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('An error occurred while retrieving users');
        }));
    });
    describe('Password Reset Flow', () => {
        describe('POST /api/users/request-password-reset-otp', () => {
            it('should request password reset OTP successfully', () => __awaiter(void 0, void 0, void 0, function* () {
                user_1.usermodel.findOne.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValue(mockUser) // User exists for password reset
                });
                user_1.usermodel.mockImplementationOnce(() => (Object.assign(Object.assign({}, mockTempOtpHolder), { save: jest.fn().mockResolvedValue(mockTempOtpHolder) })));
                bcrypt_1.default.hash.mockResolvedValue('hashedPassword'); // For createTempOtpHolder's internal hashing
                mailer_1.default.mockResolvedValue(true);
                const response = yield (0, supertest_1.default)(app)
                    .post('/api/users/request-password-reset-otp')
                    .send({
                    email: 'barondetest@gmail.com'
                });
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Password reset OTP has been sent to your email');
                expect(response.body.otpId).toBeDefined();
                expect(mailer_1.default).toHaveBeenCalledWith(expect.objectContaining({
                    to: 'barondetest@gmail.com',
                    subject: 'BarondeMusical - Password Reset'
                }));
            }));
            it('should return 400 if user does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
                user_1.usermodel.findOne.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValue(null) // User does not exist
                });
                const response = yield (0, supertest_1.default)(app)
                    .post('/api/users/request-password-reset-otp')
                    .send({
                    email: 'nonexistent@example.com'
                });
                expect(response.status).toBe(400); // Controller returns 400 for USER_NOT_FOUND
                expect(response.body.message).toBe('User not found');
            }));
        });
        describe('POST /api/users/reset-password', () => {
            it('should reset password successfully', () => __awaiter(void 0, void 0, void 0, function* () {
                user_1.usermodel.findOne.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValue(mockUser) // Mock user exists and select(+password) works
                });
                // Mock usermodel.findOne for OTP verification in verifyAndCleanupOTP
                user_1.usermodel.findOne.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValue(mockTempOtpHolder) // OTP record is valid
                });
                user_1.usermodel.findByIdAndDelete.mockResolvedValue(true); // OTP cleaned up
                bcrypt_1.default.hash.mockResolvedValue('newHashedPassword'); // New password hashed
                const response = yield (0, supertest_1.default)(app)
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
            }));
            it('should return 400 if required fields are missing', () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app)
                    .post('/api/users/reset-password')
                    .send({
                    email: 'barondetest@gmail.com',
                    otp: '12345'
                    // otpId and newPassword are missing
                });
                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Email, OTP, OTP ID, and new password are required');
            }));
            it('should return 400 if OTP is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
                // Mock usermodel.findOne for initial user check
                user_1.usermodel.findOne.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValue(mockUser)
                });
                // Mock usermodel.findOne for OTP verification (returns null for invalid OTP)
                user_1.usermodel.findOne.mockReturnValueOnce({
                    select: jest.fn().mockResolvedValue(null)
                });
                const response = yield (0, supertest_1.default)(app)
                    .post('/api/users/reset-password')
                    .send({
                    email: 'barondetest@gmail.com',
                    otp: 'invalid',
                    otpId: mockTempOtpHolder._id.toString(),
                    newPassword: 'newPassword123'
                });
                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Invalid or expired OTP');
            }));
        });
    });
    describe('Edge Cases and Error Handling', () => {
        it('should handle malformed JSON', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .set('Content-Type', 'application/json')
                .send('invalid json'); // Send malformed JSON directly
            // Express's body-parser typically catches malformed JSON and returns 400.
            expect(response.status).toBe(400);
        }));
        it('should handle very long input strings', () => __awaiter(void 0, void 0, void 0, function* () {
            const longString = 'a'.repeat(10000);
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/SignUp')
                .send({
                name: longString,
                email: 'barondetest@gmail.com',
                password: 'password123',
                role: 'user',
                otp: '12345',
                otpId: new mongoose_1.default.Types.ObjectId().toString()
            });
            expect(response.status).not.toBeGreaterThanOrEqual(500);
        }));
        it('should handle database connection errors', () => __awaiter(void 0, void 0, void 0, function* () {
            user_1.usermodel.findOne.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('Connection lost'))
            });
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'barondetest@gmail.com',
                password: 'password123'
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to login');
        }));
    });
});
