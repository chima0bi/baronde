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
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = require("nodemailer");
require("dotenv/config");
if (process.env.NODE_ENV === "production" &&
    (!process.env.EMAIL_USER_NAME || !process.env.EMAIL_PASS)) {
    throw new Error("Missing email credentials in environment variables.");
}
const transport = (0, nodemailer_1.createTransport)({
    host: process.env.EMAIL_HOSTING_SERVICE,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER_NAME,
        pass: process.env.EMAIL_PASS,
    },
});
const sendmail = (mailoption) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const send = yield transport.sendMail(mailoption);
        console.log("Email sent:", send.messageId);
        return send;
    }
    catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
});
exports.default = sendmail;
