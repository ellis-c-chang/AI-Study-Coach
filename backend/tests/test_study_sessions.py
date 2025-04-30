import json
from backend.app import app  # 确保你 app.py 中有定义 app = Flask(__name__)

def test_create_study_session():
    with app.test_client() as client:
        response = client.post("/study_sessions/", json={
            "user_id": 1,
            "subject": "Math",
            "duration": 30,
            "scheduled_time": "2025-04-30T10:00:00Z"
        })
        assert response.status_code == 200 or response.status_code == 201
