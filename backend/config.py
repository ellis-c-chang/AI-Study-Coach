import os
import re

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
    #SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    @property
    def SQLALCHEMY_DATABASE_URI(self):
        uri = os.getenv('DATABASE_URL')
        if uri is None:
            return None
        if uri.startswith('postgres://'):
            uri = uri.replace('postgres://', 'postgresql://', 1)
        return uri

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    ENV = 'production'
