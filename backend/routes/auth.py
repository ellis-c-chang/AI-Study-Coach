# backend/routes/auth.py - Add JWT functionality
from flask import Blueprint, request, jsonify, make_response
from backend.database.models import User, db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from backend.utils.error_handler import handle_error
import jwt
import datetime
import os

auth_bp = Blueprint('auth', __name__)

# Get JWT secret from environment or config
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'default_secret_key')
JWT_EXPIRATION = 24 * 60 * 60  # 24 hours in seconds

@auth_bp.route('/register', methods=['OPTIONS'])
@auth_bp.route('/login', methods=['OPTIONS'])
def auth_options():
    response = make_response()
    return response

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return handle_error('Missing required fields', 400)

        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        new_user = User(username=data['username'], email=data['email'], password=hashed_password)

        db.session.add(new_user)
        db.session.commit()

        response = jsonify({'message': 'User registered successfully!'})
        response.headers.add('Access-Control-Allow-Origin', 'https://ai-study-coach.vercel.app')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 201

    except IntegrityError:
        db.session.rollback()
        return handle_error('User with this email or username already exists.', 409)
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return handle_error('An error occurred during registration.', 500)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data.get('email') or not data.get('password'):
            return handle_error('Missing email or password', 400)

        user = User.query.filter_by(email=data['email']).first()

        if user and check_password_hash(user.password, data['password']):
            # Generate JWT token
            payload = {
                'user_id': user.id,
                'username': user.username,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXPIRATION)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
            
            return jsonify({
                'message': 'Login successful!',
                'user_id': user.id,
                'username': user.username,
                'token': token
            }), 200
        else:
            return handle_error('Invalid email or password', 401)

    except Exception as e:
        print(f"Login error: {str(e)}")
        return handle_error('An error occurred during login', 500)

# Authentication middleware - to be used with other routes
def token_required(f):
    from functools import wraps
    
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        if not token:
            return handle_error('Token is missing', 401)
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
            # You can attach the user to the request here if needed
            # g.user = User.query.get(user_id)
        except jwt.ExpiredSignatureError:
            return handle_error('Token has expired', 401)
        except jwt.InvalidTokenError:
            return handle_error('Invalid token', 401)
            
        return f(*args, **kwargs)
    
    return decorated
