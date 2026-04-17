const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
};

const req = http.request(options, (res) => {
    let data = '';
    const setCookie = res.headers['set-cookie'];

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Login Response:', data);
        console.log('Cookies:', setCookie);

        if (setCookie) {
            // Now fetch students
            const cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');

            const req2 = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/api/students',
                method: 'GET',
                headers: {
                    'Cookie': cookieHeader
                }
            }, (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => console.log('Students Response:', data2));
            });
            req2.end();

            const req3 = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/api/location',
                method: 'GET',
                headers: {
                    'Cookie': cookieHeader
                }
            }, (res3) => {
                let data3 = '';
                res3.on('data', chunk => data3 += chunk);
                res3.on('end', () => console.log('Location Response:', data3));
            });
            req3.end();

            const req4 = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/api/notifications',
                method: 'GET',
                headers: {
                    'Cookie': cookieHeader
                }
            }, (res4) => {
                let data4 = '';
                res4.on('data', chunk => data4 += chunk);
                res4.on('end', () => console.log('Notifications Response:', data4));
            });
            req4.end();
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(JSON.stringify({ email: 'parent1@school.com', password: 'password123' }));
req.end();
