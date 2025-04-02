from flask import Blueprint, request, jsonify
import openai
import os
from dotenv import load_dotenv
from backend.utils.error_handler import handle_error

load_dotenv()

chat_bp = Blueprint('chat', __name__)

# Read OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
USE_OPENAI_API = os.getenv("USE_OPENAI_API", "False") == "True"

# Ensure API Key is correctly loaded
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API Key is missing. Please check your .env file.")

# Initialize OpenAI client
client = openai.Client(api_key=OPENAI_API_KEY)

# Chat endpoint
@chat_bp.route('/', methods=['POST'])
def chat_with_ai():
    try:
        data = request.get_json()
        user_message = data.get('message', '')

        if not user_message:
            return handle_error('Message is required', 400)

        # Return mock response if AI response is disabled
        if not USE_OPENAI_API:
            mock_responses = {
                "Tell me a joke.": "Why did the chicken cross the road? To get to the other side!",
                "What is AI?": "AI stands for Artificial Intelligence, which enables machines to simulate human intelligence.",
                "Who are you?": "I am your AI-powered study assistant, here to help you learn efficiently!"
            }
            # Return a predefined response if available, otherwise a generic message
            mock_response = mock_responses.get(user_message, f"(Mock Response) You asked: '{user_message}'. Here's a helpful suggestion.")
            return jsonify({'response': mock_response}), 200

        # Call OpenAI API
        system_prompt = data.get('system', "You are a helpful study assistant. You help students plan, stay motivated, and understand difficult concepts.")
        user_message = data.get('message', '')
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=300,
            temperature=0.7
        )

        # Parse API response
        choices = response.choices
        if not choices:
            return handle_error('No valid response from OpenAI', 500)

        answer = choices[0].message.content.strip()
        return jsonify({'response': answer}), 200

    except openai.OpenAIError as e:  # Handle OpenAI API errors
        print(f"OpenAI API Error: {str(e)}")
        return handle_error(f"OpenAI API error: {str(e)}", 500)
    except Exception as e:
        print(f"Chatbot Error: {str(e)}")
        return handle_error('An error occurred while processing your request', 500)
