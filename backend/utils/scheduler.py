from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from backend.database.models import StudySession, db

# Task that will be scheduled
def send_study_reminder():
    print(f"[Reminder] Time to study! - {datetime.now()}")

def reschedule_missed_sessions(app):
    with app.app_context():
        now = datetime.now()
        missed_sessions = StudySession.query.filter(StudySession.scheduled_time < now, StudySession.completed == False).all()

        for session in missed_sessions:
            session.scheduled_time = now + timedelta(days=1)
            db.session.add(session)

        db.session.commit()
        print(f"[{datetime.now()}] Rescheduled {len(missed_sessions)} missed sessions.")

# Start the scheduler
def start_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(send_study_reminder, 'interval', minutes=60)  # Runs every hour
    scheduler.add_job(reschedule_missed_sessions, 'interval', minutes=1440, args=[app])  # Runs daily to reschedule missed sessions
    scheduler.start()
    print("Background scheduler started.")
