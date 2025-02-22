from flask import jsonify

def handle_error(error_message, status_code=500):
    """Return a standardized error response."""
    response = {
        'success': False,
        'error': error_message
    }
    return jsonify(response), status_code
