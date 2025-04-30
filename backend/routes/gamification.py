# backend/routes/gamification.py
from flask import Blueprint, request, jsonify
from sqlalchemy import inspect, func
from datetime import datetime, timedelta

from backend.database.models import (
    User,
    Achievement,
    UserAchievement,
    UserPoints,
    PointTransaction,
    StudySession,
    db,
)
from backend.utils.error_handler import handle_error
from backend.routes.auth import token_required

gamification_bp = Blueprint("gamification", __name__)

# --------------------------------------------------------------------------- #
#                             INIT ACHIEVEMENTS                               #
# --------------------------------------------------------------------------- #
def initialize_achievements():
    """
    Create default achievements exactly once.
    ▸ 如果还没迁移，achievement 表不存在 —— 先跳过，待迁移后再运行。
    ▸ 如果表存在且空，则插入默认成就。
    """
    insp = inspect(db.engine)
    if not insp.has_table("achievement"):
        # Alembic 还没建表；启动时打印提醒即可
        print("[init_achievements] table 'achievement' not found; will initialize after migrations.")
        return

    default_achievements = [
        {
            "name": "First Steps",
            "description": "Complete your first study session",
            "points": 10,
            "badge_image": "badges/first_steps.png",
        },
        {
            "name": "Study Streak",
            "description": "Complete study sessions for 3 days in a row",
            "points": 30,
            "badge_image": "badges/streak.png",
        },
        {
            "name": "Focus Master",
            "description": "Complete 5 study sessions in a single day",
            "points": 50,
            "badge_image": "badges/focus.png",
        },
        {
            "name": "Subject Expert",
            "description": "Complete 10 sessions in a single subject",
            "points": 100,
            "badge_image": "badges/expert.png",
        },
        {
            "name": "Time Wizard",
            "description": "Accumulate 24 hours of total study time",
            "points": 150,
            "badge_image": "badges/time.png",
        },
    ]

    if Achievement.query.first():
        print("[init_achievements] achievements already exist")
        return

    for ach in default_achievements:
        db.session.add(
            Achievement(
                name=ach["name"],
                description=ach["description"],
                points=ach["points"],
                badge_image=ach["badge_image"],
            )
        )
    db.session.commit()
    print("[init_achievements] default achievements created")


