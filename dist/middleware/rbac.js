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
exports.ManagerandAdmin = exports.Admin = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
})(UserRole || (UserRole = {}));
const Admin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Admin middleware - User:', req.user);
    console.log('Admin middleware - Role:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized - No user found" });
        return;
    }
    if (req.user.role !== 'admin') {
        console.log('Access denied - User role is:', req.user.role);
        res.status(403).json({ message: "Access denied only admin can access this feature" });
        return;
    }
    next();
});
exports.Admin = Admin;
const ManagerandAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized - No user found" });
        return;
    }
    if (!req.user.role) {
        res.status(403).json({ message: "No role specified" });
        return;
    }
    const userRole = req.user.role.toLowerCase();
    if (userRole !== UserRole.ADMIN) {
        res.status(403).json({ message: "Access denied only admin can access this feature" });
        return;
    }
    next();
});
exports.ManagerandAdmin = ManagerandAdmin;
