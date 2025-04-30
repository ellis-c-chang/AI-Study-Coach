from datetime import datetime
import json
from . import db

# ──────────────── Auth ────────────────
class User(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(80),  unique=True, nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    # one-to-one
    profile = db.relationship('UserProfile', backref='user', uselist=False)


# ──────────────── Personal study sessions ────────────────
class StudySession(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject        = db.Column(db.String(100), nullable=False)
    duration       = db.Column(db.Integer, nullable=False)               # minutes
    scheduled_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    start_time     = db.Column(db.DateTime, default=datetime.utcnow)
    completed      = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ──────────────── Study-group 功能 ────────────────
class StudyGroup(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    join_code   = db.Column(db.String(10), unique=True, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)


class GroupMembership(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    group_id  = db.Column(db.Integer, db.ForeignKey('study_group.id'), nullable=False)
    user_id   = db.Column(db.Integer, db.ForeignKey('user.id'),        nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)


class GroupStudySession(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    group_id       = db.Column(db.Integer, db.ForeignKey('study_group.id'), nullable=False)
    subject        = db.Column(db.String(100), nullable=False)
    scheduled_time = db.Column(db.DateTime, nullable=False)
    duration       = db.Column(db.Integer, nullable=False)               # minutes
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)


# ──────────────── Gamification ────────────────
class Achievement(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    badge_image = db.Column(db.String(255))   # path / URL
    points      = db.Column(db.Integer, default=0)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)


class UserAchievement(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('user.id'),         nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievement.id'),  nullable=False)
    earned_at      = db.Column(db.DateTime, default=datetime.utcnow)

    # relationship for convenience
    achievement = db.relationship('Achievement', backref='users_earned')


class UserPoints(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    total_points = db.Column(db.Integer, default=0)
    level        = db.Column(db.Integer, default=1)
    updated_at   = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PointTransaction(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount     = db.Column(db.Integer, nullable=False)
    reason     = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ──────────────── User Profile / Onboarding ────────────────
class UserProfile(db.Model):
    id                    = db.Column(db.Integer, primary_key=True)
    user_id               = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    study_style           = db.Column(db.String(50))
    preferred_study_time  = db.Column(db.String(50))
    grade_level           = db.Column(db.String(50))
    subjects              = db.Column(db.Text)  # JSON list
    goals                 = db.Column(db.Text)
    quiz_responses        = db.Column(db.Text)  # JSON dict
    created_at            = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at            = db.Column(db.DateTime, default=datetime.utcnow,
                                      onupdate=datetime.utcnow)

    # helpers
    def set_subjects(self, subjects_list):
        self.subjects = json.dumps(subjects_list)

    def get_subjects(self):
        return json.loads(self.subjects) if self.subjects else []

    def set_quiz_responses(self, responses):
        self.quiz_responses = json.dumps(responses)

    def get_quiz_responses(self):
        return json.loads(self.quiz_responses) if self.quiz_responses else {}