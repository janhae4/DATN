const axios = require('axios');
const API_URL = 'http://localhost:3000/auth';

async function testConcurrentRefresh() {
    const result = await axios.post(`${API_URL}/login`, {
        username: 'newuser',
        password: '1234',
    });

    const { accessToken, refreshToken } = result.data;
    console.log('Refresh token: ', refreshToken);
    const requests = [
        axios.post(`${API_URL}/refresh`, null, {
            headers: { Cookie: `refreshToken=${refreshToken}` },
        }),
        axios.post(`${API_URL}/refresh`, null, {
            headers: { Cookie: `refreshToken=${refreshToken}` },
        }),
    ];

    const results = await Promise.allSettled(requests);

    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            console.log(`Request ${i + 1} ✅ success:`, r.value.data);
        } else {
            console.log(
                `Request ${i + 1} ❌ failed:`,
                r.reason.response?.data || r.reason.message,
            );
        }
    });
}

testConcurrentRefresh();
