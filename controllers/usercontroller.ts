import "dotenv/config";
import express, { Request, Response } from "express";
import { usermodel } from "../model/user";
import { JsonWebTokenError, sign } from "jsonwebtoken";
import bcrypt from "bcrypt";
import sendmail from "../utils/mailer";

import crypto from "crypto";
import nodemailer from "nodemailer";
import { RequestHandler } from "express";

const CONSTANTS = {
  OTP_EXPIRY_HOURS: 1,
  LOCKOUT_DURATION_MINUTES: 15,
  MAX_LOGIN_ATTEMPTS: 5,
};

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED: "Account temporarily locked due to too many failed attempts",
  OTP_EXPIRED: "OTP has expired or is invalid",
  MISSING_FIELDS: "Required fields are missing",
  EMAIL_IN_USE: "Email already in use",
  USER_NOT_FOUND: "User not found",
  INVALID_OTP: "Invalid or expired OTP",
  INVALID_USER_ID: "Invalid user ID format",
};

export const generateToken = (userId: string): string => {
  const secretKey = process.env.SECRET_KEY as string;
  return sign({ id: userId }, secretKey, { expiresIn: "1d" });
};

const generateOTP = (): string => {
  return crypto.randomInt(10000, 99999).toString();
};

const getOTPExpiryTime = (): Date => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CONSTANTS.OTP_EXPIRY_HOURS);
  return expiresAt;
};

const createTempOTPHolder = async (
  name: string,
  email: string,
  otp: string,
) => {
  const tempOtpHolder = new usermodel({
    name: `Temp-${name}`,
    email: `temp-${Date.now()}-${email}`,
    password: "temporaryPassword" + Math.random(),
    role: "user",
    otp: {
      code: otp,
      expiresAt: getOTPExpiryTime(),
    },
  });

  return await tempOtpHolder.save();
};

const sendOTPEmail = async (
  email: string,
  name: string,
  otp: string,
  purpose: string,
) => {
  const mailOptions = {
    from: `"BarondeMusical" <${process.env.EMAIL_USER_NAME}>`,
    to: email,
    subject: `BarondeMusical - ${purpose}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #222;">BarondeMusical OTP Verification</h2>
        <p>Hello ${name},</p>
        <p>Your one-time password for ${purpose.toLowerCase()} is:</p>
        <h3 style="background-color: #f0f0f0; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h3>
        <p>This OTP will expire in ${CONSTANTS.OTP_EXPIRY_HOURS} hours.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="margin: 20px 0;" />
        <small style="color: #888;">This is an automated message from BarondeMusical.</small>
      </div>
    `,
  };

  await sendmail(mailOptions);
};

