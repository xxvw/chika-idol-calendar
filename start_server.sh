#!/bin/bash

echo "PHPデバッグサーバーを起動します..."
echo "ドキュメントルート: public/"
echo "ポート: 8000"

# PHPのビルトインウェブサーバーをpublicディレクトリをドキュメントルートとして起動
php -S localhost:8000 -t public/ public/router.php
