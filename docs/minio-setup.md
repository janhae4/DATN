# MinIO Webhook Setup

Follow these steps to set up the MinIO webhook for the project:

1.  **Set Alias**:
    ```bash
    mc alias set myminio http://localhost:9000 minioadmin minioadmin
    ```

2.  **Configure Webhook**:
    - For local development:
      ```bash
      mc admin config set myminio notify_webhook:PRIMARY enable=on endpoint="http://host.docker.internal:3000/webhooks/upload-completed"
      ```
    - For Docker environment:
      ```bash
      mc admin config set myminio notify_webhook:PRIMARY enable=on endpoint="http://api-gateway:3000/webhooks/upload-completed"
      ```

3.  **Restart MinIO**:
    ```bash
    mc admin service restart myminio
    ```

4.  **Add Event**:
    ```bash
    mc event add myminio/documents arn:minio:sqs::PRIMARY:webhook --event put
    ```
