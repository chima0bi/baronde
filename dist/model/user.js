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
exports.usermodel = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userschema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false,
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "manager", "user"],
        lowercase: true,
        trim: true
    },
    otp: {
        code: String,
        expiresAt: Date,
    },
    lastPasswordReset: Date,
    loginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date
    }
}, {
    timestamps: true,
});
userschema.index({ "createdAt": 1 }, {
    expireAfterSeconds: 1800,
    partialFilterExpression: { name: { $regex: /^Temp-/ } }
});
userschema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password'))
            return next();
        try {
            const salt = yield bcrypt_1.default.genSalt(12);
            this.password = yield bcrypt_1.default.hash(this.password, salt);
            next();
        }
        catch (error) {
            throw error;
        }
    });
});
userschema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};
exports.usermodel = (0, mongoose_1.model)("users", userschema);
