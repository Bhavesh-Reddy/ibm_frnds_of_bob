/**
 * Obfusi-Bob Production API Server
 * Enterprise-grade REST API with authentication, rate limiting, and comprehensive error handling
 */

import http from 'http';
import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Import MCP tools
import { readIRFile } from './mcp-server/dist/tools/read-ir-file.js';
import { analyzeIRStructure } from './mcp-server/dist/tools/analyze-ir.js';
import { executeObfuscationPass } from './mcp-server/dist/tools/execute-pass.js';
import { ragConsultant } from './mcp-server/dist/tools/rag-consultant.js';

const PORT = 3002;
const WORKSPACE_DIR = process.cwd();

// In-memory session store (use Redis in production)
const sessions = new Map();
const rateLimits = new Map();

// Configuration
const CONFIG = {
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 100,
    CORS_ORIGINS: ['http://localhost:3002', 'http://127.0.0.1:3002'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

// Demo credentials (use proper auth service in production)
const DEMO_USERS = {
    'demo@ibm.com': {
        password: 'demo123', // In production, use bcrypt
        name: 'Demo User',
        role: 'Security Engineer',
        id: 'user_demo_001'
    }
};

/**
 * Generate secure session token
 */
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate session
 */
function validateSession(token) {
    const session = sessions.get(token);
    if (!session) return null;
    
    // Check if session expired
    if (Date.now() - session.createdAt > CONFIG.SESSION_TIMEOUT) {
        sessions.delete(token);
        return null;
    }
    
    // Update last accessed
    session.lastAccessed = Date.now();
    return session;
}

/**
 * Rate limiting middleware
 */
function checkRateLimit(identifier) {
    const now = Date.now();
    const userLimits = rateLimits.get(identifier) || { count: 0, resetAt: now + CONFIG.RATE_LIMIT_WINDOW };
    
    if (now > userLimits.resetAt) {
        userLimits.count = 0;
        userLimits.resetAt = now + CONFIG.RATE_LIMIT_WINDOW;
    }
    
    userLimits.count++;
    rateLimits.set(identifier, userLimits);
    
    return {
        allowed: userLimits.count <= CONFIG.RATE_LIMIT_MAX_REQUESTS,
        remaining: Math.max(0, CONFIG.RATE_LIMIT_MAX_REQUESTS - userLimits.count),
        resetAt: userLimits.resetAt
    };
}

/**
 * Parse request body
 */
async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > CONFIG.MAX_FILE_SIZE) {
                reject(new Error('Request body too large'));
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Send JSON response
 */
function sendJSON(res, statusCode, data, headers = {}) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'X-Powered-By': 'Obfusi-Bob/1.0',
        ...headers
    });
    res.end(JSON.stringify(data, null, 2));
}

/**
 * Send error response
 */
function sendError(res, statusCode, message, details = null) {
    const error = {
        success: false,
        error: {
            message,
            code: statusCode,
            timestamp: new Date().toISOString()
        }
    };
    
    if (details) {
        error.error.details = details;
    }
    
    sendJSON(res, statusCode, error);
}

/**
 * CORS headers
 */
function setCORSHeaders(res, origin) {
    if (CONFIG.CORS_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
    }
}

/**
 * API Routes
 */
