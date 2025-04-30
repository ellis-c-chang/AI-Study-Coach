import json
import pytest
from backend.database.models import UserProfile

def test_create_profile(client, db, auth_headers):
    """Test creating a user profile"""
    # Prepare profile data
    profile_data = {
        'user_id': 1,
        'study_style': 'Visual',
        'preferred_study_time': 'morning',
        'grade_level': 'undergraduate',
        'subjects': ['Mathematics', 'Computer Science'],
        'goals': 'Improve my grades and study more consistently',
        'quiz_responses': {
            'environment': 'Quiet room',
            'learning_preference': 'Reading',
            'time_management': 'I plan everything in advance',
            'note_taking': 'Digital/typed notes',
            'review_method': 'Practice tests'
        }
    }
    
    # Send create request
    response = client.post(
        '/onboarding/profile',
        data=json.dumps(profile_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'message' in data
    assert 'profile_id' in data
    
    # Verify profile was created in database
    profile = UserProfile.query.filter_by(user_id=1).first()
    assert profile is not None
    assert profile.study_style == 'Visual'
    assert profile.preferred_study_time == 'morning'
    assert profile.grade_level == 'undergraduate'
    assert 'Mathematics' in profile.get_subjects()
    assert 'Computer Science' in profile.get_subjects()
    assert profile.goals == 'Improve my grades and study more consistently'
    
    # Check quiz responses
    quiz_responses = profile.get_quiz_responses()
    assert quiz_responses['environment'] == 'Quiet room'
    assert quiz_responses['learning_preference'] == 'Reading'

def test_get_profile(client, db, auth_headers):
    """Test retrieving a user profile"""
    # First ensure we have a profile
    test_create_profile(client, db, auth_headers)
    
    # Now test retrieving it
    response = client.get(
        '/onboarding/profile/1',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check data structure
    assert 'id' in data
    assert 'user_id' in data
    assert 'study_style' in data
    assert 'preferred_study_time' in data
    assert 'grade_level' in data
    assert 'subjects' in data
    assert 'goals' in data
    assert 'quiz_responses' in data
    assert 'created_at' in data
    assert 'updated_at' in data
    
    # Check content
    assert data['user_id'] == 1
    assert data['study_style'] == 'Visual'
    assert data['preferred_study_time'] == 'morning'
    assert data['grade_level'] == 'undergraduate'
    assert 'Mathematics' in data['subjects']
    assert 'Computer Science' in data['subjects']
    assert data['goals'] == 'Improve my grades and study more consistently'
    assert data['quiz_responses']['environment'] == 'Quiet room'

def test_update_profile(client, db, auth_headers):
    """Test updating a user profile"""
    # First ensure we have a profile
    test_create_profile(client, db, auth_headers)
    
    # Prepare update data
    update_data = {
        'study_style': 'Structured',
        'preferred_study_time': 'evening',
        'subjects': ['History', 'English'],
        'goals': 'Graduate with honors and prepare for grad school'
    }
    
    # Send update request
    response = client.put(
        '/onboarding/profile/1',
        data=json.dumps(update_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert data['message'] == 'Profile updated successfully'
    
    # Verify profile was updated in database
    profile = UserProfile.query.filter_by(user_id=1).first()
    assert profile is not None
    assert profile.study_style == 'Structured'
    assert profile.preferred_study_time == 'evening'
    assert 'History' in profile.get_subjects()
    assert 'English' in profile.get_subjects()
    assert 'Computer Science' not in profile.get_subjects()  # Should be replaced
    assert profile.goals == 'Graduate with honors and prepare for grad school'

def test_get_nonexistent_profile(client, db, auth_headers):
    """Test retrieving a profile that doesn't exist"""
    # Ensure no profile exists for user ID 999
    profile = UserProfile.query.filter_by(user_id=999).first()
    if profile:
        db.session.delete(profile)
        db.session.commit()
    
    # Try to retrieve nonexistent profile
    response = client.get(
        '/onboarding/profile/999',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not found' in data['error']

def test_create_duplicate_profile(client, db, auth_headers):
    """Test creating a profile for a user that already has one"""
    # First ensure we have a profile
    test_create_profile(client, db, auth_headers)
    
    # Prepare new profile data
    profile_data = {
        'user_id': 1,
        'study_style': 'Social',
        'preferred_study_time': 'afternoon',
        'grade_level': 'high_school',
        'subjects': ['Science'],
        'goals': 'New goals'
    }
    
    # Try to create another profile
    response = client.post(
        '/onboarding/profile',
        data=json.dumps(profile_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response indicates conflict
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'error' in data
    assert 'already exists' in data['error']