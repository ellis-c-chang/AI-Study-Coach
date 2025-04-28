from datetime import datetime
from . import db
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile = db.relationship('UserProfile', backref='user', uselist=False)

class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    scheduled_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    study_style = db.Column(db.String(50))
    preferred_study_time = db.Column(db.String(50))
    grade_level = db.Column(db.String(50))
    subjects = db.Column(db.Text)  # Stored as JSON
    goals = db.Column(db.Text)
    quiz_responses = db.Column(db.Text)  # Stored as JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_subjects(self, subjects_list):
        self.subjects = json.dumps(subjects_list)
        
    def get_subjects(self):
        return json.loads(self.subjects) if self.subjects else []
        
    def set_quiz_responses(self, responses):
        self.quiz_responses = json.dumps(responses)
        
    def get_quiz_responses(self):
        return json.loads(self.quiz_responses) if self.quiz_responses else {}