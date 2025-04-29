# backend/routes/gamification.py
from flask import Blueprint, request, jsonify
from backend.database.models import (
    User, Achievement, UserAchievement, UserPoints, 
    PointTransaction, StudySession, db
)
from backend.utils.error_handler import handle_error
from backend.routes.auth import token_required
from datetime import datetime, timedelta
from sqlalchemy import func

gamification_bp = Blueprint('gamification', __name__)

# Initialize default achievements
def initialize_achievements():
    default_achievements = [
        {
            'name': 'First Steps',
            'description': 'Complete your first study session',
            'points': 10,
            'badge_image': 'badges/first_steps.png'
        },
        {
            'name': 'Study Streak',
            'description': 'Complete study sessions for 3 days in a row',
            'points': 30,
            'badge_image': 'badges/streak.png'
        },
        {
            'name': 'Focus Master',
            'description': 'Complete 5 study sessions in a single day',
            'points': 50,
            'badge_image': 'badges/focus.png'
        },
        {
            'name': 'Subject Expert',
            'description': 'Complete 10 sessions in a single subject',
            'points': 100,
            'badge_image': 'badges/expert.png'
        },
        {
            'name': 'Time Wizard',
            'description': 'Accumulate 24 hours of total study time',
            'points': 150,
            'badge_image': 'badges/time.png'
        }
    ]
    
    existing_achievements = Achievement.query.all()
    if not existing_achievements:
        for ach in default_achievements:
            achievement = Achievement(
                name=ach['name'],
                description=ach['description'],
                points=ach['points'],
                badge_image=ach['badge_image']
            )
            db.session.add(achievement)
        
        db.session.commit()
        print("Default achievements created")

# Helper function to check and award achievements
def check_achievements(user_id):
    # Get user's completed study sessions
    completed_sessions = StudySession.query.filter_by(
        user_id=user_id, 
        completed=True
    ).all()
    
    awarded = []
    
    # Check for "First Steps" achievement
    if len(completed_sessions) > 0:
        first_steps = Achievement.query.filter_by(name='First Steps').first()
        if first_steps:
            existing = UserAchievement.query.filter_by(
                user_id=user_id, 
                achievement_id=first_steps.id
            ).first()
            
            if not existing:
                award_achievement(user_id, first_steps.id)
                awarded.append(first_steps)
    
    # Check for "Study Streak" achievement
    if len(completed_sessions) >= 3:
        # Group sessions by day
        days_with_sessions = set()
        for session in completed_sessions:
            days_with_sessions.add(session.scheduled_time.date())
        
        # Sort days
        sorted_days = sorted(list(days_with_sessions))
        
        # Check for streak of 3 consecutive days
        for i in range(len(sorted_days) - 2):
            if (sorted_days[i+1] - sorted_days[i]).days == 1 and \
               (sorted_days[i+2] - sorted_days[i+1]).days == 1:
                streak = Achievement.query.filter_by(name='Study Streak').first()
                if streak:
                    existing = UserAchievement.query.filter_by(
                        user_id=user_id, 
                        achievement_id=streak.id
                    ).first()
                    
                    if not existing:
                        award_achievement(user_id, streak.id)
                        awarded.append(streak)
                break
    
    # Check for "Focus Master" achievement
    if len(completed_sessions) >= 5:
        # Group sessions by day
        sessions_by_day = {}
        for session in completed_sessions:
            day = session.scheduled_time.date()
            if day not in sessions_by_day:
                sessions_by_day[day] = []
            sessions_by_day[day].append(session)
        
        # Find day with most sessions
        max_sessions_in_day = max([len(sessions) for _, sessions in sessions_by_day.items()])
        
        if max_sessions_in_day >= 5:
            focus = Achievement.query.filter_by(name='Focus Master').first()
            if focus:
                existing = UserAchievement.query.filter_by(
                    user_id=user_id, 
                    achievement_id=focus.id
                ).first()
                
                if not existing:
                    award_achievement(user_id, focus.id)
                    awarded.append(focus)
    
    # Check for "Subject Expert" achievement
    if len(completed_sessions) >= 10:
        # Group sessions by subject
        sessions_by_subject = {}
        for session in completed_sessions:
            subject = session.subject
            if subject not in sessions_by_subject:
                sessions_by_subject[subject] = []
            sessions_by_subject[subject].append(session)
        
        # Find subject with most sessions
        subject_counts = [(subject, len(sessions)) for subject, sessions in sessions_by_subject.items()]
        max_subject = max(subject_counts, key=lambda x: x[1])
        
        if max_subject[1] >= 10:
            expert = Achievement.query.filter_by(name='Subject Expert').first()
            if expert:
                existing = UserAchievement.query.filter_by(
                    user_id=user_id, 
                    achievement_id=expert.id
                ).first()
                
                if not existing:
                    award_achievement(user_id, expert.id)
                    awarded.append(expert)
    
    # Check for "Time Wizard" achievement
    total_minutes = sum([session.duration for session in completed_sessions])
    if total_minutes >= 24 * 60:  # 24 hours in minutes
        wizard = Achievement.query.filter_by(name='Time Wizard').first()
        if wizard:
            existing = UserAchievement.query.filter_by(
                user_id=user_id, 
                achievement_id=wizard.id
            ).first()
            
            if not existing:
                award_achievement(user_id, wizard.id)
                awarded.append(wizard)
    
    return awarded

