from flask import Flask, render_template
from flask_login import LoginManager
from models import db, Admin
import os
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # アプリケーションの設定
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///idol_calendar.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # データベースの初期化
    db.init_app(app)
    
    # ログイン管理の設定
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'admin.login'
    
    @login_manager.user_loader
    def load_user(user_id):
        return Admin.query.get(int(user_id))
    
    # エラーハンドリング
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('errors/500.html'), 500

    # コンテキストプロセッサー
    @app.context_processor
    def utility_processor():
        def format_datetime(value, format='%Y年%m月%d日 %H:%M'):
            if value is None:
                return ""
            return value.strftime(format)
        return dict(format_datetime=format_datetime)
    
    # ルートの登録
    from routes.main import main_bp
    from routes.admin import admin_bp
    from routes.events import events_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(events_bp, url_prefix='/events')
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True) 