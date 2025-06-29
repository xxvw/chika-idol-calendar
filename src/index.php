<?php
// src/index.php - PHPバックエンドの例

// PHPのビルトインウェブサーバーでpublicディレクトリをドキュメントルートに設定した場合、
// このファイルは直接アクセスされるのではなく、public/index.phpとしてルーティングされることを想定しています。
// しかし、今回はpublic/index.htmlからリンクされるため、直接アクセスされることを想定します。

$pageTitle = "PHPスクリプト実行結果";
require_once __DIR__ . '/components/header.php';
?>
    <h1>test success</h1>
    <p>現在の時刻: <?php echo date('Y年m月d日 H時i分s秒'); ?></p>
    <p><a href="/index.html">トップページに戻る</a></p>
<?php require_once __DIR__ . '/components/footer.php'; ?>
