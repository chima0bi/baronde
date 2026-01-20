"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Soundprince API',
        version: '1.0.0',
        description: 'API documentation for the Soundprince application.',
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Development server',
        },
        {
            url: 'https://baronde.onrender.com',
            description: 'Development server (Render Deployment)',
        },
    ],
};
const options = {
    swaggerDefinition,
    apis: ['./routes/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
