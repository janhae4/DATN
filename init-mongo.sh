#!/bin/bash

echo "Script khởi tạo bắt đầu..."

until mongosh --host mongo_db --port 27017 --eval 'print("MongoDB ready")'; do
  echo "Đang chờ MongoDB khởi động..."
  sleep 2
done

echo "MongoDB đã sẵn sàng! Đang cấu hình Replica Set..."

mongosh --host mongo_db --port 27017 <<EOF
var config = {
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo_db:27017" }
  ]
};

try {
  var status = rs.status();
  print('Replica set đã tồn tại:');
  printjson(status.members);
} catch (e) {
  if (e.codeName === 'NotYetInitialized' || e.message.includes('No replica set')) {
    print('Đang khởi tạo Replica Set...');
    var init = rs.initiate(config);
    printjson(init);
  } else {
    print('Lỗi khác: ' + e.message);
  }
}
EOF

echo "Script hoàn tất."