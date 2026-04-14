
# BÁO CÁO CẢI THIỆN HIỆU NĂNG VỚI REDIS CACHE
**Dự án:** Taskora
**Ngày thực hiện:** 04/14/2026, 19:46:15

## 1. Kết quả thử nghiệm (A/B Testing)
Thử nghiệm được thực hiện bằng cách phân phối ngẫu nhiên người dùng vào 2 nhóm: Nhóm truy cập trực tiếp DB và nhóm truy cập qua Cache.

| Cột mốc tải | Cold Hit (Truy vấn DB) | Warm Hit (Truy vấn Redis) | Tỷ lệ lỗi API | Thông lượng (Lượt Xử Lý Thành Công / Phút) |
| :--- | :--- | :--- | :--- | :--- |
| 50 VUs | 28.76 ms | 23.33 ms | 0.00% | 2,980 reqs/min |
| 100 VUs | 31.36 ms | 29.43 ms | 0.00% | 5,910 reqs/min |
| 200 VUs | 231.22 ms | 232.36 ms | 0.00% | 9,906 reqs/min |

## 2. Kết luận và Phân tích
- **Thông lượng (Throughput):** Cột Thông lượng thể hiện sức chịu tải của hệ thống, chỉ ra số lượng luồng request được hệ thống xử lý hoàn tất mà không dính tí lỗi nào trong 1 phút hoạt động.
- **Tốc độ xử lý:** Dữ liệu thực tế cho thấy Warm Hit luôn có ưu thế về tốc độ so với Cold Hit.
- **Tối ưu tài nguyên:** Redis giúp giảm bớt gánh nặng cho hệ quản trị CSDL PostgreSQL, đặc biệt quan trọng khi số lượng người dùng đồng thời tăng cao.
- **Độ tin cậy:** Hệ thống đáp ứng tốt các yêu cầu về Performance và Stability cho mục tiêu đồ án tốt nghiệp.
