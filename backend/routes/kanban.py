from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.database import db
from backend.database.models import KanbanTask  # 注意模型名字
# 如果你放在 models.py 的话，确保KanbanTask也定义了！

kanban_bp = Blueprint('kanban', __name__)

@kanban_bp.route('/', methods=['GET'])
def get_tasks():
    result = {'todo': [], 'inProgress': [], 'done': []}
    tasks = KanbanTask.query.all()
    for task in tasks:
        task_dict = {
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'created_at': task.created_at.isoformat()
        }
        result[task.status].append(task_dict)
    return jsonify(result)

@kanban_bp.route('/', methods=['POST'])
def add_task():
    data = request.get_json()
    new_task = KanbanTask(
        title=data.get('title'),
        status=data.get('status', 'todo')
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({
        'id': new_task.id,
        'title': new_task.title,
        'status': new_task.status,
        'created_at': new_task.created_at.isoformat()
    }), 201

@kanban_bp.route('/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    task = KanbanTask.query.get(task_id)
    if task:
        task.status = data.get('status', task.status)
        db.session.commit()
        return jsonify({
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'created_at': task.created_at.isoformat()
        })
    else:
        return jsonify({'error': 'Task not found'}), 404

@kanban_bp.route('/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = KanbanTask.query.get(task_id)
    if task:
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted'})
    else:
        return jsonify({'error': 'Task not found'}), 404
