from flask import Blueprint, request, jsonify
from backend.database.models import StudySession, db
from backend.utils.error_handler import handle_error
from datetime import datetime

sessions_bp = Blueprint('study_sessions', __name__)

# Create a new study session
@sessions_bp.route('/', methods=['POST'])
def create_study_session():
    try:
        data = request.get_json()
        scheduled_time=datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
        new_session = StudySession(
            user_id=data['user_id'],
            subject=data['subject'],
            duration=data['duration'],
            scheduled_time=scheduled_time,
            start_time=datetime.utcnow()
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
                'scheduled_time': session.scheduled_time.isoformat() if session.scheduled_time else None,
                'start_time': session.start_time.isoformat() if session.start_time else None,
                'completed': session.completed
            }
            for session in sessions
        ]
        return jsonify(session_data), 200
    except Exception as e:
        print(f"Retrieving Sessions Error: {str(e)}")
        return handle_error('Failed to retrieve study sessions', 500)

# Mark session as completed
@sessions_bp.route('/complete/<int:session_id>', methods=['PUT'])
def complete_study_session(session_id):
    try:
        session = StudySession.query.get(session_id)
        if not session:
            return handle_error('Session not found'), 404

        session.completed = True
        db.session.commit()
        return jsonify({'message': 'Session marked as completed'}), 200
    except Exception as e:
        print(f"Complete Session Error: {str(e)}")
        return handle_error('Failed to update session'), 500
