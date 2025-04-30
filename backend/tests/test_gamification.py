import json
import pytest
from backend.database.models import Achievement, UserAchievement, UserPoints, PointTransaction

def test_get_all_achievements(client, db, auth_headers):
    """Test retrieving all achievements"""
    response = client.get(
        '/gamification/achievements',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 2  # We should have at least 2 from seed data
    
    # Check data structure
    for achievement in data:
        assert 'id' in achievement
        assert 'name' in achievement
        assert 'description' in achievement
        assert 'points' in achievement
        assert 'badge_image' in achievement

def test_get_user_achievements(client, db, auth_headers):
    """Test retrieving user achievements"""
    # First we need to award an achievement to the user
    # Let's use the 'First Steps' achievement which should exist in seed data
    first_steps = Achievement.query.filter_by(name='First Steps').first()
    assert first_steps is not None
    
    # Create user achievement
    user_achievement = UserAchievement(
        user_id=1,
        achievement_id=first_steps.id
    )
    db.session.add(user_achievement)
    db.session.commit()
    
    # Now test the endpoint
    response = client.get(
        '/gamification/user/1/achievements',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 1
    
    # Check data structure
    achievement = data[0]
    assert 'id' in achievement
    assert 'name' in achievement
    assert 'description' in achievement
    assert 'points' in achievement
    assert 'badge_image' in achievement
    assert 'earned_at' in achievement
    assert achievement['name'] == 'First Steps'

def test_get_user_points(client, db, auth_headers):
    """Test retrieving user points"""
    # First ensure the user has points
    user_points = UserPoints.query.filter_by(user_id=1).first()
    if not user_points:
        user_points = UserPoints(user_id=1, total_points=50, level=1)
        db.session.add(user_points)
        db.session.commit()
    
    # Now test the endpoint
    response = client.get(
        '/gamification/user/1/points',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check data structure
    assert 'user_id' in data
    assert 'total_points' in data
    assert 'level' in data
    assert 'next_level_points' in data
    assert 'progress' in data
    assert data['user_id'] == 1

def test_get_point_transactions(client, db, auth_headers):
    """Test retrieving point transactions"""
    # First ensure the user has some transactions
    transaction = PointTransaction(
        user_id=1,
        amount=10,
        reason='Test transaction'
    )
    db.session.add(transaction)
    db.session.commit()
    
    # Now test the endpoint
    response = client.get(
        '/gamification/user/1/transactions',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 1
    
    # Check data structure
    tx = data[0]
    assert 'id' in tx
    assert 'amount' in tx
    assert 'reason' in tx
    assert 'created_at' in tx

def test_check_achievements(client, db, auth_headers):
    """Test the achievement checking endpoint"""
    response = client.post(
        '/gamification/check-achievements/1',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'achievements' in data
    assert isinstance(data['achievements'], list)

def test_award_session_points(client, db, auth_headers):
    """Test awarding points for completing a study session"""
    # First create a study session to award points for
    from backend.database.models import StudySession
    from datetime import datetime, timedelta
    
    session = StudySession(
        user_id=1,
        subject='Biology',
        duration=60,
        scheduled_time=datetime.utcnow() - timedelta(hours=1),
        completed=True
    )
    db.session.add(session)
    db.session.commit()
    
    # Get user points before
    points_before = UserPoints.query.filter_by(user_id=1).first()
    if not points_before:
        points_before = UserPoints(user_id=1, total_points=0, level=1)
        db.session.add(points_before)
        db.session.commit()
    
    total_before = points_before.total_points
    
    # Now test the endpoint
    response = client.post(
        f'/gamification/award-session-points/{session.id}',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'points_awarded' in data
    assert 'new_achievements' in data
    assert isinstance(data['new_achievements'], list)
    
    # Check that points were actually awarded
    points_after = UserPoints.query.filter_by(user_id=1).first()
    assert points_after.total_points > total_before

def test_get_leaderboard(client, db, auth_headers):
    """Test retrieving the leaderboard"""
    response = client.get(
        '/gamification/leaderboard',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    
    # Check data structure
    if data:  # If leaderboard has entries
        entry = data[0]
        assert 'user_id' in entry
        assert 'username' in entry
        assert 'total_points' in entry
        assert 'level' in entry