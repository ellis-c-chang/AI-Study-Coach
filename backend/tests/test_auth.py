import json
import pytest
from backend.database.models import User

def test_register_user(client, db):
    """Test user registration"""
    # Prepare test data
    user_data = {
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'password123'
    }
    
    # Send registration request
    response = client.post(
        '/auth/register',
        data=json.dumps(user_data),
        content_type='application/json'
    )
    
    # Check response
    assert response.status_code == 201
    assert b'User registered successfully' in response.data
    
    # Verify user was created in database
    user = User.query.filter_by(email='newuser@example.com').first()
    assert user is not None
    assert user.username == 'newuser'

def test_register_duplicate_user(client, db):
    """Test registration with duplicate email fails"""
    # First create a user
    user_data = {
        'username': 'duplicate',
        'email': 'duplicate@example.com',
        'password': 'password123'
    }
    
    client.post(
        '/auth/register',
        data=json.dumps(user_data),
        content_type='application/json'
    )
    
    # Try to register again with same email
    response = client.post(
        '/auth/register',
        data=json.dumps(user_data),
        content_type='application/json'
    )
    
    # Check response indicates conflict
    assert response.status_code == 409
    assert b'already exists' in response.data

def test_login_success(client, db):
    """Test successful login"""
    # Prepare login data for test user
    login_data = {
        'email': 'test@example.com',
        'password': 'password123'
    }
    
    # Send login request
    response = client.post(
        '/auth/login',
        data=json.dumps(login_data),
        content_type='application/json'
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data
    assert data['username'] == 'testuser'

def test_login_invalid_credentials(client, db):
    """Test login with invalid credentials"""
    # Prepare login data with wrong password
    login_data = {
        'email': 'test@example.com',
        'password': 'wrongpassword'
    }
    
    # Send login request
    response = client.post(
        '/auth/login',
        data=json.dumps(login_data),
        content_type='application/json'
    )
    
    # Check response
    assert response.status_code == 401
    assert b'Invalid email or password' in response.data

def test_login_missing_fields(client, db):
    """Test login with missing fields"""
    # Prepare incomplete login data
    login_data = {
        'email': 'test@example.com'
        # Missing password
    }
    
    # Send login request
    response = client.post(
        '/auth/login',
        data=json.dumps(login_data),
        content_type='application/json'
    )
    
    # Check response
    assert response.status_code == 400
    assert b'Missing email or password' in response.data

def test_token_required_decorator(client, db, auth_headers):
    """Test the token_required decorator works"""
    # Test endpoint that requires authentication
    # Using study_sessions endpoint which should require auth
    
    # Request without auth headers
    response_without_auth = client.get('/study_sessions/1')
    assert response_without_auth.status_code == 401
    
    # Request with auth headers
    response_with_auth = client.get('/study_sessions/1', headers=auth_headers)
    assert response_with_auth.status_code == 200