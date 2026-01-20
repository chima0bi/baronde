import { signUp, login, getAllUsers, getUser, requestUserOTP, requestPasswordResetOTP, resetPassword } from "../controllers/usercontroller";
import { Router } from "express";
import { authToken } from "../middleware/authtoken";
import { Admin } from "../middleware/rbac";
import { testGenerateAndSendOTP } from "../controllers/usercontroller";
const router = Router()


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
router.post("/request-admin-otp", requestUserOTP);

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
router.post("/request-resetpassword-otp", requestPasswordResetOTP)

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
router.post("/new-password", resetPassword)

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
router.post("/SignUp", signUp);
router.post("/test-otp", testGenerateAndSendOTP)

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
router.post("/login", login)

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
router.get("/getuser/:id", authToken, getUser)

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
router.get("/alluser", authToken, Admin, getAllUsers)
export default router
