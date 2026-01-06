set -e

create_database() {
  local db_name=$1
  if psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1; then
    echo "Database [$db_name] đã tồn tại, bỏ qua."
  else
    echo "Đang tạo database [$db_name]..."
    createdb -U "$POSTGRES_USER" "$db_name"
    echo "Database [$db_name] đã được tạo."
  fi
}


create_database "team"
create_database "task"
create_database "user"
create_database "project"
create_database "notification"
create_database "call"
create_database "epic_db"
create_database "project_db"
create_database "task_db"
create_database "label_db"
create_database "list_db"
create_database "sprint_db"
create_database "video_chat_db"


echo "Đang thêm extensions..."
psql -U "$POSTGRES_USER" -d "team" -c "CREATE EXTENSION IF NOT EXISTS dblink;"
psql -U "$POSTGRES_USER" -d "task" -c "CREATE EXTENSION IF NOT EXISTS dblink;"
psql -U "$POSTGRES_USER" -d "user" -c "CREATE EXTENSION IF NOT EXISTS dblink;"
psql -U "$POSTGRES_USER" -d "notification" -c "CREATE EXTENSION IF NOT EXISTS dblink;"

echo "Hoàn tất script khởi tạo Postgres."
