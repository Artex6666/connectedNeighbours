import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BobConnect API',
      version: '1.0.0',
      description: 'API REST de la plateforme collaborative de quartier BobConnect',
    },

    servers: [
      {
        url: 'http://localhost:3000/api/v1',
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },

      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: "Message d'erreur",
            },
          },
        },

        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '665f1b2c3d4e5f6a7b8c9d0e',
            },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: {
              type: 'string',
              format: 'email',
            },
            phone: { type: 'string' },
            address: { type: 'string' },
            role: {
              type: 'string',
              enum: ['resident', 'moderator', 'admin'],
            },
            neighborhoodId: {
              type: 'string',
              nullable: true,
            },
            points: {
              type: 'integer',
              example: 0,
            },
            isVerified: { type: 'boolean' },
            isMfaEnabled: { type: 'boolean' },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        Polygon: {
          type: 'object',
          description: 'GeoJSON Polygon',
          properties: {
            type: {
              type: 'string',
              enum: ['Polygon'],
            },
            coordinates: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },

        Neighborhood: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            polygon: {
              $ref: '#/components/schemas/Polygon',
            },
            adminId: { type: 'string' },
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
            },
            isPaid: { type: 'boolean' },
            points: { type: 'integer' },
            status: { type: 'string' },
            authorId: { type: 'string' },
            accepterId: {
              type: 'string',
              nullable: true,
            },
            neighborhoodId: {
              type: 'string',
            },
          },
        },

        Event: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            date: {
              type: 'string',
              format: 'date-time',
            },
            location: { type: 'string' },
            maxParticipants: {
              type: 'integer',
            },
            organizerId: {
              type: 'string',
            },
            neighborhoodId: {
              type: 'string',
            },
          },
        },

        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            senderId: { type: 'string' },
            receiverId: { type: 'string' },
            conversationId: {
              type: 'string',
            },
            content: { type: 'string' },
            type: {
              type: 'string',
              enum: ['text', 'photo', 'audio'],
            },
            isRead: {
              type: 'boolean',
            },
          },
        },

        ConversationSummary: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            avatar: { type: 'string' },
            lastMessage: { type: 'string' },
            lastTimestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        Incident: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
            priority: { type: 'string' },
            createdBy: { type: 'string' },
          },
        },

        Alerte: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            level: { type: 'string' },
            active: { type: 'boolean' },
          },
        },

        DslQueryRequest: {
          type: 'object',
          required: ['query'],
          properties: {
            query: {
              type: 'string',
              example: 'FIND users WHERE email = "dsl@test.fr"',
            },
          },
        },

        DslQueryResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },

            data: {
              type: 'object',
              properties: {
                ast: {
                  type: 'object',
                  properties: {
                    action: {
                      type: 'string',
                      example: 'FIND',
                    },

                    collection: {
                      type: 'string',
                      example: 'users',
                    },

                    filter: {
                      type: 'object',
                      example: {
                        email: 'dsl@test.fr',
                      },
                    },
                  },
                },

                count: {
                  type: 'integer',
                  example: 1,
                },

                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [
    './src/routes/*.ts',
    './src/dsl/*.ts',
    './dist/routes/*.js',
    './dist/dsl/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);