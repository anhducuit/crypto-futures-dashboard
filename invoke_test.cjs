const https = require('https');

function post(url, headers, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: headers
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, statusText: res.statusMessage, body: data }));
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(body));
        req.end();
    });
}

async function testFunctions() {
    const baseUrl = 'https://tnmagcatofooeshzdhac.supabase.co/functions/v1';
    const anonKey = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';

    const functions = ['check-trades', 'price-action-bot'];

    for (const func of functions) {
        console.log(`\n--- Testing ${func} ---`);
        try {
            const start = Date.now();
            const res = await post(`${baseUrl}/${func}`, {
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json'
            }, {});
            const duration = Date.now() - start;

            console.log(`Status: ${res.status} ${res.statusText}`);
            console.log(`Duration: ${duration}ms`);
            let parsedBody = {};
            try { parsedBody = JSON.parse(res.body); } catch (e) { parsedBody = res.body; }

            if (parsedBody.scan_report) {
                console.log('--- SCAN REPORT ---');
                parsedBody.scan_report.forEach(log => console.log(log));
            }
            const bodyString = typeof parsedBody === 'object' ? JSON.stringify(parsedBody, null, 2) : String(parsedBody);
            console.log(`Body: ${bodyString.substring(0, 500)}${bodyString.length > 500 ? '...' : ''}`);
        } catch (error) {
            console.error(`Error invoking ${func}:`, error.message);
        }
    }
}

testFunctions();
