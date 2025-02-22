from flask import Blueprint, request, jsonify
from backend.database.models import StudySession, db

sessions_bp = Blueprint('study_sessions', __name__)

# Create a new study session
@sessions_bp.route('/', methods=['POST'])
def create_study_session():
    try:
        data = request.get_json()
        new_session = StudySession(
            user_id=data['user_id'],
            subject=data['subject'],
            duration=data['duration']
        )
        db.session.add(new_session)
        db.session.commit()
        return jsonify({'message': 'Study session created successfully'}), 201
    except Exception as e:
        print(f"Study Session Error: {str(e)}")
        return handle_error('Failed to create study session', 500)

# Retrieve study sessions for a specific user
@sessions_bp.route('/<int:user_id>', methods=['GET'])
def get_study_sessions(user_id):
    try:
        sessions = StudySession.query.filter_by(user_id=user_id).all()
        session_data = [
            {
                'id': session.id,
                'subject': session.subject,
                'duration': session.duration,
                'start_time': session.start_time.isoformat(),
            }
            for session in sessions
        ]
        return jsonify(session_data), 200
    except Exception as e:
        print(f"Retrieving Sessions Error: {str(e)}")
        return handle_error('Failed to retrieve study sessions', 500)