const sendWelcomeEmail = async (email: string, name: string) => {
  const welcomeMailOptions = {
    from: `"BarondeMusical" <${process.env.EMAIL_USER_NAME}>`,
    to: email,
    subject: "Welcome to BarondeMusical",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #222;">Welcome to BarondeMusical</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up to <strong>BarondeMusical</strong> — your new go-to destination for exclusive Musical assets, collectibles, and unique market experiences.</p>
        <p>We're thrilled to have you join our growing community. Here's what you can do next:</p>
        <ul>
          <li>Explore unique listings and rare finds</li>
          <li>Manage your collection and profile</li>
          <li>Stay tuned for upcoming auctions and marketplace updates</li>
        </ul>
        <p>If you ever need help, questions, or suggestions — we're just a message away.</p>
        <p style="margin-top: 30px;">Welcome aboard!</p>
        <p>The <strong>BarondeMusical</strong> Team</p>
        <hr style="margin: 40px 0;" />
        <small style="color: #888;">You received this email because you signed up for an account at BarondeMusical.</small>
      </div>
    `,
  };

  await sendmail(welcomeMailOptions);
};

const verifyAndCleanupOTP = async (otpId: string, otp: string) => {
  const otpRecord = await usermodel.findOne({
    _id: otpId,
    "otp.code": otp,
    "otp.expiresAt": { $gt: new Date() },
  });

  if (!otpRecord) {
    return false;
  }

  await usermodel.findByIdAndDelete(otpId);
  return true;
};

export const requestUserOTP = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      res.status(400).json({ message: "Name and email are required" });
      return;
    }

    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: ERROR_MESSAGES.EMAIL_IN_USE });
      return;
    }

    const otp = generateOTP();
    const tempOtpHolder = await createTempOTPHolder(name, email, otp);

    await sendOTPEmail(email, name, otp, "User Registration");

    res.status(200).json({
      message: "OTP has been sent to your email",
      otpId: tempOtpHolder._id,
    });
  } catch (error) {
    console.error("OTP request error:", error);
    res.status(500).json({ message: "Failed to request OTP" });
  }
};

export const signUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = "user", otp, otpId } = req.body;

    if (!name || !email || !password) {
      res
        .status(400)
        .json({ message: "Name, email and password are required" });
      return;
    }

    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: ERROR_MESSAGES.EMAIL_IN_USE });
      return;
    }

    if (role === "user") {
      if (!otp || !otpId) {
        res.status(400).json({
          message: "OTP and OTP ID are required for user registration",
        });
        return;
      }

      // Verify OTP
      const isOTPValid = await verifyAndCleanupOTP(otpId, otp);
      if (!isOTPValid) {
        res.status(400).json({ message: ERROR_MESSAGES.INVALID_OTP });
        return;
      }
    }

    const user = new usermodel({
      name,
      email,
      password,
      role,
    });
    await user.save();

    const token = generateToken(user.id);
    res.setHeader("Authorization", `Bearer ${token}`);

    await sendWelcomeEmail(user.email, user.name);

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Unable to create account" });
  }
};

/**
 * Request OTP for password reset
 */
export const requestPasswordResetOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email address is required" });
      return;
    }

    const user = await usermodel.findOne({ email });
    if (!user) {
      res.status(400).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
      return;
    }

    const otp = generateOTP();
    const tempOtpHolder = await createTempOTPHolder(user.name, email, otp);

    await sendOTPEmail(email, user.name, otp, "Password Reset");

    res.status(200).json({
      message: "Password reset OTP has been sent to your email",
      otpId: tempOtpHolder._id,
    });
  } catch (error) {
    console.error("Password reset OTP request error:", error);
    res.status(500).json({ message: "Failed to request password reset OTP" });
  }
};

/**
 * Reset password with OTP verification
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, otpId, newPassword } = req.body;

    if (!email || !otp || !otpId || !newPassword) {
      res.status(400).json({
        message: "Email, OTP, OTP ID, and new password are required",
      });
      return;
    }

    const user = await usermodel.findOne({ email }).select("+password");
    if (!user) {
      res.status(400).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
      return;
    }

    const isOTPValid = await verifyAndCleanupOTP(otpId, otp);
    if (!isOTPValid) {
      res.status(400).json({ message: ERROR_MESSAGES.INVALID_OTP });
      return;
    }

    await user.updateOne({ password: newPassword });

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await usermodel.findOne({ email }).select("+password");
    if (!user) {
      res.status(400).json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS });
      return;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 1000,
      );
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      res.status(423).json({
        message: `Account locked. Try again in ${minutes}m ${seconds}s`,
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      user.loginAttempts++;
      if (user.loginAttempts >= CONSTANTS.MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(
          Date.now() + CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
      }
      await user.save();

      res.status(400).json({
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
      return;
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    const token = generateToken(user.id);
    res.setHeader("Authorization", `Bearer ${token}`);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: ERROR_MESSAGES.INVALID_USER_ID });
      return;
    }

    const user = await usermodel.findById(id);
    if (!user) {
      res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "User retrieved successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the user",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await usermodel
      .find()
      .select("-password -otp -loginAttempts -lockUntil");

    res.status(200).json({
      status: "success",
      message: "All users retrieved successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({
      message: "An error occurred while retrieving users",
    });
  }
};

export const testGenerateAndSendOTP: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      // port: 587,
      secure: true, // true for 465, false for other ports
      auth: {
        user: "ozomameluchimaobi123@gmail.com",
        pass: "qfaapgfkgwrnffva",
      },
    });

    // Send email
    const mailOptions = {
      from: "ozomameluchimaobi123@gmail.com",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "OTP sent successfully",
      otp: otp, // For testing purposes, include OTP in response
    });
    return;
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      message: "Failed to send OTP",
    });
    return;
  }
};
