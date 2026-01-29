import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Allergy Scribe - Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        button { padding: 10px 20px; margin: 10px; cursor: pointer; }
        .test-results { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Allergy Scribe - System Test</h1>
    
    <div id="status" class="status info">
        <strong>Status:</strong> Initializing tests...
    </div>
    
    <div>
        <button onclick="testHealth()">Test Health Endpoint</button>
        <button onclick="testAuth()">Test Auth Status</button>
        <button onclick="testDatabase()">Test Database Connection</button>
    </div>
    
    <div id="results" class="test-results" style="display: none;">
        <h3>Test Results:</h3>
        <div id="test-output"></div>
    </div>

    <script>
        function showStatus(message, type = 'info') {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status ' + type;
            statusEl.innerHTML = '<strong>Status:</strong> ' + message;
        }

        function addResult(test, result, details = '') {
            const output = document.getElementById('test-output');
            const resultEl = document.createElement('div');
            resultEl.style.margin = '10px 0';
            resultEl.style.padding = '10px';
            resultEl.style.backgroundColor = result === 'success' ? '#d4edda' : result === 'error' ? '#f8d7da' : '#fff3cd';
            resultEl.style.borderRadius = '4px';
            resultEl.innerHTML = '<strong>' + test + ':</strong> ' + result + (details ? '<br><small>' + details + '</small>' : '');
            output.appendChild(resultEl);
            document.getElementById('results').style.display = 'block';
        }

        async function testHealth() {
            showStatus('Testing health endpoint...', 'info');
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                
                if (response.ok) {
                    showStatus('Health check passed', 'success');
                    addResult('Health Check', 'success', JSON.stringify(data, null, 2));
                } else {
                    showStatus('Health check failed', 'error');
                    addResult('Health Check', 'error', data.message || 'Unknown error');
                }
            } catch (error) {
                showStatus('Health check error: ' + error.message, 'error');
                addResult('Health Check', 'error', error.message);
            }
        }

        async function testAuth() {
            showStatus('Testing authentication...', 'info');
            try {
                const response = await fetch('/api/auth/session');
                const data = await response.json();
                
                if (response.ok) {
                    showStatus('Auth check completed', 'success');
                    addResult('Auth Check', 'success', JSON.stringify(data, null, 2));
                } else {
                    showStatus('Auth check failed', 'error');
                    addResult('Auth Check', 'error', data.message || 'Unknown error');
                }
            } catch (error) {
                showStatus('Auth check error: ' + error.message, 'error');
                addResult('Auth Check', 'error', error.message);
            }
        }

        async function testDatabase() {
            showStatus('Testing database connection...', 'info');
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                
                if (data.database) {
                    showStatus('Database test completed', 'success');
                    addResult('Database Test', 'success', 'Database type: ' + data.database);
                } else {
                    showStatus('Database test failed', 'error');
                    addResult('Database Test', 'error', 'No database information available');
                }
            } catch (error) {
                showStatus('Database test error: ' + error.message, 'error');
                addResult('Database Test', 'error', error.message);
            }
        }

        // Auto-run health test on page load
        window.addEventListener('load', function() {
            setTimeout(() => testHealth(), 1000);
        });
    </script>
</body>
</html>
  `
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}