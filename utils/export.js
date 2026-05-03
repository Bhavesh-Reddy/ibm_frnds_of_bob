/**
 * Export and Reporting Utilities
 * Generate PDF reports, CSV exports, and JSON data exports
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate CSV from analysis results
 */
export function generateAnalysisCSV(analysisData) {
    const headers = [
        'Timestamp',
        'File Name',
        'Functions Count',
        'Instructions Count',
        'Basic Blocks',
        'Complexity Score',
        'Has Loops',
        'Has Conditionals'
    ];
    
    const rows = [];
    
    // Add header row
    rows.push(headers.join(','));
    
    // Add data rows
    if (Array.isArray(analysisData)) {
        analysisData.forEach(analysis => {
            const row = [
                new Date(analysis.timestamp || Date.now()).toISOString(),
                analysis.fileName || 'unknown',
                analysis.functions?.length || 0,
                analysis.totalInstructions || 0,
                analysis.functions?.reduce((sum, f) => sum + (f.basicBlocks || 0), 0) || 0,
                calculateComplexity(analysis),
                analysis.functions?.some(f => f.hasLoops) ? 'Yes' : 'No',
                analysis.functions?.some(f => f.hasConditionals) ? 'Yes' : 'No'
            ];
            rows.push(row.join(','));
        });
    }
    
    return rows.join('\n');
}

/**
 * Generate CSV from obfuscation operations
 */
export function generateObfuscationCSV(operations) {
    const headers = [
        'Timestamp',
        'File Name',
        'Pass Name',
        'Status',
        'Execution Time (ms)',
        'Complexity Before',
        'Complexity After',
        'Improvement %'
    ];
    
    const rows = [];
    rows.push(headers.join(','));
    
    if (Array.isArray(operations)) {
        operations.forEach(op => {
            const row = [
                new Date(op.timestamp || Date.now()).toISOString(),
                op.fileName || 'unknown',
                op.passName || 'unknown',
                op.status || 'unknown',
                op.executionTime || 0,
                op.complexityBefore || 0,
                op.complexityAfter || 0,
                op.complexityBefore ? 
                    (((op.complexityAfter - op.complexityBefore) / op.complexityBefore) * 100).toFixed(2) : 
                    '0'
            ];
            rows.push(row.join(','));
        });
    }
    
    return rows.join('\n');
}

/**
 * Generate comprehensive JSON report
 */
export function generateJSONReport(data) {
    const report = {
        metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0.0',
            platform: 'Obfusi-Bob'
        },
        summary: {
            totalFiles: data.analyses?.length || 0,
            totalOperations: data.operations?.length || 0,
            successRate: calculateSuccessRate(data.operations),
            avgComplexityIncrease: calculateAvgComplexityIncrease(data.operations),
            avgExecutionTime: calculateAvgExecutionTime(data.operations)
        },
        analyses: data.analyses || [],
        operations: data.operations || [],
        recommendations: data.recommendations || []
    };
    
    return JSON.stringify(report, null, 2);
}

/**
 * Generate HTML report
 */
