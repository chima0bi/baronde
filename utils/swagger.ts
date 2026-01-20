import swaggerJSDoc from 'swagger-jsdoc';

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

export const swaggerSpec = swaggerJSDoc(options);