const routes = {
    // Health check
    'GET /api/health': async (req, res) => {
        sendJSON(res, 200, {
            success: true,
            status: 'healthy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    },
    
    // Authentication - Login
    'POST /api/auth/login': async (req, res) => {
        try {
            const { email, password } = await parseBody(req);
            
            if (!email || !password) {
                return sendError(res, 400, 'Email and password required');
            }
            
            const user = DEMO_USERS[email];
            if (!user || user.password !== password) {
                return sendError(res, 401, 'Invalid credentials');
            }
            
            // Create session
            const token = generateSessionToken();
            sessions.set(token, {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: Date.now(),
                lastAccessed: Date.now()
            });
            
            sendJSON(res, 200, {
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            console.error('[Auth] Login error:', error);
            sendError(res, 500, 'Authentication failed', error.message);
        }
    },
    
    // Authentication - Logout
    'POST /api/auth/logout': async (req, res, session) => {
        const token = req.headers['x-session-token'];
        if (token) {
            sessions.delete(token);
        }
        sendJSON(res, 200, { success: true, message: 'Logged out successfully' });
    },
    
    // Authentication - Validate session
    'GET /api/auth/session': async (req, res, session) => {
        sendJSON(res, 200, {
            success: true,
            data: {
                user: {
                    id: session.userId,
                    email: session.email,
                    name: session.name,
                    role: session.role
                },
                sessionInfo: {
                    createdAt: new Date(session.createdAt).toISOString(),
                    lastAccessed: new Date(session.lastAccessed).toISOString()
                }
            }
        });
    },
    
    // MCP Tools - Read IR File
    'POST /api/tools/read-ir': async (req, res, session) => {
        try {
            const { path: filePath, validate } = await parseBody(req);
            
            if (!filePath) {
                return sendError(res, 400, 'File path required');
            }
            
            console.log(`[API] Reading IR file: ${filePath}`);
            const result = await readIRFile({ path: filePath, validate: validate || false });
            
            sendJSON(res, 200, {
                success: true,
                data: result.data,
                metadata: {
                    userId: session.userId,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[API] Read IR error:', error);
            sendError(res, 500, 'Failed to read IR file', error.message);
        }
    },
    
    // MCP Tools - Analyze IR Structure
    'POST /api/tools/analyze': async (req, res, session) => {
        try {
            const { irPath } = await parseBody(req);
            
            if (!irPath) {
                return sendError(res, 400, 'IR path required');
            }
            
            console.log(`[API] Analyzing IR: ${irPath}`);
            const result = await analyzeIRStructure({ irPath });
            
            sendJSON(res, 200, {
                success: true,
                data: result.data,
                metadata: {
                    userId: session.userId,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[API] Analyze error:', error);
            sendError(res, 500, 'Failed to analyze IR', error.message);
        }
    },
    
    // MCP Tools - Execute Obfuscation Pass
    'POST /api/tools/obfuscate': async (req, res, session) => {
        try {
            const { irPath, passName, outputPath } = await parseBody(req);
            
            if (!irPath || !passName) {
                return sendError(res, 400, 'IR path and pass name required');
            }
            
            console.log(`[API] Executing ${passName} pass on ${irPath}`);
            const result = await executeObfuscationPass({ irPath, passName, outputPath });
            
            sendJSON(res, 200, {
                success: true,
                data: result.data,
                metadata: {
                    userId: session.userId,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[API] Obfuscation error:', error);
            sendError(res, 500, 'Failed to execute obfuscation', error.message);
        }
    },
    
    // MCP Tools - RAG Consultant
    'POST /api/tools/consultant': async (req, res, session) => {
        try {
            const { irPath, context } = await parseBody(req);
            
            if (!irPath) {
                return sendError(res, 400, 'IR path required');
            }
            
            console.log(`[API] RAG Consultant analyzing ${irPath}`);
            const result = await ragConsultant({ irPath, context: context || '' });
            
            sendJSON(res, 200, {
                success: true,
                data: result.data,
                metadata: {
                    userId: session.userId,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('[API] RAG Consultant error:', error);
            sendError(res, 500, 'Failed to get recommendations', error.message);
        }
    },
    
    // Analytics - Get dashboard stats
    'GET /api/analytics/stats': async (req, res, session) => {
        // Mock data - replace with real database queries
        sendJSON(res, 200, {
            success: true,
            data: {
                filesAnalyzed: 24,
                filesObfuscated: 18,
                successRate: 0.92,
                avgProcessingTime: 1.2,
                recentActivity: [
                    {
                        id: 1,
                        type: 'analyze',
                        file: 'main.ll',
                        status: 'success',
                        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
                    },
                    {
                        id: 2,
                        type: 'obfuscate',
                        file: 'main.ll',
                        pass: 'flatten',
                        status: 'success',
                        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
                    }
                ]
            }
        });
    }
};

/**
 * Main request handler
 */
async function handleRequest(req, res) {
    const origin = req.headers.origin || req.headers.referer;
    setCORSHeaders(res, origin);
    
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const routeKey = `${req.method} ${url.pathname}`;
    
    console.log(`[${new Date().toISOString()}] ${routeKey}`);
    
    // Serve static files
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
        try {
            let filePath = url.pathname === '/' ? '/login.html' : url.pathname;
            const fullPath = path.join(WORKSPACE_DIR, filePath);
            
            const content = await fs.readFile(fullPath);
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml'
            };
            
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(content);
            return;
        } catch (error) {
            sendError(res, 404, 'File not found');
            return;
        }
    }
    
    // Check rate limit
    const identifier = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const rateLimit = checkRateLimit(identifier);
    
    res.setHeader('X-RateLimit-Limit', CONFIG.RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());
    
    if (!rateLimit.allowed) {
        return sendError(res, 429, 'Rate limit exceeded');
    }
    
    // Find route handler
    const handler = routes[routeKey];
    if (!handler) {
        return sendError(res, 404, 'Endpoint not found');
    }
    
    // Check authentication (except for public routes)
    const publicRoutes = ['POST /api/auth/login', 'GET /api/health'];
    if (!publicRoutes.includes(routeKey)) {
        const token = req.headers['x-session-token'];
        const session = validateSession(token);
        
        if (!session) {
            return sendError(res, 401, 'Unauthorized - Invalid or expired session');
        }
        
        // Pass session to handler
        try {
            await handler(req, res, session);
        } catch (error) {
            console.error(`[API] Handler error:`, error);
            sendError(res, 500, 'Internal server error', error.message);
        }
    } else {
        try {
            await handler(req, res);
        } catch (error) {
            console.error(`[API] Handler error:`, error);
            sendError(res, 500, 'Internal server error', error.message);
        }
    }
}

/**
 * Start server
 */
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
    console.log('============================================================');
    console.log('  Obfusi-Bob Production API Server');
    console.log('  Enterprise-Grade Code Protection Platform');
    console.log('============================================================\n');
    console.log(`✓ Server running at http://localhost:${PORT}`);
    console.log(`✓ Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`✓ Login: http://localhost:${PORT}/login.html`);
    console.log(`✓ API Base: http://localhost:${PORT}/api/`);
    console.log(`✓ Health Check: http://localhost:${PORT}/api/health\n`);
    console.log('Available API Endpoints:');
    console.log('  POST /api/auth/login          - User authentication');
    console.log('  POST /api/auth/logout         - User logout');
    console.log('  GET  /api/auth/session        - Validate session');
    console.log('  POST /api/tools/read-ir       - Read LLVM IR file');
    console.log('  POST /api/tools/analyze       - Analyze IR structure');
    console.log('  POST /api/tools/obfuscate     - Execute obfuscation');
    console.log('  POST /api/tools/consultant    - Get AI recommendations');
    console.log('  GET  /api/analytics/stats     - Dashboard statistics\n');
    console.log('Demo Credentials:');
    console.log('  Email: demo@ibm.com');
    console.log('  Password: demo123\n');
    console.log('Press Ctrl+C to stop\n');
    console.log('============================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});

// Made with Bob
