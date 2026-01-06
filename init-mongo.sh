echo "Script khởi tạo bắt đầu... Sẽ chờ 10 giây cho MongoDB khởi động."
sleep 10

echo "Đang thử kết nối tới mongosh (host: mongo_db, port: 27017)..."

mongosh --host mongo_db --port 27017 <<EOF
var config = {
  _id: "rs0",
  members: [
    // *** SỬA: 'host' phải là tên service/container của bạn ***
    { _id: 0, host: "mongo_db:27017" } 
  ]
};

try {
  // Kiểm tra xem replica set đã có trạng thái chưa
  var status = rs.status();
  print('Replica set đã được khởi tạo.');
  printjson(status.members);
} catch (e) {
  // Nếu chưa, 'rs.status()' sẽ ném lỗi.
  if (e.codeName === 'NotYetInitialized' || e.message.includes('No replica set')) {
    print('Replica set chưa được khởi tạo. Đang chạy rs.initiate()...');
    var initStatus = rs.initiate(config);
    printjson(initStatus);
  } else {
    print('Lỗi không xác định khi kiểm tra rs.status():');
    printjson(e);
  }
}
EOF

echo "Script khởi tạo hoàn tất."

