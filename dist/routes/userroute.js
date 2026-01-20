"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const usercontroller_1 = require("../controllers/usercontroller");
const express_1 = require("express");
const authtoken_1 = require("../middleware/authtoken");
const rbac_1 = require("../middleware/rbac");
const usercontroller_2 = require("../controllers/usercontroller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management
 */
/**
 * @swagger
 * /user/v1/request-admin-otp:
 *   post:
 *     summary: Request admin OTP
 *     tags: [User]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/request-admin-otp", usercontroller_1.requestUserOTP);
/**
 * @swagger
 * /user/v1/request-resetpassword-otp:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [User]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/request-resetpassword-otp", usercontroller_1.requestPasswordResetOTP);
/**
 * @swagger
 * /user/v1/new-password:
 *   post:
 *     summary: Reset password
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post("/new-password", usercontroller_1.resetPassword);
/**
 * @swagger
 * /user/v1/SignUp:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post("/SignUp", usercontroller_1.signUp);
router.post("/test-otp", usercontroller_2.testGenerateAndSendOTP);
/**
 * @swagger
 * /user/v1/login:
 *   post:
 *     summary: Login a user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User logged in successfully
 */
router.post("/login", usercontroller_1.login);
/**
 * @swagger
 * /user/v1/getuser/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 */
router.get("/getuser/:id", authtoken_1.authToken, usercontroller_1.getUser);
/**
 * @swagger
 * /user/v1/alluser:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of users
 */
router.get("/alluser", authtoken_1.authToken, rbac_1.Admin, usercontroller_1.getAllUsers);
exports.default = router;
