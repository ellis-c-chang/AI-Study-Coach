from flask import Blueprint, request, jsonify
from backend.database.models import StudyGroup, GroupMembership, GroupStudySession, User, StudySession
from backend.database import db
import random
import string

groups_bp = Blueprint('groups', __name__, url_prefix='/groups')

# Utility to generate random join code
def generate_join_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# Create a new group
@groups_bp.route('', methods=['POST'])
def create_group():
    try:
        data = request.get_json()
        name = data.get('name')
        description = data.get('description')
        user_id = data.get('user_id')

        if not name or not user_id:
            return jsonify({'error': 'Missing group name or user_id'}), 400

        join_code = generate_join_code()

        new_group = StudyGroup(
            name=name,
            description=description,
            join_code=join_code
        )
        db.session.add(new_group)
        db.session.commit()

        membership = GroupMembership(
            user_id=user_id,
            group_id=new_group.id
        )
        db.session.add(membership)
        db.session.commit()

        return jsonify({
            'group_id': new_group.id,
            'name': new_group.name,
            'description': new_group.description,
            'join_code': new_group.join_code
        }), 201
    except Exception as e:
        print(f"Error creating group: {e}")
        return jsonify({'error': 'Failed to create group'}), 500

# Join an existing group by join code
@groups_bp.route('/join', methods=['POST'])
def join_group():
    data = request.get_json()
    user_id = data.get('user_id')
    join_code = data.get('join_code')

    group = StudyGroup.query.filter_by(join_code=join_code).first()
    if not group:
        return jsonify({'error': 'Invalid join code'}), 404

    existing = GroupMembership.query.filter_by(group_id=group.id, user_id=user_id).first()
    if existing:
        return jsonify({'message': 'Already joined'}), 200

    membership = GroupMembership(group_id=group.id, user_id=user_id)
    db.session.add(membership)
    db.session.commit()

    return jsonify({'message': 'Successfully joined', 'group_id': group.id})

# Get all groups the user is in
@groups_bp.route('/my', methods=['GET'])
def my_groups():
    user_id = request.args.get('user_id')
    memberships = GroupMembership.query.filter_by(user_id=user_id).all()

    groups = []
    for m in memberships:
        group = StudyGroup.query.get(m.group_id)
        if group:
            groups.append({
                'group_id': group.id,
                'name': group.name,
                'description': group.description,
                'join_code': group.join_code
            })

    return jsonify(groups)

# Get members of a group
@groups_bp.route('/<int:group_id>/members', methods=['GET'])
def group_members(group_id):
    memberships = GroupMembership.query.filter_by(group_id=group_id).all()

    members = []
    for m in memberships:
        user = User.query.get(m.user_id)
        if user:
            members.append({
                'user_id': user.id,
                'username': user.username,
                'email': user.email
            })

    return jsonify(members)

# Leave a group
@groups_bp.route('/leave', methods=['POST'])
def leave_group():
    data = request.get_json()
    user_id = data.get('user_id')
    group_id = data.get('group_id')

    membership = GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first()
    if not membership:
        return jsonify({'error': 'Membership not found'}), 404

    db.session.delete(membership)
    db.session.commit()

    return jsonify({'message': 'Successfully left the group.'})

# Add study session to group
@groups_bp.route('/<int:group_id>/sessions', methods=['POST'])
def add_group_session(group_id):
    data = request.get_json()
    subject = data.get('subject')
    scheduled_time = data.get('scheduled_time')
    duration = data.get('duration')

    session = GroupStudySession(
        group_id=group_id,
        subject=subject,
        scheduled_time=scheduled_time,
        duration=duration
    )
    db.session.add(session)
    db.session.flush() 

    memberships = GroupMembership.query.filter_by(group_id=group_id).all()
    for member in memberships:
        personal_session = StudySession(
            user_id=member.user_id,
            subject=subject,
            scheduled_time=scheduled_time,
            duration=duration
        )
        db.session.add(personal_session)

    db.session.commit()

    return jsonify({'message': 'Group session added and synced to all members'}), 201


# Get all study sessions of a group
@groups_bp.route('/<int:group_id>/sessions', methods=['GET'])
def get_group_sessions(group_id):
    sessions = GroupStudySession.query.filter_by(group_id=group_id).all()

    result = []
    for s in sessions:
        result.append({
            'id': s.id,
            'subject': s.subject,
            'scheduled_time': s.scheduled_time,
            'duration': s.duration
        })

    return jsonify(result)
