from flask import Blueprint, request, jsonify
from backend.database.models import User, db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from backend.utils.error_handler import handle_error

auth_bp = Blueprint('auth', __name__)

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

        return jsonify({'message': 'User registered successfully!'}), 201

    except IntegrityError:
        db.session.rollback()
        return handle_error('User with this email or username already exists.', 409)
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jhandle_error('An error occurred during registration.', 500)
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data.get('email') or not data.get('password'):
            return handle_error('Missing email or password', 400)

        user = User.query.filter_by(email=data['email']).first()

        if user and check_password_hash(user.password, data['password']):
            return jsonify({
                'message': 'Login successful!',
                'user_id': user.id,
                'username': user.username
            }), 200
        else:
            return handle_error('Invalid email or password', 401)

    except Exception as e:
        print(f"Login error: {str(e)}")
        return handle_error('An error occurred during login', 500)

