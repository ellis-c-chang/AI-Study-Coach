import json
import pytest
from backend.database.models import Task

def test_add_task(client, db, auth_headers):
    """Test adding a new task"""
    # Prepare task data
    task_data = {
        'user_id': 1,
        'title': 'Prepare for presentation',
        'status': 'todo'
    }
    
    # Send add request
    response = client.post(
        '/kanban/',
        data=json.dumps(task_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['title'] == 'Prepare for presentation'
    assert data['status'] == 'todo'
    assert data['user_id'] == 1
    
    # Verify task was created in database
    task = Task.query.filter_by(title='Prepare for presentation').first()
    assert task is not None
    assert task.status == 'todo'

def test_get_user_tasks(client, db, auth_headers):
    """Test retrieving tasks for a user"""
    # Send get request
    response = client.get(
        '/kanban/user/1',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 3  # We should have at least 3 from seed data
    
    # Check data structure
    for task in data:
        assert 'id' in task
        assert 'title' in task
        assert 'status' in task
        assert 'user_id' in task
        assert task['user_id'] == 1

def test_update_task(client, db, auth_headers):
    """Test updating a task"""
    # First get existing tasks
    get_response = client.get(
        '/kanban/user/1',
        headers=auth_headers
    )
    tasks = json.loads(get_response.data)
    task_to_update = tasks[0]
    
    # Prepare update data
    update_data = {
        'status': 'inProgress' if task_to_update['status'] != 'inProgress' else 'done',
        'title': task_to_update['title'] + ' (Updated)'
    }
    
    # Send update request
    response = client.put(
        f'/kanban/{task_to_update["id"]}',
        data=json.dumps(update_data),
        content_type='application/json',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == task_to_update['title'] + ' (Updated)'
    assert data['status'] == update_data['status']
    
    # Verify task was updated in database
    task = Task.query.get(task_to_update['id'])
    assert task.title == task_to_update['title'] + ' (Updated)'
    assert task.status == update_data['status']

def test_delete_task(client, db, auth_headers):
    """Test deleting a task"""
    # First create a task to delete
    task_data = {
        'user_id': 1,
        'title': 'Task to be deleted',
        'status': 'todo'
    }
    
    add_response = client.post(
        '/kanban/',
        data=json.dumps(task_data),
        content_type='application/json',
        headers=auth_headers
    )
    new_task = json.loads(add_response.data)
    
    # Send delete request
    response = client.delete(
        f'/kanban/{new_task["id"]}',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    assert b'Deleted' in response.data
    
    # Verify task was deleted from database
    task = Task.query.get(new_task['id'])
    assert task is None

def test_get_all_tasks(client, db, auth_headers):
    """Test retrieving all tasks"""
    # Send get request
    response = client.get(
        '/kanban/',
        headers=auth_headers
    )
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    
    # Check data structure
    for task in data:
        assert 'id' in task
        assert 'title' in task
        assert 'status' in task
        assert 'user_id' in task