#!/bin/bash

echo "htdocsディレクトリをビルドします..."

# 既存のhtdocsディレクトリを削除
if [ -d "htdocs" ]; then
    echo "既存のhtdocsディレクトリを削除します..."
    rm -rf htdocs
fi

# 新しくhtdocsディレクトリを作成
echo "htdocsディレクトリを作成します..."
mkdir htdocs

# publicディレクトリの内容をhtdocsにコピー
echo "publicディレクトリの内容をhtdocsにコピーします..."
cp -r public/* htdocs/

# srcディレクトリのPHPファイルをhtdocsにコピー
echo "srcディレクトリのPHPファイルをhtdocsにコピーします..."
cp -r src/* htdocs/

# htdocs/index.php のパスを修正 (src/index.php を htdocs/index.php として読み込むため)
# sed -i '' はmacOSの場合のオプション
# sed -i はGNU sedの場合のオプション
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|__DIR__ . '\''/../src/index.php'\''|__DIR__ . '\''/index.php'\''|g' htdocs/index.php
else
    sed -i 's|__DIR__ . '\''/../src/index.php'\''|__DIR__ . '\''/index.php'\''|g' htdocs/index.php
fi

# htdocs/router.php のパスを修正 (htdocs/index.php を読み込むため)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|__DIR__ . '\''/index.php'\''|__DIR__ . '\''/index.php'\''|g' htdocs/router.php
else
    sed -i 's|__DIR__ . '\''/index.php'\''|__DIR__ . '\''/index.php'\''|g' htdocs/router.php
fi

# htdocs/index.php 内のコンポーネントパスを修正 (src/components を htdocs/components として読み込むため)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|__DIR__ . '\''/components/header.php'\''|__DIR__ . '\''/components/header.php'\''|g' htdocs/index.php
    sed -i '' 's|__DIR__ . '\''/components/footer.php'\''|__DIR__ . '\''/components/footer.php'\''|g' htdocs/index.php
else
    sed -i 's|__DIR__ . '\''/components/header.php'\''|__DIR__ . '\''/components/header.php'\''|g' htdocs/index.php
    sed -i 's|__DIR__ . '\''/components/footer.php'\''|__DIR__ . '\''/components/footer.php'\''|g' htdocs/index.php
fi

echo "ビルドが完了しました。htdocsディレクトリを確認してください。"
