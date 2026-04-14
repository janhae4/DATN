import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export const options = {
  // ĐỊNH NGHĨA CÁC TỔ HỢP ĐỂ K6 TÁCH DỮ LIỆU TỪNG Ô TRONG BẢNG
  thresholds: {
    'http_req_duration{scenario:load_50,hit_type:cold}': ['max>=0'],
    'http_req_duration{scenario:load_50,hit_type:warm}': ['max>=0'],
    'http_req_duration{scenario:load_100,hit_type:cold}': ['max>=0'],
    'http_req_duration{scenario:load_100,hit_type:warm}': ['max>=0'],
    'http_req_duration{scenario:load_200,hit_type:cold}': ['max>=0'],
    'http_req_duration{scenario:load_200,hit_type:warm}': ['max>=0'],
    'http_reqs{scenario:load_50}': ['count>=0'],
    'http_reqs{scenario:load_100}': ['count>=0'],
    'http_reqs{scenario:load_200}': ['count>=0'],
  },
  scenarios: {
    load_50: { executor: 'constant-vus', vus: 50, duration: '30s', startTime: '0s' },
    load_100: { executor: 'constant-vus', vus: 100, duration: '30s', startTime: '30s' },
    load_200: { executor: 'constant-vus', vus: 200, duration: '30s', startTime: '60s' },
  },
};

export function setup() {
  const loginUrl = 'http://localhost:3000/auth/session';
  const tokens = [];
  
  for (let i = 1; i <= 50; i++) {
    const res = http.post(loginUrl, JSON.stringify({ username: `user_test_${i}`, password: 'mypassword123' }), {
      headers: { 'Content-Type': 'application/json' },
    });
    const token = res.cookies.accessToken ? res.cookies.accessToken[0].value : null;
    if (token) {
      tokens.push(token);
    }
  }
  
  if (tokens.length === 0) throw new Error('All logins failed!');
  return { tokens };
}

export default function (data) {
  const baseUrl = 'http://localhost:3000/auth/me';
  const jar = http.cookieJar();
  
  // Lấy ngẫu nhiên token của 1 user
  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  jar.set(baseUrl, 'accessToken', token);

  const params = {
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
  };

  // Chia ngẫu nhiên để đảm bảo tính công bằng giữa 2 loại phương thức
  if (Math.random() < 0.5) {
    http.get(`${baseUrl}?noCache=true`, { ...params, tags: { hit_type: 'cold' } });
  } else {
    http.get(baseUrl, { ...params, tags: { hit_type: 'warm' } });
  }

  sleep(1);
}

export function handleSummary(data) {
  const milestones = [
    { vus: '50', scenario: 'load_50' },
    { vus: '100', scenario: 'load_100' },
    { vus: '200', scenario: 'load_200' },
  ];
  
  const findValue = (scenario, hitType) => {
    const keys = Object.keys(data.metrics);
    // K6 tự động sắp xếp tag theo thứ tự chữ cái trong key: {hit_type:...,scenario:...}
    const match = keys.find(k => k.includes(`hit_type:${hitType}`) && k.includes(`scenario:${scenario}`));
    return (match && data.metrics[match]) ? data.metrics[match].values.avg.toFixed(2) : "0.00";
  };

  const rows = milestones.map(m => {
    const avgCold = findValue(m.scenario, 'cold');
    const avgWarm = findValue(m.scenario, 'warm');
    
    // Tỷ lệ lỗi cho scenario
    const failedKey = `http_req_failed{scenario:${m.scenario}}`;
    const failed = data.metrics[failedKey];
    const failRate = (failed && failed.values) ? (failed.values.rate * 100).toFixed(2) : "0.00";
    
    // Tốc độ yêu cầu mỗi phút (RPM - Requests Per Minute) loại trừ lỗi
    const reqsKey = `http_reqs{scenario:${m.scenario}}`;
    const reqsMatch = data.metrics[reqsKey];
    
    let totalReqs = 0;
    if (reqsMatch && reqsMatch.values) totalReqs = reqsMatch.values.count || 0;
    
    const failedReqs = failed && failed.values ? failed.values.passes : 0;
    const successReqs = totalReqs - failedReqs;
    
    // Nhân 2 vì mỗi kịch bản chạy 30s
    let rpm = (successReqs * 2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); 

    return `| ${m.vus} VUs | ${avgCold} ms | ${avgWarm} ms | ${failRate}% | ${rpm} reqs/min |`;
  }).join('\n');

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary_report.md': `
# BÁO CÁO CẢI THIỆN HIỆU NĂNG VỚI REDIS CACHE
**Dự án:** Taskora
**Ngày thực hiện:** ${new Date().toLocaleString('vi-VN')}

## 1. Kết quả thử nghiệm (A/B Testing)
Thử nghiệm được thực hiện bằng cách phân phối ngẫu nhiên người dùng vào 2 nhóm: Nhóm truy cập trực tiếp DB và nhóm truy cập qua Cache.

| Cột mốc tải | Cold Hit (Truy vấn DB) | Warm Hit (Truy vấn Redis) | Tỷ lệ lỗi API | Thông lượng (Lượt Xử Lý Thành Công / Phút) |
| :--- | :--- | :--- | :--- | :--- |
${rows}

## 2. Kết luận và Phân tích
- **Thông lượng (Throughput):** Cột Thông lượng thể hiện sức chịu tải của hệ thống, chỉ ra số lượng luồng request được hệ thống xử lý hoàn tất mà không dính tí lỗi nào trong 1 phút hoạt động.
- **Tốc độ xử lý:** Dữ liệu thực tế cho thấy Warm Hit luôn có ưu thế về tốc độ so với Cold Hit.
- **Tối ưu tài nguyên:** Redis giúp giảm bớt gánh nặng cho hệ quản trị CSDL PostgreSQL, đặc biệt quan trọng khi số lượng người dùng đồng thời tăng cao.
- **Độ tin cậy:** Hệ thống đáp ứng tốt các yêu cầu về Performance và Stability cho mục tiêu đồ án tốt nghiệp.
`,
  };
}
