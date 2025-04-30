from flask import Blueprint, request, jsonify
from backend.database.models import Task, db
from datetime import datetime

kanban_bp = Blueprint('kanban', __name__)

@kanban_bp.route('/', methods=['POST'])
def add_task():
    data = request.get_json()
    task = Task(
        user_id=data['user_id'],
        title=data['title'],
        status=data.get('status', 'todo')
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({
        'id': task.id,
        'title': task.title,
        'status': task.status,
        'user_id': task.user_id,
        'created_at': task.created_at.isoformat()
    }), 201

@kanban_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_tasks(user_id):
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            'id': t.id,
            'title': t.title,
            'status': t.status,
            'user_id': t.user_id,
            'created_at': t.created_at.isoformat()
        } for t in tasks
    ]), 200

@kanban_bp.route('/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if task:
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Deleted'}), 200
    return jsonify({'error': 'Task not found'}), 404
