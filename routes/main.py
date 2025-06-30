from flask import Blueprint, render_template
from models import Event, Idol
from datetime import datetime

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """トップページ"""
    return render_template('index.html')

@main_bp.route('/idol/<int:idol_id>')
def idol_detail(idol_id):
    """アイドル詳細ページ"""
    idol = Idol.query.get_or_404(idol_id)
    # アイドルの今後のイベントを取得
    upcoming_events = Event.query.filter(
        Event.idol_id == idol_id,
        Event.start_time >= datetime.utcnow()
    ).order_by(Event.start_time).all()
    return render_template('idol_detail.html', idol=idol, events=upcoming_events)

@main_bp.route('/idol/list')
def idol_list():
    """アイドル一覧ページ"""
    idols = Idol.query.order_by(Idol.name).all()
    return render_template('idol_list.html', idols=idols) 