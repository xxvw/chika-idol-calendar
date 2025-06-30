from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import Admin, Event, Idol, db
from forms import LoginForm, EventForm, IdolForm

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    """管理者ログインページ"""
    if current_user.is_authenticated:
        return redirect(url_for('admin.dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        admin = Admin.query.filter_by(username=form.username.data).first()
        if admin and check_password_hash(admin.password_hash, form.password.data):
            login_user(admin)
            return redirect(url_for('admin.dashboard'))
        flash('ユーザー名またはパスワードが間違っています')
    return render_template('admin/login.html', form=form)

@admin_bp.route('/logout')
@login_required
def logout():
    """ログアウト処理"""
    logout_user()
    return redirect(url_for('main.index'))

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    """管理者ダッシュボード"""
    events = Event.query.order_by(Event.start_time.desc()).all()
    idols = Idol.query.all()
    return render_template('admin/dashboard.html', events=events, idols=idols)

@admin_bp.route('/event/new', methods=['GET', 'POST'])
@login_required
def new_event():
    """イベント作成ページ"""
    form = EventForm()
    if form.validate_on_submit():
        event = Event(
            title=form.title.data,
            description=form.description.data,
            start_time=form.start_time.data,
            end_time=form.end_time.data,
            location=form.location.data,
            venue_name=form.venue_name.data,
            ticket_price=form.ticket_price.data,
            ticket_url=form.ticket_url.data,
            idol_id=form.idol_id.data
        )
        db.session.add(event)
        db.session.commit()
        flash('イベントが作成されました')
        return redirect(url_for('admin.dashboard'))
    return render_template('admin/event_form.html', form=form, title='新規イベント作成')

@admin_bp.route('/idol/new', methods=['GET', 'POST'])
@login_required
def new_idol():
    """アイドル作成ページ"""
    form = IdolForm()
    if form.validate_on_submit():
        idol = Idol(
            name=form.name.data,
            description=form.description.data,
            image_url=form.image_url.data,
            social_media=form.social_media.data
        )
        db.session.add(idol)
        db.session.commit()
        flash('アイドルが登録されました')
        return redirect(url_for('admin.dashboard'))
    return render_template('admin/idol_form.html', form=form, title='新規アイドル登録') 