export function generateHTMLReport(data) {
    const successRate = calculateSuccessRate(data.operations);
    const avgComplexity = calculateAvgComplexityIncrease(data.operations);
    const avgTime = calculateAvgExecutionTime(data.operations);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Obfusi-Bob Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
        }
        .header h1 { font-size: 32px; margin-bottom: 8px; }
        .header p { opacity: 0.9; }
        .content { padding: 40px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 24px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        .stat-card h3 {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .stat-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #1a1a1a;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        tr:hover { background: #f8f9fa; }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .footer {
            background: #f8f9fa;
            padding: 24px 40px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Obfusi-Bob Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <h3>Total Files</h3>
                    <div class="value">${data.analyses?.length || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>Operations</h3>
                    <div class="value">${data.operations?.length || 0}</div>
                </div>
                <div class="stat-card">
                    <h3>Success Rate</h3>
                    <div class="value">${successRate}%</div>
                </div>
                <div class="stat-card">
                    <h3>Avg Complexity Increase</h3>
                    <div class="value">${avgComplexity}%</div>
                </div>
            </div>
            
            <div class="section">
                <h2>Analysis Results</h2>
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Functions</th>
                            <th>Instructions</th>
                            <th>Complexity</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.analyses || []).map(a => `
                            <tr>
                                <td>${a.fileName || 'unknown'}</td>
                                <td>${a.functions?.length || 0}</td>
                                <td>${a.totalInstructions || 0}</td>
                                <td>${calculateComplexity(a)}</td>
                                <td>${new Date(a.timestamp || Date.now()).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>Obfuscation Operations</h2>
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Pass</th>
                            <th>Status</th>
                            <th>Time (ms)</th>
                            <th>Improvement</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.operations || []).map(op => `
                            <tr>
                                <td>${op.fileName || 'unknown'}</td>
                                <td>${op.passName || 'unknown'}</td>
                                <td>
                                    <span class="badge ${op.status === 'success' ? 'badge-success' : 'badge-error'}">
                                        ${op.status || 'unknown'}
                                    </span>
                                </td>
                                <td>${op.executionTime || 0}</td>
                                <td>${op.complexityBefore ? 
                                    (((op.complexityAfter - op.complexityBefore) / op.complexityBefore) * 100).toFixed(1) : 
                                    '0'}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by Obfusi-Bob v1.0.0 | IBM Bob Dev Day Hackathon 2026</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Save export to file
 */
export async function saveExport(content, filename, format = 'txt') {
    const exportsDir = path.join(process.cwd(), 'exports');
    
    // Create exports directory if it doesn't exist
    try {
        await fs.access(exportsDir);
    } catch {
        await fs.mkdir(exportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullFilename = `${filename}_${timestamp}.${format}`;
    const filepath = path.join(exportsDir, fullFilename);
    
    await fs.writeFile(filepath, content, 'utf-8');
    
    return {
        success: true,
        filepath,
        filename: fullFilename,
        size: Buffer.byteLength(content, 'utf-8')
    };
}

/**
 * Helper: Calculate complexity score
 */
function calculateComplexity(analysis) {
    const functions = analysis.functions?.length || 0;
    const instructions = analysis.totalInstructions || 0;
    const avgInstructionsPerFunction = functions > 0 ? instructions / functions : 0;
    
    return Math.min(100, Math.round(
        functions * 2 + 
        avgInstructionsPerFunction * 0.5 +
        (analysis.functions?.filter(f => f.hasLoops).length || 0) * 5
    ));
}

/**
 * Helper: Calculate success rate
 */
function calculateSuccessRate(operations) {
    if (!operations || operations.length === 0) return 0;
    
    const successful = operations.filter(op => op.status === 'success').length;
    return Math.round((successful / operations.length) * 100);
}

/**
 * Helper: Calculate average complexity increase
 */
function calculateAvgComplexityIncrease(operations) {
    if (!operations || operations.length === 0) return 0;
    
    const increases = operations
        .filter(op => op.complexityBefore && op.complexityAfter)
        .map(op => ((op.complexityAfter - op.complexityBefore) / op.complexityBefore) * 100);
    
    if (increases.length === 0) return 0;
    
    const avg = increases.reduce((sum, val) => sum + val, 0) / increases.length;
    return Math.round(avg * 10) / 10;
}

/**
 * Helper: Calculate average execution time
 */
function calculateAvgExecutionTime(operations) {
    if (!operations || operations.length === 0) return 0;
    
    const times = operations
        .filter(op => op.executionTime)
        .map(op => op.executionTime);
    
    if (times.length === 0) return 0;
    
    return Math.round(times.reduce((sum, val) => sum + val, 0) / times.length);
}

/**
 * Generate markdown report
 */
export function generateMarkdownReport(data) {
    const successRate = calculateSuccessRate(data.operations);
    const avgComplexity = calculateAvgComplexityIncrease(data.operations);
    const avgTime = calculateAvgExecutionTime(data.operations);
    
    return `# Obfusi-Bob Report

**Generated:** ${new Date().toLocaleString()}  
**Platform:** Obfusi-Bob v1.0.0

---

## Summary

| Metric | Value |
|--------|-------|
| Total Files Analyzed | ${data.analyses?.length || 0} |
| Total Operations | ${data.operations?.length || 0} |
| Success Rate | ${successRate}% |
| Avg Complexity Increase | ${avgComplexity}% |
| Avg Execution Time | ${avgTime}ms |

---

## Analysis Results

${(data.analyses || []).map((a, i) => `
### ${i + 1}. ${a.fileName || 'Unknown File'}

- **Functions:** ${a.functions?.length || 0}
- **Instructions:** ${a.totalInstructions || 0}
- **Complexity Score:** ${calculateComplexity(a)}
- **Has Loops:** ${a.functions?.some(f => f.hasLoops) ? 'Yes' : 'No'}
- **Has Conditionals:** ${a.functions?.some(f => f.hasConditionals) ? 'Yes' : 'No'}
- **Date:** ${new Date(a.timestamp || Date.now()).toLocaleDateString()}
`).join('\n')}

---

## Obfuscation Operations

${(data.operations || []).map((op, i) => `
### ${i + 1}. ${op.fileName || 'Unknown File'} - ${op.passName || 'Unknown Pass'}

- **Status:** ${op.status || 'unknown'}
- **Execution Time:** ${op.executionTime || 0}ms
- **Complexity Before:** ${op.complexityBefore || 0}
- **Complexity After:** ${op.complexityAfter || 0}
- **Improvement:** ${op.complexityBefore ? 
    (((op.complexityAfter - op.complexityBefore) / op.complexityBefore) * 100).toFixed(1) : 
    '0'}%
- **Date:** ${new Date(op.timestamp || Date.now()).toLocaleDateString()}
`).join('\n')}

---

## AI Recommendations

${(data.recommendations || []).map((rec, i) => `
### ${i + 1}. ${rec.technique || 'Unknown Technique'}

- **Confidence:** ${(rec.confidence * 100).toFixed(1)}%
- **Effectiveness:** ${(rec.effectiveness * 100).toFixed(1)}%
- **Overhead:** ${rec.overhead || 'Unknown'}
- **Reasoning:** ${rec.reasoning || 'No reasoning provided'}
`).join('\n')}

---

*Report generated by Obfusi-Bob - IBM Bob Dev Day Hackathon 2026*
`;
}

// Made with Bob
