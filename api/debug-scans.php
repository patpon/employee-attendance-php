<?php
// Debug: Show all scans for a specific empCode in a month
require_once __DIR__ . '/config.php';

$db = getDB();
$empCode = $_GET['empCode'] ?? '7';
$shopId = $_GET['shopId'] ?? DEFAULT_SHOP_ID;
$month = (int)($_GET['month'] ?? 2);
$year = (int)($_GET['year'] ?? 2026);

$stmt = $db->prepare('SELECT id, empCode, empName, date, time, timestamp, month, year, createdAt FROM raw_scans WHERE shopId = ? AND empCode = ? AND month = ? AND year = ? ORDER BY date, time');
$stmt->execute([$shopId, $empCode, $month, $year]);
$rows = $stmt->fetchAll();

header('Content-Type: application/json');
echo json_encode(['count' => count($rows), 'scans' => $rows], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
