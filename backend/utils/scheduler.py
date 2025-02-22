from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

# Task that will be scheduled
def send_study_reminder():
    print(f"[Reminder] Time to study! - {datetime.now()}")

# Start the scheduler
def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(send_study_reminder, 'interval', minutes=60)  # Runs every hour
    scheduler.start()
