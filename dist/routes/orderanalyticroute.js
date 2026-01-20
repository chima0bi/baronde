"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderanalyticcontroller_1 = require("../controllers/orderanalyticcontroller");
const authtoken_1 = require("../middleware/authtoken");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
router.get('/v1/analytics', authtoken_1.authToken, rbac_1.Admin, orderanalyticcontroller_1.getOrderAnalytics);
exports.default = router;
