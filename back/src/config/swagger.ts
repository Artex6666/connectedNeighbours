import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BobConnect API',
      version: '1.0.0',
      description: 'API REST de la plateforme collaborative de quartier BobConnect',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ─── Enveloppe d'erreur ──────────────────────────────────────────────
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: "Message d'erreur" },
          },
        },

        // ─── Entités ─────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665f1b2c3d4e5f6a7b8c9d0e' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            role: { type: 'string', enum: ['resident', 'moderator', 'admin'] },
            neighborhoodId: { type: 'string', nullable: true },
            points: { type: 'integer', example: 0 },
            isVerified: { type: 'boolean' },
            isMfaEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Polygon: {
          type: 'object',
          description: 'GeoJSON Polygon (anneau fermé : premier point = dernier point)',
          properties: {
            type: { type: 'string', enum: ['Polygon'], example: 'Polygon' },
            coordinates: {
              type: 'array',
              description: "Tableau d'anneaux ; chaque anneau est une liste de [lng, lat]",
              items: {
                type: 'array',
                items: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
              },
              example: [[[2.35, 48.85], [2.36, 48.85], [2.36, 48.86], [2.35, 48.86], [2.35, 48.85]]],
            },
          },
        },
        Neighborhood: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            polygon: { $ref: '#/components/schemas/Polygon' },
            adminId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Service: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: ['bricolage', 'jardinage', 'garde_animaux', 'cours_particuliers', 'demenagement', 'autre'],
            },
            isPaid: { type: 'boolean' },
            points: { type: 'integer', minimum: 0 },
            status: { type: 'string', enum: ['open', 'pending', 'in_progress', 'done', 'cancelled'] },
            authorId: { type: 'string' },
            accepterId: { type: 'string', nullable: true },
            neighborhoodId: { type: 'string' },
            photos: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            maxParticipants: { type: 'integer', minimum: 1 },
            organizerId: { type: 'string' },
            neighborhoodId: { type: 'string' },
            coverPhoto: { type: 'string', nullable: true },
            participants: { type: 'array', items: { type: 'string' } },
            waitingList: { type: 'array', items: { type: 'string' } },
            isCancelled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            senderId: { type: 'string' },
            receiverId: { type: 'string' },
            conversationId: { type: 'string' },
            content: {
              type: 'string',
              description: 'Texte du message, ou URL publique du média pour les types photo/audio',
            },
            type: { type: 'string', enum: ['text', 'photo', 'audio'] },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ConversationSummary: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['resident', 'moderator', 'admin'] },
            avatar: { type: 'string', example: 'AM' },
            lastMessage: { type: 'string' },
            lastTimestamp: { type: 'string', format: 'date-time' },
          },
        },
        Incident: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['open', 'in_progress', 'resolved'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            createdBy: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Alerte: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            level: { type: 'string', enum: ['info', 'warning', 'danger'] },
            active: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
 apis: [
   './src/routes/*.ts',
   './dist/routes/*.js',
 ],
};

export const swaggerSpec = swaggerJsdoc(options);
