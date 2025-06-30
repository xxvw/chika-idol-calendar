# 地下アイドルカレンダー

地下アイドルのイベント情報を管理・共有するためのWebアプリケーションです。

## 機能

- イベントカレンダー表示
- アイドル情報の管理
- イベント情報の管理
- Googleカレンダーとの連携
- 管理者による情報管理

## 技術スタック

- バックエンド: Flask
- データベース: SQLite
- フロントエンド: TailwindCSS
- カレンダー: FullCalendar
- 認証: Flask-Login

## セットアップ

1. 必要なパッケージのインストール:
```bash
pip install -r requirements.txt
```

2. 環境変数の設定:
```bash
# .envファイルを作成
SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

3. データベースの初期化:
```bash
flask db upgrade
```

4. 開発サーバーの起動:
```bash
flask run
```

## 管理者アカウントの作成

```python
from app import app, db
from models import Admin
from werkzeug.security import generate_password_hash

with app.app_context():
    admin = Admin(
        username='admin',
        password_hash=generate_password_hash('your-password'),
        email='admin@example.com'
    )
    db.session.add(admin)
    db.session.commit()
```

## ライセンス

MIT License
