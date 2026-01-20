"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
router.get('/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const dbStatus = mongoose_1.default.connection.readyState;
    res.status(200).json({
        uptime,
        memoryUsage,
        dbStatus: dbStatus === 1 ? 'connected' : 'disconnected',
    });
});
exports.default = router;
