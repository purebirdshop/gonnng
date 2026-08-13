import swaggerUi from 'swagger-ui-express';
import { Express, Request, Response } from 'express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Gonnng Platform REST API',
    version: '1.0.0',
    description: 'Interactive OpenAPI 3.0 documentation for the Gonnng application backend services.',
    contact: {
      name: 'Gonnng Support',
      email: 'support@gonnng.app'
    }
  },
  servers: [
    {
      url: '/',
      description: 'Current App Server'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health Check',
        description: 'Returns status and health of the API server.',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    environment: { type: 'string', example: 'Dev' },
                    timestamp: { type: 'string', example: '2026-08-10T08:15:00.000Z' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get Current User Session',
        description: 'Retrieves active user session info if authenticated.',
        tags: ['Authentication'],
        responses: {
          '200': {
            description: 'Active session user details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    authenticated: { type: 'boolean', example: true },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        username: { type: 'string' },
                        avatarUrl: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthenticated or session expired'
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'User Login',
        description: 'Authenticate user account with email and password.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@gonnng.app' },
                  password: { type: 'string', format: 'password', example: 'password123' },
                  rememberMe: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successfully authenticated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { type: 'object' }
                  }
                }
              }
            }
          },
          '401': { description: 'Invalid email address or password' },
          '403': { description: 'Access denied: domain restriction or unauthorized environment' }
        }
      }
    },
    '/api/auth/check-username': {
      post: {
        summary: 'Check Username Availability',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username'],
                properties: {
                  username: { type: 'string', example: 'creator' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Availability result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    available: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/check-email': {
      post: {
        summary: 'Check Email Availability',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'creator@gonnng.app' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Availability result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    available: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'Register New User',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'username'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  name: { type: 'string' },
                  username: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Registration successful' },
          '400': { description: 'Validation error' },
          '403': { description: 'Domain restricted' }
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Request Password Reset',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Password reset link dispatched' }
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Reset Password with Token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Password reset successful' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        summary: 'User Logout',
        tags: ['Authentication'],
        responses: {
          '200': { description: 'Successfully logged out' }
        }
      }
    },
    '/api/email/send': {
      post: {
        summary: 'Send Notification Email',
        tags: ['Email'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to', 'subject', 'html'],
                properties: {
                  to: { type: 'string' },
                  subject: { type: 'string' },
                  html: { type: 'string' },
                  text: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Email sent' }
        }
      }
    },
    '/api/messages/{userId}': {
      get: {
        summary: 'Get Direct Messages with User',
        tags: ['Messaging'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Direct message thread' }
        }
      }
    },
    '/api/messages': {
      post: {
        summary: 'Send Direct Message',
        tags: ['Messaging'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipientId', 'body'],
                properties: {
                  recipientId: { type: 'string' },
                  body: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Message sent' }
        }
      }
    },
    '/api/messages/read': {
      put: {
        summary: 'Mark Direct Messages as Read',
        tags: ['Messaging'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['partnerId'],
                properties: {
                  partnerId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Thread marked read' }
        }
      }
    },
    '/api/messages/accept': {
      put: {
        summary: 'Accept Message Request',
        tags: ['Messaging'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['partnerId'],
                properties: {
                  partnerId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Message request accepted' }
        }
      }
    },
    '/api/messages/decline': {
      put: {
        summary: 'Decline Message Request',
        tags: ['Messaging'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['partnerId'],
                properties: {
                  partnerId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Message request declined' }
        }
      }
    },
    '/api/projects': {
      get: {
        summary: 'List Projects',
        tags: ['Projects'],
        responses: {
          '200': { description: 'List of projects' }
        }
      }
    },
    '/api/storage/status': {
      get: {
        summary: 'Storage Configuration Status',
        tags: ['Storage'],
        responses: {
          '200': { description: 'Storage system details' }
        }
      }
    },
    '/api/storage/upload': {
      post: {
        summary: 'Upload Media File',
        tags: ['Storage'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'File uploaded' }
        }
      }
    },
    '/api/cookie-governance': {
      get: {
        summary: 'Cookie Governance Policy',
        tags: ['Governance'],
        responses: {
          '200': { description: 'Cookie policy details' }
        }
      }
    }
  }
};

export function setupSwagger(app: Express) {
  // Mount Swagger UI at /swagger and /api-docs
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Gonnng API Swagger Documentation',
  }));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Gonnng API Swagger Documentation',
  }));

  // JSON endpoints
  app.get('/swagger.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });

  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
}