# --------------------------------------------------------------------------- #
#                            HELPER  FUNCTIONS                                #
# --------------------------------------------------------------------------- #
def add_points(user_id, amount, reason=""):
    """Add points & record transaction; return bool indicating level-up."""
    user_points = UserPoints.query.filter_by(user_id=user_id).first()
    if not user_points:
        user_points = UserPoints(user_id=user_id)
        db.session.add(user_points)

    user_points.total_points += amount
    new_level = (user_points.total_points // 100) + 1
    level_up = new_level > user_points.level
    user_points.level = new_level

    db.session.add(
        PointTransaction(user_id=user_id, amount=amount, reason=reason)
    )
    db.session.commit()
    return level_up


def award_achievement(user_id, achievement_id):
    """Grant an achievement and its points if user hasn't earned it yet."""
    db.session.add(UserAchievement(user_id=user_id, achievement_id=achievement_id))
    achievement = Achievement.query.get(achievement_id)
    if achievement:
        add_points(user_id, achievement.points, f"Achievement: {achievement.name}")


def check_achievements(user_id):
    """Evaluate and grant achievements; return list[Achievement] newly awarded."""
    completed = StudySession.query.filter_by(user_id=user_id, completed=True).all()
    awarded = []

    def already_has(ach):
        return UserAchievement.query.filter_by(
            user_id=user_id, achievement_id=ach.id
        ).first()

    # --- First Steps ---
    if completed:
        ach = Achievement.query.filter_by(name="First Steps").first()
        if ach and not already_has(ach):
            award_achievement(user_id, ach.id)
            awarded.append(ach)

    # --- Study Streak (3 consecutive days) ---
    if len(completed) >= 3:
        days = sorted({s.scheduled_time.date() for s in completed})
        for i in range(len(days) - 2):
            if (days[i + 1] - days[i]).days == 1 and (days[i + 2] - days[i + 1]).days == 1:
                ach = Achievement.query.filter_by(name="Study Streak").first()
                if ach and not already_has(ach):
                    award_achievement(user_id, ach.id)
                    awarded.append(ach)
                break

    # --- Focus Master (5 sessions same day) ---
    if len(completed) >= 5:
        per_day = {}
        for s in completed:
            per_day.setdefault(s.scheduled_time.date(), []).append(s)
        if max(len(v) for v in per_day.values()) >= 5:
            ach = Achievement.query.filter_by(name="Focus Master").first()
            if ach and not already_has(ach):
                award_achievement(user_id, ach.id)
                awarded.append(ach)

    # --- Subject Expert (10 sessions same subject) ---
    if len(completed) >= 10:
        per_subj = {}
        for s in completed:
            per_subj.setdefault(s.subject, []).append(s)
        if max(len(v) for v in per_subj.values()) >= 10:
            ach = Achievement.query.filter_by(name="Subject Expert").first()
            if ach and not already_has(ach):
                award_achievement(user_id, ach.id)
                awarded.append(ach)

    # --- Time Wizard (24h total) ---
    if sum(s.duration for s in completed) >= 24 * 60:
        ach = Achievement.query.filter_by(name="Time Wizard").first()
        if ach and not already_has(ach):
            award_achievement(user_id, ach.id)
            awarded.append(ach)

    db.session.commit()
    return awarded


# --------------------------------------------------------------------------- #
#                                  ROUTES                                     #
# --------------------------------------------------------------------------- #
@gamification_bp.route("/achievements", methods=["GET"])
@token_required
def get_all_achievements():
    try:
        achievements = Achievement.query.all()
        return (
            jsonify(
                [
                    {
                        "id": a.id,
                        "name": a.name,
                        "description": a.description,
                        "points": a.points,
                        "badge_image": a.badge_image,
                    }
                    for a in achievements
                ]
            ),
            200,
        )
    except Exception as e:
        print(f"Error getting achievements: {e}")
        return handle_error("An error occurred while retrieving achievements", 500)


@gamification_bp.route("/user/<int:user_id>/achievements", methods=["GET"])
@token_required
def get_user_achievements(user_id):
    try:
        ua_list = UserAchievement.query.filter_by(user_id=user_id).all()
        result = [
            {
                "id": ua.achievement.id,
                "name": ua.achievement.name,
                "description": ua.achievement.description,
                "points": ua.achievement.points,
                "badge_image": ua.achievement.badge_image,
                "earned_at": ua.earned_at.isoformat(),
            }
            for ua in ua_list
        ]
        return jsonify(result), 200
    except Exception as e:
        print(f"Error getting user achievements: {e}")
        return handle_error("An error occurred while retrieving user achievements", 500)


@gamification_bp.route("/user/<int:user_id>/points", methods=["GET"])
@token_required
def get_user_points(user_id):
    try:
        up = UserPoints.query.filter_by(user_id=user_id).first()
        if not up:
            up = UserPoints(user_id=user_id)
            db.session.add(up)
            db.session.commit()

        return (
            jsonify(
                {
                    "user_id": up.user_id,
                    "total_points": up.total_points,
                    "level": up.level,
                    "next_level_points": up.level * 100,
                    "progress": up.total_points % 100,
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Error getting user points: {e}")
        return handle_error("An error occurred while retrieving user points", 500)


@gamification_bp.route("/user/<int:user_id>/transactions", methods=["GET"])
@token_required
def get_point_transactions(user_id):
    try:
        txs = (
            PointTransaction.query.filter_by(user_id=user_id)
            .order_by(PointTransaction.created_at.desc())
            .limit(20)
            .all()
        )
        return (
            jsonify(
                [
                    {
                        "id": tx.id,
                        "amount": tx.amount,
                        "reason": tx.reason,
                        "created_at": tx.created_at.isoformat(),
                    }
                    for tx in txs
                ]
            ),
            200,
        )
    except Exception as e:
        print(f"Error getting point transactions: {e}")
        return handle_error("An error occurred while retrieving point transactions", 500)


@gamification_bp.route("/check-achievements/<int:user_id>", methods=["POST"])
@token_required
def trigger_achievement_check(user_id):
    try:
        newly_awarded = check_achievements(user_id)
        return (
            jsonify(
                {
                    "message": f"Checked achievements – {len(newly_awarded)} new awarded",
                    "achievements": [
                        {
                            "id": a.id,
                            "name": a.name,
                            "description": a.description,
                            "points": a.points,
                            "badge_image": a.badge_image,
                        }
                        for a in newly_awarded
                    ],
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Error checking achievements: {e}")
        return handle_error("An error occurred while checking achievements", 500)


@gamification_bp.route("/award-session-points/<int:session_id>", methods=["POST"])
@token_required
def award_session_points(session_id):
    try:
        session = StudySession.query.get(session_id)
        if not session:
            return handle_error("Session not found", 404)

        duration_points = session.duration // 15  # 1 point / 15 min
        bonus = 0
        yesterday = (datetime.utcnow() - timedelta(days=1)).date()
        has_yesterday = (
            StudySession.query.filter(
                StudySession.user_id == session.user_id,
                StudySession.completed.is_(True),
                func.date(StudySession.scheduled_time) == yesterday,
            ).count()
            > 0
        )
        if has_yesterday:
            bonus = 5

        total = duration_points + bonus
        add_points(
            session.user_id,
            total,
            f"Completed study session: {session.subject} ({session.duration} mins)",
        )
        newly_awarded = check_achievements(session.user_id)

        return (
            jsonify(
                {
                    "points_awarded": total,
                    "new_achievements": [
                        {
                            "id": a.id,
                            "name": a.name,
                            "description": a.description,
                            "points": a.points,
                            "badge_image": a.badge_image,
                        }
                        for a in newly_awarded
                    ],
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Error awarding session points: {e}")
        return handle_error("An error occurred while awarding points", 500)


@gamification_bp.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    try:
        rows = (
            db.session.query(UserPoints, User.username)
            .join(User, UserPoints.user_id == User.id)
            .order_by(UserPoints.total_points.desc())
            .limit(10)
            .all()
        )
        return (
            jsonify(
                [
                    {
                        "user_id": up.user_id,
                        "username": username,
                        "total_points": up.total_points,
                        "level": up.level,
                    }
                    for up, username in rows
                ]
            ),
            200,
        )
    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        return handle_error("An error occurred while retrieving leaderboard", 500)