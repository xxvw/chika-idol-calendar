<?php
// src/components/header.php - HTMLヘッダーコンポーネント

// $pageTitle 変数が設定されていない場合はデフォルト値を設定
if (!isset($pageTitle)) {
    $pageTitle = "IDOL CALENDAR";
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($pageTitle); ?></title>
</head>
<body>
