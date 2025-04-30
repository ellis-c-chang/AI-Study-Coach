import json
import pytest
from datetime import datetime, timedelta
from backend.database.models import StudySession

def test_create_study_session(client, db, auth_headers):
    """Test creating a new study session"""
    # Prepare session data
    tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat()
    session_data = {
        'user_id': 1,
        'subject': 'History',
        'duration': 90,
        'scheduled_time': tomorrow
    }
    
    # Send create request
    response = client.post(
        '/study_sessions/',
        data=json.dumps(session_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 201
    assert b'Study session created successfully' in response.data
    
    # Verify session was created in database
    session = StudySession.query.filter_by(subject='History', user_id=1).first()
    assert session is not None
    assert session.duration == 90

def test_get_study_sessions(client, db, auth_headers):
    """Test retrieving study sessions for a user"""
    # Send get request
    response = client.get(
        '/study_sessions/1',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 2  # We should have at least 2 from seed data
    
    # Check data structure
    for session in data:
        assert 'id' in session
        assert 'subject' in session
        assert 'duration' in session
        assert 'scheduled_time' in session
        assert 'completed' in session

def test_complete_study_session(client, db, auth_headers):
    """Test marking a session as completed"""
    # First create a session to complete
    tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat()
    session_data = {
        'user_id': 1,
        'subject': 'Geography',
        'duration': 45,
        'scheduled_time': tomorrow
    }
    
    create_response = client.post(
        '/study_sessions/',
        data=json.dumps(session_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Get sessions to find the ID of the new session
    get_response = client.get(
        '/study_sessions/1',
        headers=auth_headers
    )
    sessions = json.loads(get_response.data)
    new_session = next((s for s in sessions if s['subject'] == 'Geography'), None)
    assert new_session is not None
    
    # Mark session as completed
    complete_response = client.put(
        f'/study_sessions/complete/{new_session["id"]}',
        headers=auth_headers
    )
    
    # Check response
    assert complete_response.status_code == 200
    assert b'Session marked as completed' in complete_response.data
    
    # Verify session is marked as completed in database
    session = StudySession.query.get(new_session['id'])
    assert session.completed is True

def test_delete_study_session(client, db, auth_headers):
    """Test deleting a study session"""
    # First create a session to delete
    tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat()
    session_data = {
        'user_id': 1,
        'subject': 'Art',
        'duration': 30,
        'scheduled_time': tomorrow
    }
    
    create_response = client.post(
        '/study_sessions/',
        data=json.dumps(session_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Get sessions to find the ID of the new session
    get_response = client.get(
        '/study_sessions/1',
        headers=auth_headers
    )
    sessions = json.loads(get_response.data)
    new_session = next((s for s in sessions if s['subject'] == 'Art'), None)
    assert new_session is not None
    
    # Delete session
    delete_response = client.delete(
        f'/study_sessions/{new_session["id"]}',
        headers=auth_headers
    )
    
    # Check response
    assert delete_response.status_code == 200
    assert b'Session deleted successfully' in delete_response.data
    
    # Verify session is deleted from database
    session = StudySession.query.get(new_session['id'])
    assert session is None

def test_update_study_session(client, db, auth_headers):
    """Test updating a study session"""
    # First create a session to update
    tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat()
    session_data = {
        'user_id': 1,
        'subject': 'Physics',
        'duration': 60,
        'scheduled_time': tomorrow
    }
    
    create_response = client.post(
        '/study_sessions/',
        data=json.dumps(session_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Get sessions to find the ID of the new session
    get_response = client.get(
        '/study_sessions/1',
        headers=auth_headers
    )
    sessions = json.loads(get_response.data)
    new_session = next((s for s in sessions if s['subject'] == 'Physics'), None)
    assert new_session is not None
    
    # Update session
    next_day = (datetime.utcnow() + timedelta(days=2)).isoformat()
    update_data = {
        'subject': 'Advanced Physics',
        'duration': 90,
        'scheduled_time': next_day
    }
    
    update_response = client.put(
        f'/study_sessions/{new_session["id"]}',
        data=json.dumps(update_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert update_response.status_code == 200
    assert b'Session updated successfully' in update_response.data
    
    # Verify session is updated in database
    session = StudySession.query.get(new_session['id'])
    assert session.subject == 'Advanced Physics'
    assert session.duration == 90