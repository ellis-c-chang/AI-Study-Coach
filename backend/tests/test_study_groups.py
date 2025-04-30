import json
import pytest
from backend.database.models import StudyGroup, GroupMembership, GroupStudySession

def test_create_group(client, db, auth_headers):
    """Test creating a new study group"""
    # Prepare group data
    group_data = {
        'name': 'Python Study Group',
        'description': 'A group for studying Python programming',
        'user_id': 1
    }
    
    # Send create request
    response = client.post(
        '/groups',
        data=json.dumps(group_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'group_id' in data
    assert 'name' in data
    assert 'description' in data
    assert 'join_code' in data
    assert data['name'] == 'Python Study Group'
    assert data['description'] == 'A group for studying Python programming'
    assert len(data['join_code']) > 0
    
    # Verify group was created in database
    group = StudyGroup.query.filter_by(name='Python Study Group').first()
    assert group is not None
    
    # Verify membership was created for the creator
    membership = GroupMembership.query.filter_by(group_id=group.id, user_id=1).first()
    assert membership is not None

def test_join_group(client, db, auth_headers):
    """Test joining a study group"""
    # First create a group
    group = StudyGroup(
        name='Join Test Group',
        description='A group for testing join functionality',
        join_code='TEST123'
    )
    db.session.add(group)
    db.session.commit()
    
    # Prepare join data
    join_data = {
        'user_id': 1,
        'join_code': 'TEST123'
    }
    
    # Send join request
    response = client.post(
        '/groups/join',
        data=json.dumps(join_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'Successfully joined' in data['message']
    assert 'group_id' in data
    
    # Verify membership was created
    membership = GroupMembership.query.filter_by(group_id=group.id, user_id=1).first()
    assert membership is not None

def test_get_my_groups(client, db, auth_headers):
    """Test retrieving groups for a user"""
    # First create and join some groups
    group1 = StudyGroup(
        name='My First Group',
        description='First test group',
        join_code='FIRST1'
    )
    group2 = StudyGroup(
        name='My Second Group',
        description='Second test group',
        join_code='SECOND2'
    )
    db.session.add(group1)
    db.session.add(group2)
    db.session.commit()
    
    membership1 = GroupMembership(group_id=group1.id, user_id=1)
    membership2 = GroupMembership(group_id=group2.id, user_id=1)
    db.session.add(membership1)
    db.session.add(membership2)
    db.session.commit()
    
    # Send get request
    response = client.get(
        '/groups/my?user_id=1',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 2  # Should have at least the two groups we just created
    
    # Check data structure
    for group in data:
        assert 'group_id' in group
        assert 'name' in group
        assert 'description' in group
        assert 'join_code' in group
    
    # Verify our test groups are in the response
    group_names = [g['name'] for g in data]
    assert 'My First Group' in group_names
    assert 'My Second Group' in group_names

def test_get_group_members(client, db, auth_headers):
    """Test retrieving members of a group"""
    # First create a group and add members
    group = StudyGroup(
        name='Members Test Group',
        description='A group for testing members functionality',
        join_code='MEMBER1'
    )
    db.session.add(group)
    db.session.commit()
    
    membership = GroupMembership(group_id=group.id, user_id=1)
    db.session.add(membership)
    db.session.commit()
    
    # Send get request
    response = client.get(
        f'/groups/{group.id}/members',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 1  # Should have at least one member (our test user)
    
    # Check data structure
    member = data[0]
    assert 'user_id' in member
    assert 'username' in member
    assert 'email' in member
    assert member['user_id'] == 1
    assert member['username'] == 'testuser'

def test_leave_group(client, db, auth_headers):
    """Test leaving a study group"""
    # First create a group and join it
    group = StudyGroup(
        name='Leave Test Group',
        description='A group for testing leave functionality',
        join_code='LEAVE1'
    )
    db.session.add(group)
    db.session.commit()
    
    membership = GroupMembership(group_id=group.id, user_id=1)
    db.session.add(membership)
    db.session.commit()
    
    # Prepare leave data
    leave_data = {
        'user_id': 1,
        'group_id': group.id
    }
    
    # Send leave request
    response = client.post(
        '/groups/leave',
        data=json.dumps(leave_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'Successfully left' in data['message']
    
    # Verify membership was removed
    membership = GroupMembership.query.filter_by(group_id=group.id, user_id=1).first()
    assert membership is None

def test_add_group_session(client, db, auth_headers):
    """Test adding a study session to a group"""
    # First create a group
    group = StudyGroup(
        name='Session Test Group',
        description='A group for testing session functionality',
        join_code='SESSION1'
    )
    db.session.add(group)
    db.session.commit()
    
    # Add members to the group
    membership = GroupMembership(group_id=group.id, user_id=1)
    db.session.add(membership)
    db.session.commit()
    
    # Prepare session data
    from datetime import datetime, timedelta
    scheduled_time = (datetime.utcnow() + timedelta(days=1)).isoformat()
    session_data = {
        'subject': 'Group Python Study',
        'scheduled_time': scheduled_time,
        'duration': 90
    }
    
    # Send add session request
    response = client.post(
        f'/groups/{group.id}/sessions',
        data=json.dumps(session_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'message' in data
    assert 'added and synced' in data['message']
    
    # Verify group session was created
    group_session = GroupStudySession.query.filter_by(group_id=group.id).first()
    assert group_session is not None
    assert group_session.subject == 'Group Python Study'
    assert group_session.duration == 90
    
    # Verify personal sessions were created for all members
    from backend.database.models import StudySession
    personal_session = StudySession.query.filter_by(
        user_id=1,
        subject='Group Python Study'
    ).first()
    assert personal_session is not None
    assert personal_session.duration == 90

def test_get_group_sessions(client, db, auth_headers):
    """Test retrieving study sessions for a group"""
    # First create a group with sessions
    group = StudyGroup(
        name='Get Sessions Test Group',
        description='A group for testing get sessions functionality',
        join_code='GETSESSION1'
    )
    db.session.add(group)
    db.session.commit()
    
    # Add sessions to the group
    from datetime import datetime, timedelta
    session1 = GroupStudySession(
        group_id=group.id,
        subject='Session Topic 1',
        scheduled_time=datetime.utcnow() + timedelta(days=1),
        duration=60
    )
    session2 = GroupStudySession(
        group_id=group.id,
        subject='Session Topic 2',
        scheduled_time=datetime.utcnow() + timedelta(days=2),
        duration=90
    )
    db.session.add(session1)
    db.session.add(session2)
    db.session.commit()
    
    # Send get request
    response = client.get(
        f'/groups/{group.id}/sessions',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 2  # Should have at least the two sessions we just created
    
    # Check data structure
    for session in data:
        assert 'id' in session
        assert 'subject' in session
        assert 'scheduled_time' in session
        assert 'duration' in session
    
    # Verify our test sessions are in the response
    session_subjects = [s['subject'] for s in data]
    assert 'Session Topic 1' in session_subjects
    assert 'Session Topic 2' in session_subjects