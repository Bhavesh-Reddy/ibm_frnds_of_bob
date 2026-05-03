/**
 * Obfusi-Bob API Test Suite
 * Comprehensive integration and unit tests
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';

const API_BASE = 'http://localhost:3002';
let sessionToken = null;

/**
 * Helper function to make HTTP requests
 */
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, headers: res.headers, data: parsed });
                } catch (error) {
                    resolve({ status: res.statusCode, headers: res.headers, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

/**
 * Test Suite: Health Check
 */
describe('Health Check', () => {
    it('should return healthy status', async () => {
        const response = await makeRequest('GET', '/api/health');
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.success, true);
        assert.strictEqual(response.data.status, 'healthy');
        assert.ok(response.data.version);
        assert.ok(response.data.timestamp);
    });
});

/**
 * Test Suite: Authentication
 */
describe('Authentication', () => {
    it('should reject login with invalid credentials', async () => {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: 'invalid@example.com',
            password: 'wrongpassword'
        });
        
        assert.strictEqual(response.status, 401);
        assert.strictEqual(response.data.success, false);
    });

    it('should reject login with missing credentials', async () => {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: 'demo@ibm.com'
        });
        
        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.data.success, false);
    });

    it('should successfully login with valid credentials', async () => {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: 'demo@ibm.com',
            password: 'demo123'
        });
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.success, true);
        assert.ok(response.data.data.token);
        assert.ok(response.data.data.user);
        assert.strictEqual(response.data.data.user.email, 'demo@ibm.com');
        
        // Store token for subsequent tests
        sessionToken = response.data.data.token;
    });

    it('should validate session with valid token', async () => {
        const response = await makeRequest('GET', '/api/auth/session', null, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.success, true);
        assert.ok(response.data.data.user);
    });

    it('should reject requests with invalid token', async () => {
        const response = await makeRequest('GET', '/api/auth/session', null, {
            'X-Session-Token': 'invalid-token'
        });
        
        assert.strictEqual(response.status, 401);
        assert.strictEqual(response.data.success, false);
    });
});

/**
 * Test Suite: Rate Limiting
 */
describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
        const response = await makeRequest('GET', '/api/health');
        
        assert.ok(response.headers['x-ratelimit-limit']);
        assert.ok(response.headers['x-ratelimit-remaining']);
        assert.ok(response.headers['x-ratelimit-reset']);
    });

    it('should enforce rate limits', async () => {
        // Make many requests quickly
        const requests = Array(105).fill(null).map(() => 
            makeRequest('GET', '/api/health')
        );
        
        const responses = await Promise.all(requests);
        const rateLimited = responses.some(r => r.status === 429);
        
        assert.ok(rateLimited, 'Should hit rate limit after 100 requests');
    });
});

/**
 * Test Suite: MCP Tools - Read IR File
 */
describe('MCP Tools - Read IR File', () => {
    it('should reject unauthorized requests', async () => {
        const response = await makeRequest('POST', '/api/tools/read-ir', {
            path: 'test-samples/simple.ll'
        });
        
        assert.strictEqual(response.status, 401);
    });

    it('should reject requests without file path', async () => {
        const response = await makeRequest('POST', '/api/tools/read-ir', {}, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 400);
    });

    it('should successfully read IR file', async () => {
        const response = await makeRequest('POST', '/api/tools/read-ir', {
            path: 'test-samples/simple.ll',
            validate: false
        }, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.success, true);
        assert.ok(response.data.data.content);
        assert.ok(response.data.data.size);
        assert.ok(response.data.data.hash);
    });
});

/**
 * Test Suite: MCP Tools - Analyze IR
 */
describe('MCP Tools - Analyze IR', () => {
    it('should reject requests without IR path', async () => {
        const response = await makeRequest('POST', '/api/tools/analyze', {}, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 400);
    });

    it('should successfully analyze IR file', async () => {
        const response = await makeRequest('POST', '/api/tools/analyze', {
            irPath: 'test-samples/simple.ll'
        }, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.success, true);
        assert.ok(response.data.data.functions);
        assert.ok(Array.isArray(response.data.data.functions));
        assert.ok(typeof response.data.data.totalInstructions === 'number');
    });
});

/**
 * Test Suite: MCP Tools - Obfuscate
 */
describe('MCP Tools - Obfuscate', () => {
    it('should reject requests without required parameters', async () => {
        const response = await makeRequest('POST', '/api/tools/obfuscate', {
            irPath: 'test-samples/simple.ll'
        }, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 400);
    });

    it('should handle obfuscation request', async () => {
        const response = await makeRequest('POST', '/api/tools/obfuscate', {
            irPath: 'test-samples/simple.ll',
            passName: 'mem2reg',
            outputPath: 'test-samples/simple.obfuscated.ll'
        }, {
            'X-Session-Token': sessionToken
        });
        
        // May fail if LLVM not installed, but should return proper response
        assert.ok([200, 500].includes(response.status));
        assert.ok(response.data.success !== undefined);
    });
});

/**
 * Test Suite: MCP Tools - RAG Consultant
 */
describe('MCP Tools - RAG Consultant', () => {
    it('should reject requests without IR path', async () => {
        const response = await makeRequest('POST', '/api/tools/consultant', {}, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 400);
    });

    it('should successfully get AI recommendations', async () => {
        const response = await makeRequest('POST', '/api/tools/consultant', {
            irPath: 'test-samples/simple.ll',
            context: 'High-security application'
        }, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.success, true);
        assert.ok(response.data.data.recommendations);
        assert.ok(Array.isArray(response.data.data.recommendations));
        
        if (response.data.data.recommendations.length > 0) {
            const rec = response.data.data.recommendations[0];
            assert.ok(rec.technique);
            assert.ok(typeof rec.confidence === 'number');
            assert.ok(rec.reasoning);
        }
    });
});

/**
 * Test Suite: Analytics
 */
describe('Analytics', () => {
    it('should return dashboard statistics', async () => {
        const response = await makeRequest('GET', '/api/analytics/stats', null, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.success, true);
        assert.ok(typeof response.data.data.filesAnalyzed === 'number');
        assert.ok(typeof response.data.data.filesObfuscated === 'number');
        assert.ok(typeof response.data.data.successRate === 'number');
        assert.ok(Array.isArray(response.data.data.recentActivity));
    });
});

/**
 * Test Suite: Error Handling
 */
describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
        const response = await makeRequest('GET', '/api/nonexistent');
        
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.data.success, false);
    });

    it('should handle malformed JSON', async () => {
        const response = await new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3002,
                path: '/api/auth/login',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({ 
                        status: res.statusCode, 
                        data: body ? JSON.parse(body) : {} 
                    });
                });
            });
            req.write('invalid json{');
            req.end();
        });
        
        assert.strictEqual(response.status, 500);
    });
});

/**
 * Test Suite: Logout
 */
describe('Logout', () => {
    it('should successfully logout', async () => {
        const response = await makeRequest('POST', '/api/auth/logout', null, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.success, true);
    });

    it('should invalidate session after logout', async () => {
        const response = await makeRequest('GET', '/api/auth/session', null, {
            'X-Session-Token': sessionToken
        });
        
        assert.strictEqual(response.status, 401);
    });
});

/**
 * Run all tests
 */
console.log('\n🧪 Running Obfusi-Bob API Test Suite...\n');
console.log('Make sure the API server is running on http://localhost:3002\n');

// Made with Bob