# Helper function to award achievement and points
def award_achievement(user_id, achievement_id):
    # Add user achievement
    user_achievement = UserAchievement(
        user_id=user_id,
        achievement_id=achievement_id
    )
    db.session.add(user_achievement)
    
    # Get achievement points
    achievement = Achievement.query.get(achievement_id)
    if not achievement:
        return
    
    # Add points
    add_points(user_id, achievement.points, f"Achievement: {achievement.name}")
    
    db.session.commit()

# Helper function to add points
def add_points(user_id, amount, reason=""):
    # Get or create user points record
    user_points = UserPoints.query.filter_by(user_id=user_id).first()
    if not user_points:
        user_points = UserPoints(user_id=user_id)
        db.session.add(user_points)
    
    # Add points
    user_points.total_points += amount
    
    # Update level - simple level system (level = points / 100)
    new_level = (user_points.total_points // 100) + 1
    level_up = new_level > user_points.level
    user_points.level = new_level
    
    # Record transaction
    transaction = PointTransaction(
        user_id=user_id,
        amount=amount,
        reason=reason
    )
    db.session.add(transaction)
    
    db.session.commit()
    return level_up

@gamification_bp.route('/achievements', methods=['GET'])
@token_required
def get_all_achievements():
    try:
        achievements = Achievement.query.all()
        result = []
        
        for achievement in achievements:
            result.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'points': achievement.points,
                'badge_image': achievement.badge_image
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error getting achievements: {str(e)}")
        return handle_error('An error occurred while retrieving achievements', 500)

@gamification_bp.route('/user/<int:user_id>/achievements', methods=['GET'])
@token_required
def get_user_achievements(user_id):
    try:
        user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()
        result = []
        
        for ua in user_achievements:
            achievement = ua.achievement
            result.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'points': achievement.points,
                'badge_image': achievement.badge_image,
                'earned_at': ua.earned_at.isoformat()
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error getting user achievements: {str(e)}")
        return handle_error('An error occurred while retrieving user achievements', 500)

@gamification_bp.route('/user/<int:user_id>/points', methods=['GET'])
@token_required
def get_user_points(user_id):
    try:
        user_points = UserPoints.query.filter_by(user_id=user_id).first()
        
        if not user_points:
            user_points = UserPoints(user_id=user_id)
            db.session.add(user_points)
            db.session.commit()
        
        result = {
            'user_id': user_points.user_id,
            'total_points': user_points.total_points,
            'level': user_points.level,
            'next_level_points': (user_points.level * 100),
            'progress': user_points.total_points % 100
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error getting user points: {str(e)}")
        return handle_error('An error occurred while retrieving user points', 500)

@gamification_bp.route('/user/<int:user_id>/transactions', methods=['GET'])
@token_required
def get_point_transactions(user_id):
    try:
        transactions = PointTransaction.query.filter_by(user_id=user_id)\
            .order_by(PointTransaction.created_at.desc()).limit(20).all()
        
        result = []
        for tx in transactions:
            result.append({
                'id': tx.id,
                'amount': tx.amount,
                'reason': tx.reason,
                'created_at': tx.created_at.isoformat()
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error getting point transactions: {str(e)}")
        return handle_error('An error occurred while retrieving point transactions', 500)

@gamification_bp.route('/check-achievements/<int:user_id>', methods=['POST'])
@token_required
def trigger_achievement_check(user_id):
    try:
        awarded = check_achievements(user_id)
        
        result = []
        for achievement in awarded:
            result.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'points': achievement.points,
                'badge_image': achievement.badge_image
            })
        
        return jsonify({
            'message': f"Checked achievements - {len(result)} new awarded",
            'achievements': result
        }), 200
        
    except Exception as e:
        print(f"Error checking achievements: {str(e)}")
        return handle_error('An error occurred while checking achievements', 500)

@gamification_bp.route('/award-session-points/<int:session_id>', methods=['POST'])
@token_required
def award_session_points(session_id):
    try:
        session = StudySession.query.get(session_id)
        if not session:
            return handle_error('Session not found', 404)
        
        # Calculate points based on duration
        duration_points = session.duration // 15  # 1 point per 15 minutes
        
        # Add bonus points for consistent sessions
        bonus = 0
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)
        
        # Check if user studied yesterday too
        yesterday_sessions = StudySession.query.filter(
            StudySession.user_id == session.user_id,
            StudySession.completed == True,
            func.date(StudySession.scheduled_time) == yesterday
        ).count()
        
        if yesterday_sessions > 0:
            bonus = 5  # Bonus for consistency
        
        total_points = duration_points + bonus
        add_points(
            session.user_id, 
            total_points, 
            f"Completed study session: {session.subject} ({session.duration} mins)"
        )
        
        # Check for new achievements
        awarded = check_achievements(session.user_id)
        
        achievement_results = []
        for achievement in awarded:
            achievement_results.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'points': achievement.points,
                'badge_image': achievement.badge_image
            })
        
        return jsonify({
            'points_awarded': total_points,
            'new_achievements': achievement_results
        }), 200
        
    except Exception as e:
        print(f"Error awarding session points: {str(e)}")
        return handle_error('An error occurred while awarding points', 500)

# Get leaderboard
@gamification_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        leaderboard = db.session.query(
            UserPoints, User.username
        ).join(
            User, UserPoints.user_id == User.id
        ).order_by(
            UserPoints.total_points.desc()
        ).limit(10).all()
        
        result = []
        for user_points, username in leaderboard:
            result.append({
                'user_id': user_points.user_id,
                'username': username,
                'total_points': user_points.total_points,
                'level': user_points.level
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error getting leaderboard: {str(e)}")
        return handle_error('An error occurred while retrieving leaderboard', 500)    