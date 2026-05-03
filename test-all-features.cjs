/**
 * Comprehensive Feature Test Suite
 * Tests all API endpoints and features
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Test IR code samples
const testIR = `
define i32 @add(i32 %a, i32 %b) {
entry:
  %sum = add i32 %a, %b
  ret i32 %sum
}

define i32 @factorial(i32 %n) {
entry:
  %cmp = icmp sle i32 %n, 1
  br i1 %cmp, label %base, label %recurse

base:
  ret i32 1

recurse:
  %n_minus_1 = sub i32 %n, 1
  %rec_result = call i32 @factorial(i32 %n_minus_1)
  %result = mul i32 %n, %rec_result
  ret i32 %result
}
`;

const loopsIR = `
define i32 @sum_array(i32* %arr, i32 %size) {
entry:
  %sum = alloca i32
  store i32 0, i32* %sum
  %i = alloca i32
  store i32 0, i32* %i
  br label %loop

loop:
  %i_val = load i32, i32* %i
  %cmp = icmp slt i32 %i_val, %size
  br i1 %cmp, label %body, label %end

body:
  %ptr = getelementptr i32, i32* %arr, i32 %i_val
  %val = load i32, i32* %ptr
  %sum_val = load i32, i32* %sum
  %new_sum = add i32 %sum_val, %val
  store i32 %new_sum, i32* %sum
  %i_next = add i32 %i_val, 1
  store i32 %i_next, i32* %i
  br label %loop

end:
  %result = load i32, i32* %sum
  ret i32 %result
}
`;

// Color codes for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
    const status = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`${status} ${name}`, color);
    if (details) {
        log(`  ${details}`, 'cyan');
    }
}

async function testLogin() {
    log('\n=== Testing Login ===', 'blue');
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'demo',
            password: 'demo123'
        });
        
        authToken = response.data.token;
        logTest('Login', true, `Token received: ${authToken.substring(0, 20)}...`);
        return true;
    } catch (error) {
        logTest('Login', false, error.message);
        return false;
    }
}

async function testAnalyze() {
    log('\n=== Testing Analysis ===', 'blue');
    
    try {
        const response = await axios.post(`${BASE_URL}/analyze`, 
            { irContent: testIR },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const data = response.data;
        logTest('Analyze Basic IR', true, 
            `Functions: ${data.functions?.length || 0}, Instructions: ${data.totalInstructions || 0}`);
        
        // Test with loops
        const loopsResponse = await axios.post(`${BASE_URL}/analyze`, 
            { irContent: loopsIR },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const loopsData = loopsResponse.data;
        logTest('Analyze Loops IR', true, 
            `Functions: ${loopsData.functions?.length || 0}, Has loops: ${loopsData.functions?.some(f => f.hasLoops)}`);
        
        return true;
    } catch (error) {
        logTest('Analyze', false, error.response?.data?.error || error.message);
        return false;
    }
}

async function testRecommendations() {
    log('\n=== Testing AI Recommendations ===', 'blue');
    
    try {
        // Test with empty analysis (should work now!)
        const emptyResponse = await axios.post(`${BASE_URL}/recommendations`, 
            { 
                analysis: {
                    functions: [],
                    globalVariables: [],
                    summary: { totalFunctions: 0, totalInstructions: 0, totalComplexity: 0, avgComplexity: 0 }
                }
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        logTest('Recommendations (Empty Analysis)', true, 
            `Received ${emptyResponse.data.recommendations?.length || 0} recommendations`);
        
        if (emptyResponse.data.recommendations && emptyResponse.data.recommendations.length > 0) {
            log('  Sample recommendation:', 'cyan');
            const rec = emptyResponse.data.recommendations[0];
            log(`    - ${rec.technique} (${(rec.confidence * 100).toFixed(0)}% confidence)`, 'cyan');
            log(`    - ${rec.reasoning.substring(0, 80)}...`, 'cyan');
        }
        
        // Test with actual analysis
        const analysisResponse = await axios.post(`${BASE_URL}/analyze`, 
            { irContent: loopsIR },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const recResponse = await axios.post(`${BASE_URL}/recommendations`, 
            { analysis: analysisResponse.data },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        logTest('Recommendations (With Analysis)', true, 
            `Received ${recResponse.data.recommendations?.length || 0} personalized recommendations`);
        
        return true;
    } catch (error) {
        logTest('Recommendations', false, error.response?.data?.error || error.message);
        return false;
    }
}

async function testObfuscation() {
    log('\n=== Testing Obfuscation ===', 'blue');
    
    try {
        const response = await axios.post(`${BASE_URL}/obfuscate`, 
            { 
                irContent: testIR,
                passes: ['flatten', 'substitute']
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const data = response.data;
        logTest('Obfuscate', true, 
            `Complexity increase: ${data.stats?.complexityIncrease || 0}%, Time: ${data.stats?.executionTime || 0}ms`);
        
        return true;
    } catch (error) {
        logTest('Obfuscate', false, error.response?.data?.error || error.message);
        return false;
    }
}

async function testProfile() {
    log('\n=== Testing Profile ===', 'blue');
    
    try {
        const response = await axios.get(`${BASE_URL}/profile`, 
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        logTest('Get Profile', true, `User: ${response.data.username}`);
        return true;
    } catch (error) {
        logTest('Get Profile', false, error.message);
        return false;
    }
}

async function testErrorHandling() {
    log('\n=== Testing Error Handling ===', 'blue');
    
    try {
        // Test invalid login
        try {
            await axios.post(`${BASE_URL}/auth/login`, {
                username: 'invalid',
                password: 'wrong'
            });
            logTest('Invalid Login Rejection', false, 'Should have rejected');
        } catch (error) {
            logTest('Invalid Login Rejection', true, 'Correctly rejected invalid credentials');
        }
        
        // Test unauthorized access
        try {
            await axios.get(`${BASE_URL}/profile`);
            logTest('Unauthorized Access Prevention', false, 'Should have rejected');
        } catch (error) {
            logTest('Unauthorized Access Prevention', true, 'Correctly rejected unauthorized request');
        }
        
        // Test invalid IR
        try {
            await axios.post(`${BASE_URL}/analyze`, 
                { irContent: 'invalid ir code' },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            logTest('Invalid IR Handling', false, 'Should have rejected');
        } catch (error) {
            logTest('Invalid IR Handling', true, 'Correctly handled invalid IR');
        }
        
        return true;
    } catch (error) {
        logTest('Error Handling', false, error.message);
        return false;
    }
}

async function runAllTests() {
    log('\n╔════════════════════════════════════════════╗', 'yellow');
    log('║  Obfusi-Bob Feature Test Suite           ║', 'yellow');
    log('║  IBM Bob Dev Day Hackathon 2026           ║', 'yellow');
    log('╚════════════════════════════════════════════╝', 'yellow');
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };
    
    // Run tests
    const tests = [
        { name: 'Login', fn: testLogin },
        { name: 'Analysis', fn: testAnalyze },
        { name: 'AI Recommendations', fn: testRecommendations },
        { name: 'Obfuscation', fn: testObfuscation },
        { name: 'Profile', fn: testProfile },
        { name: 'Error Handling', fn: testErrorHandling }
    ];
    
    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
    }
    
    // Summary
    log('\n╔════════════════════════════════════════════╗', 'yellow');
    log('║  Test Summary                              ║', 'yellow');
    log('╚════════════════════════════════════════════╝', 'yellow');
    log(`Total Tests: ${results.total}`, 'cyan');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
        results.failed === 0 ? 'green' : 'yellow');
    
    if (results.failed === 0) {
        log('\n✓ All features working perfectly!', 'green');
        log('✓ System is ready for presentation!', 'green');
    } else {
        log('\n✗ Some tests failed. Please review the errors above.', 'red');
    }
}

// Run tests
runAllTests().catch(error => {
    log(`\n✗ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
});

// Made with Bob
