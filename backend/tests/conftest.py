import os
import pytest
import tempfile
from backend.app import create_app
from backend.database import db as _db
from backend.database.models import User, StudySession, Task, Achievement
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import jwt

@pytest.fixture(scope='session')
def app():
    """Create a Flask app configured for testing"""
    # Use an in-memory SQLite database for testing
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test_secret_key',
        'JWT_SECRET_KEY': 'test_jwt_secret',
    })

    # Create application context
    with app.app_context():
        # Create all tables
        _db.create_all()
        
        # Seed test data
        seed_test_data(_db)
        
        yield app
        
        # Clean up
        _db.session.remove()
        _db.drop_all()

@pytest.fixture(scope='function')
def db(app):
    """Return database instance within a transaction"""
    with app.app_context():
        connection = _db.engine.connect()
        transaction = connection.begin()
        
        # Create a session bound to the connection
        options = dict(bind=connection, binds={})
        session = _db.create_scoped_session(options=options)
        
        # Replace the session with our test session
        _db.session = session
        
        yield _db
        
        # Roll back the transaction
        transaction.rollback()
        connection.close()
        session.remove()

@pytest.fixture(scope='function')
def client(app):
    """Return a test client for the Flask app"""
    with app.test_client() as client:
        yield client

@pytest.fixture(scope='function')
def auth_headers(app):
    """Return authentication headers for API testing"""
    test_user_id = 1  # Assuming the seed data creates a user with ID 1
    
    # Create a JWT token for the test user
    payload = {
        'user_id': test_user_id,
        'username': 'testuser',
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    # Return headers with the token
    return {'Authorization': f'Bearer {token}'}

def seed_test_data(db):
    """Seed the database with test data"""
    # Create test user
    test_user = User(
        username='testuser',
        email='test@example.com',
        password=generate_password_hash('password123', method='pbkdf2:sha256')
    )
    db.session.add(test_user)
    db.session.commit()
    
    # Create test study sessions
    now = datetime.utcnow()
    test_sessions = [
        StudySession(
            user_id=test_user.id,
            subject='Math',
            duration=60,
            scheduled_time=now + timedelta(days=1),
            completed=False
        ),
        StudySession(
            user_id=test_user.id,
            subject='Science',
            duration=45,
            scheduled_time=now - timedelta(days=1),
            completed=True
        )
    ]
    db.session.add_all(test_sessions)
    
    # Create test tasks
    test_tasks = [
        Task(
            user_id=test_user.id,
            title='Complete math homework',
            status='todo'
        ),
        Task(
            user_id=test_user.id,
            title='Read science chapter',
            status='inProgress'
        ),
        Task(
            user_id=test_user.id,
            title='Submit essay',
            status='done'
        )
    ]
    db.session.add_all(test_tasks)
    
    # Create test achievements
    test_achievements = [
        Achievement(
            name='First Steps',
            description='Complete your first study session',
            badge_image='badges/first_steps.png',
            points=10
        ),
        Achievement(
            name='Study Streak',
            description='Complete study sessions for 3 days in a row',
            badge_image='badges/streak.png',
            points=30
        )
    ]
    db.session.add_all(test_achievements)
    
    db.session.commit()