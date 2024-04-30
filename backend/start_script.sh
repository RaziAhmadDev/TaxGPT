
BASE_URL="http://localhost:8080"

EMAIL="test@example.com"
PASSWORD="testpassword"
NAME="Test User"

delete_users() {
    # Assuming you have an endpoint to delete all users
    curl -X DELETE "$BASE_URL/api/delete_all_users"
}

create_test_user() {
    curl -X POST "$BASE_URL/api/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'"$EMAIL"'",
            "password": "'"$PASSWORD"'",
            "name": "'"$NAME"'"
        }'
}

delete_users
create_test_user
