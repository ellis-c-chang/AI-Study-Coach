# backend/routes/onboarding.py
from flask import Blueprint, request, jsonify
from backend.database.models import User, UserProfile, db
from backend.utils.error_handler import handle_error
from backend.routes.auth import token_required

onboarding_bp = Blueprint('onboarding', __name__)

@onboarding_bp.route('/profile', methods=['POST'])
@token_required
def create_profile():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        # Check if profile already exists
        existing_profile = UserProfile.query.filter_by(user_id=user_id).first()
        if existing_profile:
            return handle_error('Profile already exists for this user', 409)
            
        # Create new profile
        new_profile = UserProfile(
            user_id=user_id,
            study_style=data.get('study_style'),
            preferred_study_time=data.get('preferred_study_time'),
            grade_level=data.get('grade_level'),
            goals=data.get('goals')
        )
        
        # Set subjects and quiz responses if provided
        if 'subjects' in data:
            new_profile.set_subjects(data['subjects'])
        
        if 'quiz_responses' in data:
            new_profile.set_quiz_responses(data['quiz_responses'])
            
        db.session.add(new_profile)
        db.session.commit()
        
        return jsonify({'message': 'Profile created successfully', 'profile_id': new_profile.id}), 201
        
    except Exception as e:
        print(f"Error creating profile: {str(e)}")
        return handle_error('An error occurred while creating profile', 500)

@onboarding_bp.route('/profile/<int:user_id>', methods=['GET'])
@token_required
def get_profile(user_id):
    try:
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        
        if not profile:
            return handle_error('Profile not found', 404)
            
        # Format the response
        profile_data = {
            'id': profile.id,
            'user_id': profile.user_id,
            'study_style': profile.study_style,
            'preferred_study_time': profile.preferred_study_time,
            'grade_level': profile.grade_level,
            'subjects': profile.get_subjects(),
            'goals': profile.goals,
            'quiz_responses': profile.get_quiz_responses(),
            'created_at': profile.created_at.isoformat(),
            'updated_at': profile.updated_at.isoformat()
        }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        print(f"Error retrieving profile: {str(e)}")
        return handle_error('An error occurred while retrieving profile', 500)

@onboarding_bp.route('/profile/<int:user_id>', methods=['PUT'])
@token_required
def update_profile(user_id):
    try:
        data = request.get_json()
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        
        if not profile:
            return handle_error('Profile not found', 404)
            
        # Update fields if provided
        if 'study_style' in data:
            profile.study_style = data['study_style']
            
        if 'preferred_study_time' in data:
            profile.preferred_study_time = data['preferred_study_time']
            
        if 'grade_level' in data:
            profile.grade_level = data['grade_level']
            
        if 'goals' in data:
            profile.goals = data['goals']
            
        if 'subjects' in data:
            profile.set_subjects(data['subjects'])
            
        if 'quiz_responses' in data:
            profile.set_quiz_responses(data['quiz_responses'])
            
        db.session.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return handle_error('An error occurred while updating profile', 500)