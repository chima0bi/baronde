"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = __importDefault(require("./db"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const userroute_1 = __importDefault(require("./routes/userroute"));
const imageroute_1 = __importDefault(require("./routes/imageroute"));
const cartroute_1 = __importDefault(require("./routes/cartroute"));
const orderroute_1 = __importDefault(require("./routes/orderroute"));
const healthroute_1 = __importDefault(require("./routes/healthroute"));
const orderanalyticroute_1 = __importDefault(require("./routes/orderanalyticroute"));
const testimonialroute_1 = __importDefault(require("./routes/testimonialroute"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./utils/swagger");
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.use(express_1.default.json({ limit: '500mb' }));
// const whitelist = [
//   'http://localhost:3000',
//   'http://localhost:3001',
//   'http://localhost:5173',
//   "*"
// ];
// const corsOptions = {
//   origin: function(origin: any, callback: any) {
//     if (!origin || whitelist.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   exposedHeaders: ['Authorization']
// };
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true,
    exposedHeaders: ['Authorization']
}));
app.use('/user/v1', userroute_1.default);
app.use('/image/v1', imageroute_1.default);
app.use('/cart/v1', cartroute_1.default);
app.use('/order/v1', orderroute_1.default);
app.use('/health', healthroute_1.default);
app.use('/order-analytics', orderanalyticroute_1.default);
app.use('/testimonial/v1', testimonialroute_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
(0, db_1.default)()
    .then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch(error => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});
app.get("/", (req, res) => {
    res.send("You have reached the backend for my project, Express, Inc");
});
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
