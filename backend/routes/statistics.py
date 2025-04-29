# backend/routes/statistics.py

from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from backend.database.models import StudySession, KanbanTask


statistics_bp = Blueprint('statistics', __name__)

@statistics_bp.route('/<int:user_id>', methods=['GET'])
def get_statistics(user_id):
    now = datetime.utcnow()
    week_start = now - timedelta(days=now.weekday())
    week_end = week_start + timedelta(days=6)

    sessions = StudySession.query.filter(
        StudySession.user_id == user_id,
        StudySession.scheduled_time >= week_start,
        StudySession.scheduled_time <= week_end,
    ).all()

    total_minutes = sum([s.duration for s in sessions])
    completed_sessions = sum([1 for s in sessions if s.completed])
    days_studied = set(s.scheduled_time.date() for s in sessions)
    streak_days = len(days_studied)
    completed_tasks = KanbanTask.query.filter_by(status='done').count()


    daily_minutes = {}
    for s in sessions:
        day = s.scheduled_time.strftime('%A')
        daily_minutes[day] = daily_minutes.get(day, 0) + s.duration

    return jsonify({
        "total_study_time_minutes": total_minutes,
        "completed_sessions": completed_sessions,
        "completed_tasks": completed_tasks,
        "streak_days": streak_days,
        "daily_minutes": daily_minutes
    })
