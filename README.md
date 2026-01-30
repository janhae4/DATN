Set up webhook minio

1. mc alias set myminio http://localhost:9000 minioadmin minioadmin

2. mc admin config set myminio notify_webhook:PRIMARY enable=on endpoint="http://host.docker.internal:3000/webhooks/upload-completed"

2. mc admin config set myminio notify_webhook:PRIMARY enable=on endpoint="http://api-gateway:3000/webhooks/upload-completed"


3. mc admin service restart myminio

4. mc event add myminio/documents arn:minio:sqs::PRIMARY:webhook --event put



