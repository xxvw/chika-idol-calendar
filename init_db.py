from app import create_app
from models import db, Admin, Idol, Event
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

def init_db():
    """データベースの初期化とサンプルデータの作成"""
    app = create_app()
    
    with app.app_context():
        # データベースの作成
        db.drop_all()
        db.create_all()
        
        # 管理者アカウントの作成
        admin = Admin(
            username='admin',
            password_hash=generate_password_hash('admin123'),
            email='admin@example.com'
        )
        db.session.add(admin)
        
        # サンプルアイドルの作成
        idols = [
            Idol(
                name='フルフェリーチェ',
                description='大阪を中心に活動する地下アイドルグループ',
                social_media={'twitter': 'fulufuli'}
            ),
            Idol(
                name='ParaMilia',
                description='大阪発の次世代アイドルグループ',
                social_media={'twitter': 'ParaMilia'}
            ),
            Idol(
                name='ハッシュタグ',
                description='SNSで話題の新世代アイドル',
                social_media={'twitter': 'hashtag_iDO'}
            ),
            Idol(
                name='AILOS',
                description='豊洲PITを中心に活動するアイドルグループ',
                social_media={'twitter': 'AILOS_official'}
            ),
            Idol(
                name='Tiara Palette',
                description='キラキラ輝く7人組アイドルグループ',
                social_media={'twitter': 'Tiara_Palette'}
            )
        ]
        
        for idol in idols:
            db.session.add(idol)
        
        # 一旦コミットしてIDを確定
        db.session.commit()
        
        # サンプルイベントの作成
        base_date = datetime.now().replace(hour=19, minute=0, second=0, microsecond=0)
        events = [
            Event(
                title='定期公演',
                description='フルフェリーチェ定期公演 Vol.1',
                start_time=base_date,
                end_time=base_date + timedelta(hours=2),
                venue_name='OSAKA MUSE',
                location='大阪市中央区心斎橋筋2-8-12',
                ticket_price='前売り 2,500円 / 当日 3,000円',
                idol_id=idols[0].id
            ),
            Event(
                title='ParaMilia 1stワンマンライブ',
                description='ParaMilia初のワンマンライブ！',
                start_time=base_date + timedelta(days=3),
                end_time=base_date + timedelta(days=3, hours=2),
                venue_name='心斎橋BIGSTEP',
                location='大阪市中央区西心斎橋1-6-14',
                ticket_price='前売り 3,000円',
                idol_id=idols[1].id
            ),
            # 他のイベントも同様に追加
        ]
        
        for event in events:
            db.session.add(event)
        
        db.session.commit()
        print('データベースが初期化され、サンプルデータが作成されました。')

if __name__ == '__main__':
    init_db() 