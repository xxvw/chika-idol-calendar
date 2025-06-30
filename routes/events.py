from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from models import Event, db
from datetime import datetime
import pytz
from dateutil import parser

events_bp = Blueprint('events', __name__)

@events_bp.route('/<int:event_id>')
def event_detail(event_id):
    """イベント詳細をJSONで返す"""
    try:
        event = Event.query.get_or_404(event_id)
        return jsonify({
            'event': {
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'start_time': event.start_time.isoformat(),
                'end_time': event.end_time.isoformat(),
                'location': event.location,
                'venue_name': event.venue_name,
                'ticket_price': event.ticket_price,
                'ticket_url': event.ticket_url,
                'idol': {
                    'id': event.idol.id,
                    'name': event.idol.name,
                    'social_media': event.idol.social_media
                }
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/calendar/data')
def calendar_data():
    """カレンダーのイベントデータを返すAPI"""
    try:
        # 開始日と終了日のパラメータを取得
        start = request.args.get('start', type=str)
        end = request.args.get('end', type=str)

        # タイムゾーンの設定
        jst = pytz.timezone('Asia/Tokyo')
        utc = pytz.UTC

        # 日付文字列をパース
        try:
            start_date = parser.parse(start)
            end_date = parser.parse(end)
        except ValueError as e:
            return jsonify([]), 200  # エラーの場合は空の配列を返す

        # タイムゾーンを設定
        if start_date.tzinfo is None:
            start_date = jst.localize(start_date)
        if end_date.tzinfo is None:
            end_date = jst.localize(end_date)

        # UTCに変換
        start_date = start_date.astimezone(utc)
        end_date = end_date.astimezone(utc)

        # 指定された期間のイベントを取得
        events = Event.query.filter(
            Event.start_time >= start_date,
            Event.start_time <= end_date
        ).all()

        # FullCalendar形式のイベントデータを作成
        calendar_events = []
        for event in events:
            # Twitterハンドルを取得（存在する場合）
            twitter_handle = event.idol.social_media.get('twitter', '') if event.idol.social_media else ''
            twitter_display = f' @{twitter_handle}' if twitter_handle else ''

            calendar_events.append({
                'id': event.id,
                'title': f"{event.idol.name}{twitter_display}",
                'start': event.start_time.isoformat(),
                'end': event.end_time.isoformat(),
                'allDay': False,
                'extendedProps': {
                    'venue': event.venue_name,
                    'location': event.location,
                    'idol': {
                        'id': event.idol.id,
                        'name': event.idol.name,
                        'twitter': twitter_handle
                    }
                }
            })

        return jsonify(calendar_events)
    except Exception as e:
        print(f"Error in calendar_data: {str(e)}")  # サーバーログにエラーを出力
        return jsonify([]), 200  # エラーの場合は空の配列を返す 