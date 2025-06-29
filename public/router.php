<?php
// DEBUG: ビルトインサーバー用ルーティングスクリプト

// リクエストされたURIのパスを取得
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 静的ファイルが存在するかチェック
if (file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
    // 静的ファイルが存在する場合はそのまま返す
    return false;
}

// それ以外の場合は、public/index.php を実行
require_once __DIR__ . '/index.php';
