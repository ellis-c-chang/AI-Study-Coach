import os
import re

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
    #SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    @staticmethod
    def get_database_url():
        uri = os.getenv('DATABASE_URL')
        if uri is None:
            return None
        if uri.startswith('postgres://'):
            uri = uri.replace('postgres://', 'postgresql://', 1)
        return uri

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'
    # Fallback local database if DATABASE_URL is not provided
    SQLALCHEMY_DATABASE_URI = Config.get_database_url() or 'postgresql://postgres:password@localhost:5432/studyapp'


class ProductionConfig(Config):
    DEBUG = False
    ENV = 'production'
    # Get the database URL with proper format
    SQLALCHEMY_DATABASE_URI = Config.get_database_url()
    
    # Add SSL mode if needed for Render
    if SQLALCHEMY_DATABASE_URI and 'render.com' in SQLALCHEMY_DATABASE_URI and '?' not in SQLALCHEMY_DATABASE_URI:
        SQLALCHEMY_DATABASE_URI += '?sslmode=require'