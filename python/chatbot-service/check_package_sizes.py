import os
from importlib.metadata import distributions

def check_all_sizes():
    size_list = []
    
    # Lấy tất cả các gói đã cài đặt
    for dist in distributions():
        name = dist.metadata['Name']
        size = 0
        
        # importlib.metadata cho phép truy cập danh sách files của gói (nếu có)
        if dist.files:
            for file_path in dist.files:
                try:
                    # locate() trả về đường dẫn tuyệt đối của file
                    abs_path = file_path.locate()
                    if os.path.exists(abs_path):
                        size += os.path.getsize(abs_path)
                except Exception:
                    continue
        
        if size > 0:
            size_list.append((name, size))

    # Sắp xếp theo dung lượng giảm dần
    size_list.sort(key=lambda x: x[1], reverse=True)
    
    print(f"{'Package':<30} | {'Size (MB)':<10}")
    print("-" * 45)
    for name, size in size_list[:20]:
        print(f"{name:<30} | {size / (1024*1024):>10.2f}")

if __name__ == "__main__":
    check_all_sizes()