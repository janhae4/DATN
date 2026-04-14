async function seedUsers() {
  const numUsers = 50;
  console.log(`Bắt đầu seed ${numUsers} users...`);

  for (let i = 1; i <= numUsers; i++) {
    const user = {
      username: `user_test_${i}`,
      email: `user_test_${i}@datn.com`,
      password: 'mypassword123',
      name: `Test User ${i}`,
      phone: `0900000${i.toString().padStart(3, '0')}`
    };

    try {
        const res = await fetch('http://localhost:3000/auth/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        
        if (res.ok) {
            console.log(`Đã tạo thành công: ${user.username}`);
        } else {
            const data = await res.json();
            if (data.message === 'This email is already in use' || data.message === 'This username is already in use') {
               console.log(`${user.username} đã tồn tại, bỏ qua.`);
            } else {
               console.error(`Lỗi khi tạo ${user.username}:`, data);
            }
        }
    } catch (e) {
        console.error(`Không thể kết nối đến server. Server đã chạy chưa?`, e.message);
        break;
    }
  }
  
  console.log('Hoàn tất!');
}

seedUsers();
