from flask import Blueprint, request, jsonify
from datetime import datetime

kanban_bp = Blueprint('kanban', __name__)

# In-memory store (replace with a database in production)
tasks = []
task_id_counter = 1

@kanban_bp.route('/', methods=['GET'])
def get_tasks():
    result = {'todo': [], 'inProgress': [], 'done': []}
    for task in tasks:
        result[task['status']].append(task)
    return jsonify(result)

@kanban_bp.route('/', methods=['POST'])
def add_task():
    global task_id_counter
    data = request.get_json()
    new_task = {
        'id': task_id_counter,
        'title': data.get('title'),
        'status': data.get('status', 'todo'),
        'user_id': data.get('user_id'),  # ✅ 添加 user_id
        'created_at': datetime.utcnow().isoformat()
    }
    task_id_counter += 1
    tasks.append(new_task)
    return jsonify(new_task), 201


@kanban_bp.route('/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    for task in tasks:
        if task['id'] == task_id:
            task['status'] = data.get('status', task['status'])
            return jsonify(task)
    return jsonify({'error': 'Task not found'}), 404

@kanban_bp.route('/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    global tasks
    tasks = [task for task in tasks if task['id'] != task_id]
    return jsonify({'message': 'Task deleted'})

@kanban_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_tasks(user_id):
    user_tasks = [t for t in tasks if t.get('user_id') == user_id]
    return jsonify(user_tasks), 200
