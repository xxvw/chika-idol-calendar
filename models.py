from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class Admin(UserMixin, db.Model):
    """管理者モデル"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

class Idol(db.Model):
    """アイドルモデル"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(200))
    social_media = db.Column(db.JSON)  # SNSリンク等を格納
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    events = db.relationship('Event', backref='idol', lazy=True)

class Event(db.Model):
    """イベントモデル"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200))
    venue_name = db.Column(db.String(200))
    ticket_price = db.Column(db.String(100))
    ticket_url = db.Column(db.String(200))
    idol_id = db.Column(db.Integer, db.ForeignKey('idol.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 