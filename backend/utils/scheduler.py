# backend/utils/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from backend.database.models import StudySession, User, db
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure API Key is correctly loaded
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = openai.Client(api_key=OPENAI_API_KEY)

def send_study_reminder():
    print(f"[Reminder] Time to study! - {datetime.now()}")

def ai_reschedule_missed_sessions(app):
    """Use AI to intelligently reschedule missed study sessions based on user patterns"""
    with app.app_context():
        # Find all missed sessions
        now = datetime.now()
        missed_sessions = StudySession.query.filter(
            StudySession.scheduled_time < now, 
            StudySession.completed == False
        ).all()
        
        # Group sessions by user for personalized rescheduling
        user_sessions = {}
        for session in missed_sessions:
            if session.user_id not in user_sessions:
                user_sessions[session.user_id] = []
            user_sessions[session.user_id].append(session)
        
        # Process each user's sessions
        for user_id, sessions in user_sessions.items():
            # Get user's completed sessions to analyze patterns
            user = User.query.get(user_id)
            completed_sessions = StudySession.query.filter_by(
                user_id=user_id, 
                completed=True
            ).order_by(StudySession.scheduled_time.desc()).limit(10).all()
            
            # Extract pattern data
            pattern_data = []
            for s in completed_sessions:
                weekday = s.scheduled_time.strftime("%A")
                hour = s.scheduled_time.hour
                pattern_data.append({
                    "weekday": weekday,
                    "hour": hour,
                    "subject": s.subject,
                    "duration": s.duration
                })
            
            # Missed sessions to reschedule
            sessions_to_reschedule = []
            for s in sessions:
                sessions_to_reschedule.append({
                    "id": s.id,
                    "subject": s.subject,
                    "duration": s.duration,
                    "original_time": s.scheduled_time.isoformat()
                })
            
            # Only proceed if we have data to analyze
            if not sessions_to_reschedule:
                continue
                
            # Use AI to suggest new schedule
            try:
                prompt = f"""
                You are an AI study coach helping to reschedule missed study sessions.
                
                User's completed study session patterns:
                {pattern_data}
                
                Missed study sessions that need rescheduling:
                {sessions_to_reschedule}
                
                Today's date: {now.strftime('%Y-%m-%d')}
                Current time: {now.strftime('%H:%M')}
                
                Please suggest new times for each missed session. Consider:
                1. User's typical study patterns (day of week, time of day)
                2. Don't schedule sessions in the past
                3. Space out multiple sessions reasonably
                4. Try to keep the subject at a similar time of day as past sessions
                
                Return a JSON object with session_id as keys and ISO format datetime strings as values.
                Example: {{"1": "2025-04-28T18:00:00", "2": "2025-04-29T10:00:00"}}
                """
                
                # Get AI suggestions
                response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are a helpful study schedule assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                
                # Parse the response
                ai_suggestions = response.choices[0].message.content
                new_schedule = eval(ai_suggestions)  # Convert string to dict
                
                # Update the database with new schedule
                for session_id, new_time_str in new_schedule.items():
                    session_id = int(session_id)  # Convert string key to int
                    new_time = datetime.fromisoformat(new_time_str)
                    
                    # Find the session in our list
                    for session in sessions:
                        if session.id == session_id:
                            session.scheduled_time = new_time
                            db.session.add(session)
                            print(f"Rescheduled session {session_id} to {new_time}")
                            break
                
                db.session.commit()
                print(f"[{datetime.now()}] AI Rescheduled {len(new_schedule)} sessions for user {user_id}.")
                
            except Exception as e:
                print(f"AI rescheduling error: {str(e)}")
                # Fallback to simple rescheduling if AI fails
                for session in sessions:
                    session.scheduled_time = now + timedelta(days=1)
                    db.session.add(session)
                
                db.session.commit()
                print(f"[{datetime.now()}] Fallback: Rescheduled {len(sessions)} missed sessions for user {user_id}.")

# Start the scheduler
def start_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(send_study_reminder, 'interval', minutes=60)  # Runs every hour
    scheduler.add_job(ai_reschedule_missed_sessions, 'interval', minutes=1440, args=[app])  # Runs daily
    scheduler.start()
    print("Background scheduler started.")