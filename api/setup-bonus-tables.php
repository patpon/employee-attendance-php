<?php
// ============================================================
// Setup Bonus Tables - Run once to create bonus_records and behavior_logs
// Access: https://your-domain.com/api/setup-bonus-tables.php
// DELETE this file after running!
// ============================================================
require_once __DIR__ . '/config.php';
requireRole(['admin']);

$db = getDB();
$results = [];

$sql1 = "CREATE TABLE IF NOT EXISTS `bonus_records` (
  `id`                 VARCHAR(30)   NOT NULL,
  `employeeId`         VARCHAR(30)   NOT NULL,
  `empCode`            VARCHAR(255)  NOT NULL,
  `empName`            VARCHAR(255)  NOT NULL,
  `shopId`             VARCHAR(30)   NOT NULL,
  `year`               INT           NOT NULL,
  `photo`              MEDIUMTEXT    DEFAULT NULL,
  `bonusAmount`        DECIMAL(10,2) NOT NULL DEFAULT 0,
  `bonusStatus`        VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `summary`            TEXT          DEFAULT NULL,
  `attendanceSummary`  JSON          DEFAULT NULL,
  `createdAt`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `bonus_records_emp_year_key` (`employeeId`, `year`),
  INDEX `bonus_records_year_idx` (`shopId`, `year`),
  CONSTRAINT `bonus_records_employeeId_fkey`
    FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

$sql2 = "CREATE TABLE IF NOT EXISTS `behavior_logs` (
  `id`             VARCHAR(30)  NOT NULL,
  `bonusRecordId`  VARCHAR(30)  NOT NULL,
  `type`           VARCHAR(10)  NOT NULL COMMENT 'good or bad',
  `date`           VARCHAR(10)  NOT NULL,
  `description`    TEXT         NOT NULL,
  `createdAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `behavior_logs_bonus_idx` (`bonusRecordId`),
  CONSTRAINT `behavior_logs_bonusRecordId_fkey`
    FOREIGN KEY (`bonusRecordId`) REFERENCES `bonus_records` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

try {
    $db->exec($sql1);
    $results[] = ['table' => 'bonus_records', 'status' => 'OK'];
} catch (Exception $e) {
    $results[] = ['table' => 'bonus_records', 'status' => 'ERROR', 'message' => $e->getMessage()];
}

try {
    $db->exec($sql2);
    $results[] = ['table' => 'behavior_logs', 'status' => 'OK'];
} catch (Exception $e) {
    $results[] = ['table' => 'behavior_logs', 'status' => 'ERROR', 'message' => $e->getMessage()];
}

jsonResponse(['setup' => 'complete', 'results' => $results]);
