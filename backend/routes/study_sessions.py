from flask import Blueprint, request, jsonify
from backend.database.models import StudySession, db
from backend.utils.error_handler import handle_error
from datetime import datetime, timedelta


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

# Delete a study session
@sessions_bp.route('/<int:session_id>', methods=['DELETE'])
def delete_study_session(session_id):
    try:
        session = StudySession.query.get(session_id)
        if not session:
            return handle_error('Session not found', 404)
        
        db.session.delete(session)
        db.session.commit()
        return jsonify({'message': 'Session deleted successfully'}), 200
    except Exception as e:
        print(f"Delete Session Error: {str(e)}")
        return handle_error('Failed to delete session', 500)

from datetime import datetime, timedelta

# Create a missed session manually for testing
@sessions_bp.route('/test/create_missed_session/<int:user_id>', methods=['POST'])
def create_missed_session(user_id):
    try:
        yesterday = datetime.utcnow() - timedelta(days=1)
        new_session = StudySession(
            user_id=user_id,
            subject="Test Missed Session",
            duration=60,  # 1 hour
            scheduled_time=yesterday,
            start_time=yesterday,
            completed=False
        )
        db.session.add(new_session)
        db.session.commit()
        return jsonify({'message': 'Missed session created successfully', 'session_id': new_session.id}), 201
    except Exception as e:
        print(f"Create Missed Session Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Update (reschedule/edit) a study session
@sessions_bp.route('/<int:session_id>', methods=['PUT'])
def update_study_session(session_id):
    try:
        data = request.get_json()
        session = StudySession.query.get(session_id)
        if not session:
            return handle_error('Session not found', 404)

        session.subject = data['subject']
        session.duration = data['duration']
        session.scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))

        db.session.commit()
        return jsonify({'message': 'Session updated successfully'}), 200
    except Exception as e:
        print(f"Update Session Error: {str(e)}")
        return handle_error('Failed to update session', 500)

# Redo (mark a study session as incomplete)
@sessions_bp.route('/redo/<int:session_id>', methods=['PUT'])
def redo_study_session(session_id):
    try:
        session = StudySession.query.get(session_id)
        if not session:
            return handle_error('Session not found', 404)

        session.completed = False
        db.session.commit()
        return jsonify({'message': 'Session marked as incomplete'}), 200
    except Exception as e:
        print(f"Redo Session Error: {str(e)}")
        return handle_error('Failed to redo session', 500)
