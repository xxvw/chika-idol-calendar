from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, PasswordField, DateTimeField, DecimalField, SelectField
from wtforms.validators import DataRequired, Email, URL, Optional

class LoginForm(FlaskForm):
    """管理者ログインフォーム"""
    username = StringField('ユーザー名', validators=[DataRequired()])
    password = PasswordField('パスワード', validators=[DataRequired()])

class EventForm(FlaskForm):
    """イベント作成・編集フォーム"""
    title = StringField('イベントタイトル', validators=[DataRequired()])
    description = TextAreaField('イベント説明')
    start_time = DateTimeField('開始時間', validators=[DataRequired()])
    end_time = DateTimeField('終了時間', validators=[DataRequired()])
    location = StringField('場所')
    venue_name = StringField('会場名')
    ticket_price = StringField('チケット価格')
    ticket_url = StringField('チケット購入URL', validators=[Optional(), URL()])
    idol_id = SelectField('出演アイドル', coerce=int, validators=[DataRequired()])

class IdolForm(FlaskForm):
    """アイドル作成・編集フォーム"""
    name = StringField('アイドル名', validators=[DataRequired()])
    description = TextAreaField('プロフィール')
    image_url = StringField('画像URL', validators=[Optional(), URL()])
    social_media = TextAreaField('SNSリンク') 