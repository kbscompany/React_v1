CREATE DATABASE  IF NOT EXISTS `bakery_react` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `bakery_react`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: bakery_react
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_notifications`
--

DROP TABLE IF EXISTS `admin_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_type` enum('cheque_edit','cheque_cancel','cheque_status_change','suspicious_activity') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cheque_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `priority` enum('low','medium','high','critical') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `is_read` tinyint(1) DEFAULT '0',
  `read_by` int DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `read_by` (`read_by`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_notification_type` (`notification_type`),
  CONSTRAINT `admin_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admin_notifications_ibfk_2` FOREIGN KEY (`read_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_notifications`
--

LOCK TABLES `admin_notifications` WRITE;
/*!40000 ALTER TABLE `admin_notifications` DISABLE KEYS */;
INSERT INTO `admin_notifications` VALUES (1,'cheque_edit','Cheque #126 Allocated','Cheque #126 has been allocated to Kbs Marketing Sara (Marketing) with amount 5000.00',52,1,'medium',1,1,'2025-05-29 20:47:28','2025-05-29 17:01:28',NULL),(2,'cheque_cancel','Cheque #125 Cancelled','User admin cancelled cheque #125. Reason: creation mistake',51,1,'high',0,NULL,NULL,'2025-05-29 22:05:23','{\"reason\": \"creation mistake\", \"cancelled_by\": \"admin\", \"cheque_number\": \"125\"}'),(3,'cheque_edit','New Expense Created - Cheque #127','New expense of 200.00 created for Finance department. Cheque #127 issued to Test entity',53,1,'medium',0,NULL,NULL,'2025-05-30 09:55:54',NULL),(4,'cheque_edit','New Expense Created - Cheque #128','New expense of 200.00 created for Finance department. Cheque #128 issued to Test entity',54,1,'medium',0,NULL,NULL,'2025-05-30 09:57:09',NULL),(5,'cheque_edit','Cheque #20 Allocated','Cheque #20 has been allocated to ahmed mohamed (sales) with amount 10000.00',77,1,'medium',0,NULL,NULL,'2025-06-01 09:53:31',NULL),(6,'cheque_edit','New Expense Created - Cheque #26','New expense of 100.00 created for Finance department. Cheque #26 issued to cairo electrictgy',83,1,'medium',0,NULL,NULL,'2025-06-01 10:10:57',NULL),(7,'cheque_edit','New Expense Created - Cheque #21','New expense of 100.00 created for Finance department. Cheque #21 issued to cairo electrictgy',78,1,'medium',0,NULL,NULL,'2025-06-01 10:15:04',NULL),(8,'cheque_edit','Expense Logged Against Cheque #126','Expense of 1200.00 logged against cheque #126 to ahmed test. Remaining amount: 3700.00',52,1,'medium',0,NULL,NULL,'2025-06-01 11:41:09',NULL),(9,'cheque_edit','Expense Logged Against Cheque #126','Expense of 200.00 logged against cheque #126 to ajhmed. Remaining amount: 3500.00',52,1,'medium',0,NULL,NULL,'2025-06-01 11:46:46',NULL),(10,'cheque_edit','Expense Logged Against Cheque #126','Expense of 100.00 logged against cheque #126 to sad. Remaining amount: 3400.00',52,1,'medium',0,NULL,NULL,'2025-06-01 11:47:43',NULL),(11,'cheque_edit','Expense Logged Against Cheque #126','Expense of 2000.00 logged against cheque #126 to fdsaf. Remaining amount: 1400.00',52,1,'medium',0,NULL,NULL,'2025-06-01 11:54:55',NULL),(12,'cheque_edit','Expense Logged Against Cheque #126','Expense of 1500.00 logged against cheque #126 to Kbs Marketing Saradsfasd. Cheque fully spent and closed',52,1,'medium',0,NULL,NULL,'2025-06-01 12:05:00',NULL),(13,'cheque_edit','Expense Logged Against Cheque #20','Expense of 9800.00 logged against cheque #20 to ahmed mohamed. Cheque overspent! Excess amount: 100.00',77,1,'medium',0,NULL,NULL,'2025-06-01 12:07:35',NULL),(14,'cheque_status_change','Cheque #20 Settled with Excess','Cheque #20 settled. Excess amount 100.00 moved to new cheque #1231',77,1,'medium',0,NULL,NULL,'2025-06-01 12:12:12',NULL);
/*!40000 ALTER TABLE `admin_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_configurations`
--

DROP TABLE IF EXISTS `api_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_configurations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `config_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_encrypted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`),
  KEY `idx_key` (`config_key`),
  KEY `idx_type` (`config_type`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_configurations`
--

LOCK TABLES `api_configurations` WRITE;
/*!40000 ALTER TABLE `api_configurations` DISABLE KEYS */;
INSERT INTO `api_configurations` VALUES (1,'foodics_sync_interval','3600','integer','Foodics sync interval in seconds',0,'2025-06-13 11:51:29','2025-06-13 11:51:29',1),(2,'max_search_results','100','integer','Maximum search results per query',0,'2025-06-13 11:51:29','2025-06-13 11:51:29',1),(3,'api_rate_limit_per_hour','1000','integer','API requests per hour per user',0,'2025-06-13 11:51:29','2025-06-13 11:51:29',1),(4,'webhook_retry_attempts','3','integer','Number of webhook retry attempts',0,'2025-06-13 11:51:29','2025-06-13 11:51:29',1),(5,'system_timezone','UTC','string','System default timezone',0,'2025-06-13 11:51:29','2025-06-13 11:51:29',1),(6,'enable_detailed_logging','true','boolean','Enable detailed API logging',0,'2025-06-13 11:51:29','2025-06-13 11:51:29',1),(7,'auto_sync_enabled','true','boolean','Enable automatic inventory sync',0,'2025-06-13 11:51:29','2025-06-13 11:51:29',1),(8,'low_stock_threshold','10','decimal','Default low stock threshold',0,'2025-06-13 11:51:29','2025-06-13 11:51:29',1),(17,'foodics_read_only_mode','true','boolean','Enable read-only mode for Foodics integration',0,'2025-06-13 12:02:23','2025-06-13 12:02:23',1),(18,'foodics_default_branch_id','','string','Default Foodics branch for direct integration',0,'2025-06-13 12:02:23','2025-06-13 12:02:23',1),(19,'foodics_default_branch_name','','string','Default Foodics branch name',0,'2025-06-13 12:02:23','2025-06-13 12:02:23',1),(52,'cheque_field_positions','{\"issued_to\": [480, 190], \"date\": [523, 223], \"amount_numbers\": [525, 120], \"amount_words\": [510, 160], \"expense_description\": [150, 500], \"payee_notice\": [180, 240], \"company_copy_header\": [300, 760], \"recipient_copy_header\": [300, 460], \"server_date\": [50, 580], \"print_date\": [250, 580], \"expense_number\": [450, 580], \"reference_number\": [50, 550], \"account_code\": [250, 550], \"department\": [450, 550]}','string','Default PDF field coordinates for cheques',0,'2025-06-15 11:08:31','2025-06-17 06:42:21',NULL);
/*!40000 ALTER TABLE `api_configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_usage_logs`
--

DROP TABLE IF EXISTS `api_usage_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_usage_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `response_status` int DEFAULT NULL,
  `response_time_ms` int DEFAULT NULL,
  `request_size` int DEFAULT NULL,
  `response_size` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_endpoint` (`endpoint`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`response_status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_usage_logs`
--

LOCK TABLES `api_usage_logs` WRITE;
/*!40000 ALTER TABLE `api_usage_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_usage_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `po_id` int DEFAULT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `safe_id` int DEFAULT NULL,
  `expense_id` int DEFAULT NULL,
  `entity_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNKNOWN',
  `cheque_id` int DEFAULT NULL,
  `old_values` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `new_values` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_po_id` (`po_id`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'1','CREATE',NULL,NULL,'2025-06-09 11:29:04',NULL,NULL,1,43,'EXPENSE',89,NULL,'{\"cheque_id\":89,\"category_id\":17,\"amount\":\"99.97\",\"description\":\"dsd\",\"expense_date\":\"2025-06-09T00:00:00\",\"notes\":\"\"}','Created expense: dsd - Amount: 99.97'),(2,'1','CREATE',NULL,NULL,'2025-06-09 11:29:29',NULL,NULL,1,44,'EXPENSE',89,NULL,'{\"cheque_id\":89,\"category_id\":23,\"amount\":\"100\",\"description\":\"يسيسبسي\",\"expense_date\":\"2025-06-09T00:00:00\",\"notes\":\"\"}','Created expense: يسيسبسي - Amount: 100'),(3,'1','CREATE',NULL,NULL,'2025-06-09 13:38:20',NULL,NULL,1,45,'EXPENSE',89,NULL,'{\"cheque_id\":89,\"category_id\":21,\"amount\":\"100\",\"description\":\"سشس\",\"expense_date\":\"2025-06-09T00:00:00\",\"notes\":null}','Created expense: سشس - Amount: 100');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_account_access`
--

DROP TABLE IF EXISTS `bank_account_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_account_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `role_id` int NOT NULL,
  `access_type` enum('view','use','manage','full') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'view',
  `granted_by` int DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_account_role_access` (`account_id`,`role_id`),
  KEY `granted_by` (`granted_by`),
  KEY `idx_role_access` (`role_id`,`access_type`),
  CONSTRAINT `bank_account_access_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bank_account_access_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bank_account_access_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_account_access`
--

LOCK TABLES `bank_account_access` WRITE;
/*!40000 ALTER TABLE `bank_account_access` DISABLE KEYS */;
INSERT INTO `bank_account_access` VALUES (2,2,1,'full',1,'2025-06-04 22:34:52');
/*!40000 ALTER TABLE `bank_account_access` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_accounts`
--

DROP TABLE IF EXISTS `bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bank_id` int NOT NULL,
  `account_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_type` enum('checking','savings','business','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'checking',
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'SAR',
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `can_issue_cheques` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bank_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unknown Bank',
  `branch` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bank_account` (`bank_id`,`account_number`),
  KEY `created_by` (`created_by`),
  KEY `idx_account_number` (`account_number`),
  KEY `idx_bank_id` (`bank_id`),
  KEY `idx_account_active` (`is_active`),
  CONSTRAINT `bank_accounts_ibfk_1` FOREIGN KEY (`bank_id`) REFERENCES `banks` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `bank_accounts_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_accounts`
--

LOCK TABLES `bank_accounts` WRITE;
/*!40000 ALTER TABLE `bank_accounts` DISABLE KEYS */;
INSERT INTO `bank_accounts` VALUES (2,2,'1839233','Running','business','EGP',100000.00,100000.00,NULL,1,1,1,'2025-06-04 22:34:52','2025-06-20 20:40:29','ALEX BANK',NULL),(4,2,'TEST12345','Test Account','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 20:22:25','2025-06-20 20:40:29','ALEX BANK','Main Branch'),(5,2,'932392032','جاري','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 20:23:44','2025-06-20 20:40:29','ALEX BANK',NULL),(6,2,'3243243','لشقغ','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 20:34:26','2025-06-20 20:40:29','ALEX BANK',NULL),(7,2,'TEST1750451892','Test Account New','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 20:38:14','2025-06-20 20:40:29','ALEX BANK','Main Branch'),(8,2,'CONSISTENT12345','Test Consistent Account','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 20:41:14','2025-06-20 20:41:14','ALEX BANK','Main'),(9,2,'899098990','uiol','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 20:43:58','2025-06-20 20:43:58','ALEX BANK',NULL),(10,2,'3242343','dsfasd','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 21:00:15','2025-06-20 21:00:15','ALEX BANK',NULL),(11,2,'432424','dsfs','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 21:10:18','2025-06-20 21:10:18','ALEX BANK',NULL),(12,2,'DEBUG-10','Test Debug Account','checking','SAR',0.00,0.00,NULL,1,1,NULL,'2025-06-20 21:14:07','2025-06-20 21:14:07','ALEX BANK','Test Branch'),(13,2,'DIRECT-TEST-001','Direct Test Account','checking','SAR',0.00,0.00,NULL,1,1,1,'2025-06-20 21:14:47','2025-06-20 21:14:47','ALEX BANK','Test');
/*!40000 ALTER TABLE `bank_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banks`
--

DROP TABLE IF EXISTS `banks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `swift_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `created_by` (`created_by`),
  KEY `idx_bank_name` (`name`),
  KEY `idx_bank_active` (`is_active`),
  CONSTRAINT `banks_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banks`
--

LOCK TABLES `banks` WRITE;
/*!40000 ALTER TABLE `banks` DISABLE KEYS */;
INSERT INTO `banks` VALUES (2,'ALEX BANK',NULL,NULL,NULL,NULL,NULL,1,1,'2025-06-04 22:34:19','2025-06-04 22:34:19'),(3,'National Bank of Egypt','Main Branch','NBEGEGCX','Cairo, Egypt','','',1,NULL,'2025-06-20 21:08:50','2025-06-20 21:08:50'),(4,'Commercial International Bank','Headquarters','CIBEEGCX','Giza, Egypt','','',1,NULL,'2025-06-20 21:08:59','2025-06-20 21:08:59'),(5,'QNB Alahli','Central Branch','QNBAEGCX','Cairo, Egypt','','',1,NULL,'2025-06-20 21:09:01','2025-06-20 21:09:01');
/*!40000 ALTER TABLE `banks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batch_session_items`
--

DROP TABLE IF EXISTS `batch_session_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_session_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `cake_id` int NOT NULL,
  `quantity` decimal(10,5) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `cake_id` (`cake_id`),
  CONSTRAINT `batch_session_items_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `batch_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `batch_session_items_ibfk_2` FOREIGN KEY (`cake_id`) REFERENCES `cakes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_session_items`
--

LOCK TABLES `batch_session_items` WRITE;
/*!40000 ALTER TABLE `batch_session_items` DISABLE KEYS */;
INSERT INTO `batch_session_items` VALUES (1,1,35,5.00000),(2,1,1,5.00000),(3,1,16,5.00000),(8,2,35,6.00000),(9,2,1,5.00000),(10,2,16,7.00000),(11,3,35,6.00000),(12,3,1,5.00000),(13,3,16,7.00000),(14,3,22,8.00000),(15,3,41,9.00000),(16,3,10,10.00000),(17,4,35,6.00000),(18,4,1,5.00000),(19,4,16,7.00000),(20,4,22,10.00000),(21,4,41,11.00000),(22,4,10,12.00000),(23,5,35,6.00000),(24,5,1,5.00000),(25,5,16,7.00000),(26,5,22,10.00000),(27,5,41,11.00000),(28,5,10,12.00000),(29,5,9,32.00000),(30,5,14,25.00000),(31,5,15,324.00000),(32,5,44,23.00000),(33,5,36,10.00000),(35,6,35,15.00000);
/*!40000 ALTER TABLE `batch_session_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batch_sessions`
--

DROP TABLE IF EXISTS `batch_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `total_cost` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session_name` (`session_name`,`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_sessions`
--

LOCK TABLES `batch_sessions` WRITE;
/*!40000 ALTER TABLE `batch_sessions` DISABLE KEYS */;
INSERT INTO `batch_sessions` VALUES (1,'Test session save',1,'2025-05-28 13:44:14','2025-05-28 13:44:14','foodics test ',7014.03),(2,'test',1,'2025-05-28 14:12:48','2025-05-28 14:15:46','tsts',0.00),(3,'new test test ',1,'2025-05-28 14:16:47','2025-05-28 14:16:47','tda',0.00),(4,'new test test very',1,'2025-05-28 14:19:15','2025-05-28 14:19:15','tda',0.00),(5,'new test test very May26',1,'2025-05-28 14:20:29','2025-05-28 14:20:29','tda',0.00),(6,'test marina ',1,'2025-06-03 12:16:25','2025-06-03 12:17:10','',0.00);
/*!40000 ALTER TABLE `batch_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bulk_session_items`
--

DROP TABLE IF EXISTS `bulk_session_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulk_session_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `bulk_session_items_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `bulk_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulk_session_items`
--

LOCK TABLES `bulk_session_items` WRITE;
/*!40000 ALTER TABLE `bulk_session_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `bulk_session_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bulk_sessions`
--

DROP TABLE IF EXISTS `bulk_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulk_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `production_type` enum('mid_prep','sub_recipe','cake') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session` (`session_name`,`production_type`,`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulk_sessions`
--

LOCK TABLES `bulk_sessions` WRITE;
/*!40000 ALTER TABLE `bulk_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `bulk_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cake_batches`
--

DROP TABLE IF EXISTS `cake_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cake_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cake_id` int DEFAULT NULL,
  `quantity_produced` float DEFAULT NULL,
  `warehouse_id` int DEFAULT NULL,
  `produced_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cake_id` (`cake_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `cake_batches_ibfk_1` FOREIGN KEY (`cake_id`) REFERENCES `cakes` (`id`),
  CONSTRAINT `cake_batches_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cake_batches`
--

LOCK TABLES `cake_batches` WRITE;
/*!40000 ALTER TABLE `cake_batches` DISABLE KEYS */;
INSERT INTO `cake_batches` VALUES (1,1,1,2,'2025-05-28 17:17:26'),(2,39,1,2,'2025-05-28 17:17:26'),(3,1,1,2,'2025-05-28 20:02:19'),(4,1,1,2,'2025-05-28 20:05:18'),(5,1,1,2,'2025-05-28 20:18:23'),(6,1,1,2,'2025-05-28 20:41:17'),(7,1,1,2,'2025-05-28 20:56:44'),(8,1,1,2,'2025-05-29 11:54:55'),(9,1,1,2,'2025-05-30 09:53:53');
/*!40000 ALTER TABLE `cake_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cake_ingredients`
--

DROP TABLE IF EXISTS `cake_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cake_ingredients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cake_id` int NOT NULL,
  `ingredient_or_subrecipe_id` int NOT NULL,
  `is_subrecipe` tinyint NOT NULL DEFAULT '0',
  `quantity` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=382 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cake_ingredients`
--

LOCK TABLES `cake_ingredients` WRITE;
/*!40000 ALTER TABLE `cake_ingredients` DISABLE KEYS */;
INSERT INTO `cake_ingredients` VALUES (11,2,1,1,1.50),(12,2,2,1,1.16),(13,3,1,1,0.70),(14,3,2,1,0.63),(15,4,3,1,0.08),(16,4,4,1,0.60),(17,4,5,1,0.60),(18,4,7,1,0.04),(19,4,6,1,0.06),(20,4,64,0,0.10),(21,4,9,1,0.12),(22,4,11,1,0.15),(23,4,8,1,0.30),(24,4,77,0,0.02),(25,5,4,1,0.16),(26,5,5,1,0.10),(27,5,64,0,0.06),(28,6,15,1,1.00),(29,6,16,1,0.20),(30,6,17,1,1.50),(31,6,18,1,0.08),(32,6,19,1,0.15),(33,7,20,1,1.39),(34,7,70,0,0.01),(35,7,82,0,0.01),(36,7,84,0,0.00),(37,7,83,0,0.20),(38,8,20,1,0.17),(39,8,82,0,0.00),(40,8,84,0,0.00),(41,8,83,0,0.03),(42,9,22,1,1.06),(43,9,54,0,0.37),(44,9,27,1,0.30),(45,9,21,1,0.40),(46,9,23,1,0.50),(47,10,22,1,0.18),(48,10,21,1,0.12),(49,11,54,0,0.60),(50,11,25,1,0.08),(51,11,26,1,0.18),(52,11,27,1,1.00),(53,12,28,1,0.15),(54,12,54,0,0.60),(55,12,27,1,1.00),(56,12,59,0,0.02),(57,12,84,0,0.01),(58,12,82,0,0.00),(59,13,54,0,0.60),(60,13,27,1,1.00),(61,13,29,1,0.15),(62,13,40,0,0.01),(63,14,54,0,0.60),(64,14,27,1,1.00),(65,14,70,0,0.10),(66,14,88,0,0.75),(67,14,77,0,0.01),(68,15,54,0,0.60),(69,15,27,1,1.00),(70,15,58,0,0.10),(71,15,87,0,0.05),(72,15,84,0,0.01),(73,15,82,0,0.00),(74,16,30,1,1.04),(75,17,30,1,0.35),(76,18,31,1,0.12),(77,18,61,0,0.12),(78,18,62,0,0.01),(79,19,2,0,0.03),(80,19,60,0,0.03),(81,19,14,0,0.01),(82,19,11,0,0.01),(83,19,9,0,0.00),(84,19,4,0,0.00),(85,19,23,0,0.04),(86,19,22,0,0.03),(87,20,1,1,1.20),(88,20,2,1,0.89),(89,21,1,1,1.20),(90,21,2,1,0.90),(91,22,5,1,0.90),(92,22,4,1,0.70),(93,22,9,1,0.20),(94,22,33,1,0.14),(95,23,54,0,0.10),(96,23,25,1,0.01),(97,23,27,1,0.17),(98,23,70,0,0.02),(99,23,34,1,0.18),(100,23,77,0,0.01),(101,24,54,0,0.10),(102,24,25,1,0.01),(103,24,27,1,0.17),(104,24,70,0,0.02),(105,24,77,0,0.01),(106,24,35,1,0.14),(107,25,38,1,0.40),(108,25,39,1,0.26),(109,25,42,1,0.04),(110,25,43,1,0.08),(111,25,90,0,0.05),(112,26,38,1,0.40),(113,26,39,1,0.26),(114,26,44,1,0.05),(115,26,88,0,0.20),(116,26,77,0,0.02),(117,27,99,0,28.00),(118,27,100,0,28.00),(119,27,54,1,0.06),(120,27,56,1,0.06),(121,27,65,0,0.05),(122,27,31,0,0.02),(123,27,57,1,0.06),(124,27,77,0,0.04),(125,27,105,0,0.10),(126,28,99,0,48.00),(127,28,100,0,48.00),(128,28,54,1,0.09),(129,28,56,1,0.06),(130,28,65,0,0.07),(131,28,31,0,0.02),(132,28,57,1,0.09),(133,28,77,0,0.08),(134,28,105,0,0.14),(135,29,61,1,1.30),(136,29,62,1,0.25),(137,29,95,0,0.12),(138,30,61,1,1.40),(139,30,95,0,0.12),(140,31,111,0,0.38),(141,31,95,0,0.04),(142,31,91,0,0.26),(143,31,64,1,0.50),(144,31,63,1,0.22),(145,31,84,0,0.02),(146,32,59,1,0.95),(147,32,58,1,0.60),(148,32,60,1,0.35),(149,32,91,0,0.01),(150,32,84,0,0.02),(151,33,42,0,0.00),(152,34,38,1,0.80),(153,34,39,1,0.38),(154,34,44,1,0.09),(155,34,88,0,0.30),(156,34,77,0,0.02),(157,35,38,1,0.80),(158,35,39,1,0.38),(159,35,42,1,0.06),(160,35,43,1,0.10),(161,35,90,0,0.10),(162,36,40,1,0.30),(163,36,67,1,0.60),(164,36,41,1,0.30),(165,36,20,0,0.01),(166,36,77,0,0.02),(167,37,30,1,0.35),(168,37,2,0,0.03),(169,37,60,0,0.03),(170,37,14,0,0.01),(171,37,11,0,0.01),(172,37,9,0,0.00),(173,37,4,0,0.00),(174,37,23,0,0.04),(175,37,22,0,0.03),(176,37,31,1,0.12),(177,37,61,0,0.12),(178,37,62,0,0.01),(179,38,2,0,0.02),(180,38,60,0,0.02),(181,38,14,0,0.01),(182,38,11,0,0.01),(183,38,9,0,0.00),(184,38,4,0,0.00),(185,38,23,0,0.02),(186,38,22,0,0.02),(187,39,30,1,0.25),(188,40,47,1,2.11),(189,40,48,1,0.45),(190,40,49,1,0.15),(191,40,90,0,0.02),(192,40,112,0,0.02),(193,41,47,1,0.26),(194,41,48,1,0.06),(195,41,49,1,0.02),(196,41,90,0,0.00),(197,41,112,0,0.00),(198,42,35,0,0.17),(199,42,20,0,0.00),(200,42,43,0,0.00),(201,42,23,0,0.03),(202,42,22,0,0.02),(203,42,31,0,0.01),(204,43,35,0,0.14),(205,43,3,0,0.03),(206,43,48,0,0.01),(207,43,46,0,0.00),(208,43,47,0,0.00),(209,43,20,0,0.01),(210,43,23,0,0.03),(211,43,22,0,0.01),(212,43,19,0,0.02),(213,44,35,0,0.17),(214,44,48,0,0.01),(215,44,32,0,0.01),(216,44,47,0,0.00),(217,44,19,0,0.03),(218,44,3,0,0.03),(219,44,44,0,0.01),(220,45,65,0,0.13),(221,45,26,0,0.07),(222,45,51,0,0.01),(223,45,29,0,0.00),(224,45,3,0,0.04),(225,45,32,0,0.00),(226,31,15,0,0.04),(227,30,15,0,0.12),(228,29,15,0,0.12),(229,46,38,1,0.09),(230,46,39,1,0.03),(231,46,44,1,0.02),(232,46,77,0,0.02),(233,47,38,1,0.09),(234,47,39,1,0.03),(235,47,42,1,0.03),(236,47,90,0,0.02),(238,22,8,1,0.35),(239,48,38,1,0.03),(240,48,39,1,0.01),(242,48,61,0,0.01),(243,48,62,0,0.00),(244,49,38,1,0.03),(245,49,39,1,0.01),(246,50,54,0,0.05),(247,50,25,1,0.01),(248,50,26,1,0.02),(249,50,27,1,0.08),(250,51,54,0,0.05),(251,51,27,1,0.08),(252,51,70,0,0.01),(253,51,88,0,0.06),(254,51,77,0,0.00),(255,52,54,0,0.05),(256,52,29,1,0.01),(257,52,27,1,0.08),(258,52,40,0,0.00),(259,53,54,0,0.05),(260,53,70,0,0.01),(261,53,27,1,0.08),(263,53,87,0,0.01),(264,54,54,0,0.05),(265,54,85,0,0.01),(266,54,27,1,0.08),(267,54,59,0,0.00),(268,55,40,1,0.45),(269,55,67,1,0.90),(270,55,41,1,0.45),(272,55,20,0,0.02),(273,55,77,0,0.02),(274,56,69,1,3.50),(275,56,60,0,0.50),(276,57,38,1,3.10),(277,57,39,1,1.60),(278,57,44,1,0.22),(279,57,77,0,0.32),(280,58,45,1,8.20),(283,58,46,1,14.00),(284,58,119,0,2.75),(285,58,77,0,0.50),(286,58,120,0,0.13),(287,58,81,0,0.13),(288,59,3,1,0.40),(289,59,4,1,1.00),(290,59,5,1,0.80),(291,59,6,1,0.12),(292,59,8,1,0.30),(293,59,23,0,0.10),(294,59,9,1,0.60),(295,59,11,1,0.14),(296,59,81,0,0.08),(297,60,3,1,0.90),(298,60,4,1,2.00),(299,60,5,1,1.80),(300,60,6,1,0.16),(301,60,8,1,0.50),(302,60,23,0,0.10),(303,60,9,1,1.00),(304,60,11,1,0.18),(305,60,81,0,0.10),(306,61,3,1,1.25),(307,61,4,1,2.90),(308,61,5,1,3.60),(309,61,6,1,0.20),(310,61,8,1,0.80),(311,61,23,0,0.10),(312,61,9,1,1.45),(313,61,11,1,0.24),(314,61,81,0,0.10),(315,62,70,1,0.02),(316,62,4,1,0.04),(317,62,5,1,0.01),(318,62,9,1,0.01),(319,62,77,0,0.00),(320,63,38,1,0.03),(321,63,39,1,0.01),(322,63,44,1,0.01),(323,63,77,0,0.01),(324,64,38,1,0.03),(325,64,39,1,0.01),(326,64,61,0,0.01),(327,64,62,0,0.00),(328,65,38,1,0.03),(329,65,39,1,0.01),(330,65,43,1,0.01),(331,65,90,0,0.01),(332,66,47,1,0.04),(333,66,48,1,0.01),(334,66,49,1,0.01),(335,66,112,0,0.01),(336,67,40,1,0.01),(337,67,67,1,0.04),(338,67,41,1,0.01),(339,67,58,0,0.01),(340,67,20,0,0.00),(341,67,77,0,0.01),(342,68,69,1,0.06),(343,68,60,0,0.01),(344,69,3,1,0.05),(345,69,9,1,0.02),(346,70,71,1,0.01),(347,70,72,1,0.02),(348,70,3,0,0.01),(349,70,31,0,0.02),(350,71,71,1,0.01),(351,71,4,1,0.03),(352,71,9,1,0.02),(353,72,71,1,0.01),(354,72,72,1,0.03),(355,72,87,0,0.00),(356,72,9,1,0.02),(357,72,84,0,0.00),(358,73,22,0,0.01),(359,73,23,0,0.00),(360,73,19,0,0.01),(361,73,32,0,0.00),(362,73,14,0,0.00),(363,73,20,0,0.00),(364,74,31,0,0.01),(365,74,87,0,0.00),(366,74,19,0,0.00),(367,74,14,0,0.00),(368,74,84,0,0.00),(369,75,22,0,0.02),(370,75,23,0,0.02),(371,75,14,0,0.01),(372,75,3,0,0.01),(373,75,2,0,0.03),(374,75,4,0,0.00),(375,75,34,0,0.00),(376,75,9,1,0.02),(379,1,51,0,0.50),(380,1,68,0,0.70),(381,1,48,1,0.00);
/*!40000 ALTER TABLE `cake_ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cake_mid_prep`
--

DROP TABLE IF EXISTS `cake_mid_prep`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cake_mid_prep` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cake_id` int DEFAULT NULL,
  `mid_prep_id` int DEFAULT NULL,
  `quantity` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cake_id` (`cake_id`),
  KEY `mid_prep_id` (`mid_prep_id`),
  CONSTRAINT `cake_mid_prep_ibfk_1` FOREIGN KEY (`cake_id`) REFERENCES `cakes` (`id`),
  CONSTRAINT `cake_mid_prep_ibfk_2` FOREIGN KEY (`mid_prep_id`) REFERENCES `mid_prep_recipes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cake_mid_prep`
--

LOCK TABLES `cake_mid_prep` WRITE;
/*!40000 ALTER TABLE `cake_mid_prep` DISABLE KEYS */;
INSERT INTO `cake_mid_prep` VALUES (2,1,3,0.2);
/*!40000 ALTER TABLE `cake_mid_prep` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cake_stock`
--

DROP TABLE IF EXISTS `cake_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cake_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cake_id` int DEFAULT NULL,
  `warehouse_id` int DEFAULT NULL,
  `quantity` float DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `cake_id` (`cake_id`,`warehouse_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `cake_stock_ibfk_1` FOREIGN KEY (`cake_id`) REFERENCES `cakes` (`id`),
  CONSTRAINT `cake_stock_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cake_stock`
--

LOCK TABLES `cake_stock` WRITE;
/*!40000 ALTER TABLE `cake_stock` DISABLE KEYS */;
INSERT INTO `cake_stock` VALUES (1,1,2,8),(2,39,2,1);
/*!40000 ALTER TABLE `cake_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cake_translations`
--

DROP TABLE IF EXISTS `cake_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cake_translations` (
  `cake_id` int NOT NULL,
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`cake_id`,`language`),
  CONSTRAINT `cake_translations_ibfk_1` FOREIGN KEY (`cake_id`) REFERENCES `cakes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cake_translations`
--

LOCK TABLES `cake_translations` WRITE;
/*!40000 ALTER TABLE `cake_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `cake_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cakes`
--

DROP TABLE IF EXISTS `cakes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cakes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `percent_yield` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cakes`
--

LOCK TABLES `cakes` WRITE;
/*!40000 ALTER TABLE `cakes` DISABLE KEYS */;
INSERT INTO `cakes` VALUES (1,'Test Updated Cake',95.00),(2,'Big Carrot Cake',5.00),(3,'Mini carrot cake',5.00),(4,'Mini chocolate praline cake',5.00),(5,'Chocolate pull me up',5.00),(6,'Chocolate High',5.00),(7,'Ghazal Beirut',5.00),(8,'Ghazal piece',5.00),(9,'Mango Flame Large ',5.00),(10,'Mango flame piece',5.00),(11,'Classic tres leches',5.00),(12,'rose water tres leches',5.00),(13,'coffee tres leches',5.00),(14,'Strawberry tres leches',5.00),(15,'Pistachio Tres leches',5.00),(16,'Brownies box',5.00),(17,'Brownie sleeve',5.00),(18,'Lotus cookies sleeve',5.00),(19,'Chocolate chewies',5.00),(20,'Carrot cake piece',5.00),(21,'Carrot Cake B2b',5.00),(22,'Chocolate Cake B2b',5.00),(23,'Tres Leche Vanilla Soft ',5.00),(24,'Tres Leche Mango Soft ',5.00),(25,'Mini Pecan toffee Cheesecake',5.00),(26,'Mini Strawberry & Berries cheesecake',5.00),(27,'Mini kunafa rings',3.00),(28,'Big Kunafa rings',3.00),(29,'Mix kahk',5.00),(30,'Plain kahk',5.00),(31,'Kunafa Cream',3.00),(32,'Maamoul',3.00),(33,'Mix box',0.00),(34,'Big strawberry & Berries cheesecake',5.00),(35,'Big Pecan cheesecake',5.00),(36,'Tiramisu',5.00),(37,'mix box 1',5.00),(38,'Chewies bag',3.00),(39,'Brownie bag',5.00),(40,'Golden date',5.00),(41,'Date cake piece',5.00),(42,'Hot chocolate',5.00),(43,'Chocolate Soft Serve Cup',5.00),(44,'Vanilla softserve cone',5.00),(45,'Mango soft serve',5.00),(46,'REACT TEST ',100.00),(47,'Pecan cheesecake piece',5.00),(48,'Cheese cake mini louts B2b',5.00),(49,'Cheese Cake Mini B2b',5.00),(50,'Tres Leches Classic Pieces Event',5.00),(51,'Tres Leches Strawberry Pieces Event',5.00),(52,'Tres Leches Coffee Pieces Event',4.99),(53,'Tres Leches Pistachio Pieces Event',5.00),(54,'Tres Leches Rose Water Pieces Event',5.00),(55,'Tiramisu Special Order Event',5.00),(56,'Creme Brulee display plate Event',5.00),(57,'Cheese Cake Mix Fruit Special 30 cm Event',5.00),(58,'Milfie Special 65 cm Event',5.00),(59,'Chocolate Cake Large 10 Pax Event',5.00),(60,'Chocolate Cake Large 20 Pax Event',5.00),(61,'Chocolate Cake Large 30 Pax Event',5.00),(62,'Chocolate Cake Piece Event',5.00),(63,'Cheese Cake Mix Fruit Event',5.00),(64,'Cheese Cake Lotus Event',5.00),(65,'Cheese Cake Pecan Event',5.00),(66,'Date Cake Piece Event',5.00),(67,'Tiramisu Shot glass Event',5.00),(68,'Creme Brulee Remican Event',5.00),(69,'Dakwaz Hazelnut Event',5.00),(70,'Profiterole Event',5.00),(71,'Éclair Chocolate Event',5.00),(72,'Éclair Pistachio Event',5.00),(73,'Chocolate Truffles Event',5.00),(74,'Pistachio Truffles Event ',5.00),(75,'Chocolate Mousse Event',5.00);
/*!40000 ALTER TABLE `cakes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Flour & Grains'),(2,'Dairy Products'),(3,'Spices & Seasonings'),(4,'Baking Supplies');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_translations`
--

DROP TABLE IF EXISTS `category_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_translations` (
  `category_id` int NOT NULL,
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`category_id`,`language`),
  CONSTRAINT `category_translations_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `inventory_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_translations`
--

LOCK TABLES `category_translations` WRITE;
/*!40000 ALTER TABLE `category_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheque_action_logs`
--

DROP TABLE IF EXISTS `cheque_action_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheque_action_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `action_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `new_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cheque_id` (`cheque_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheque_action_logs`
--

LOCK TABLES `cheque_action_logs` WRITE;
/*!40000 ALTER TABLE `cheque_action_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `cheque_action_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheque_audit_log`
--

DROP TABLE IF EXISTS `cheque_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheque_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_id` int NOT NULL,
  `cheque_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_type` enum('create','edit','cancel','status_change','amount_set') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `new_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user_id` int NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `hostname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_cheque_id` (`cheque_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_timestamp` (`action_timestamp`),
  KEY `idx_action_type` (`action_type`),
  CONSTRAINT `cheque_audit_log_ibfk_1` FOREIGN KEY (`cheque_id`) REFERENCES `department_safe_cheques_old` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cheque_audit_log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheque_audit_log`
--

LOCK TABLES `cheque_audit_log` WRITE;
/*!40000 ALTER TABLE `cheque_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `cheque_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheque_books`
--

DROP TABLE IF EXISTS `cheque_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheque_books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_number` varchar(50) NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `cheque_number` (`cheque_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheque_books`
--

LOCK TABLES `cheque_books` WRITE;
/*!40000 ALTER TABLE `cheque_books` DISABLE KEYS */;
/*!40000 ALTER TABLE `cheque_books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheque_screenshots`
--

DROP TABLE IF EXISTS `cheque_screenshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheque_screenshots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_id` int NOT NULL,
  `screenshot_data` longtext NOT NULL COMMENT 'Base64 encoded image data',
  `description` text,
  `uploaded_by` varchar(100) NOT NULL,
  `upload_date` datetime NOT NULL,
  `file_size` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cheque_id` (`cheque_id`),
  KEY `idx_upload_date` (`upload_date`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  KEY `idx_cheque_screenshots_cheque_upload` (`cheque_id`,`upload_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores screenshots required for cheque cancellations';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheque_screenshots`
--

LOCK TABLES `cheque_screenshots` WRITE;
/*!40000 ALTER TABLE `cheque_screenshots` DISABLE KEYS */;
/*!40000 ALTER TABLE `cheque_screenshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheque_settlements`
--

DROP TABLE IF EXISTS `cheque_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheque_settlements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_id` int NOT NULL,
  `settlement_type` enum('early_settlement','excess_coverage') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deposit_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deposit_amount` decimal(10,2) DEFAULT NULL,
  `deposit_date` date DEFAULT NULL,
  `bank_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `settled_by` int NOT NULL,
  `settled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `settled_by` (`settled_by`),
  KEY `idx_cheque_id` (`cheque_id`),
  KEY `idx_settlement_type` (`settlement_type`),
  KEY `idx_settled_at` (`settled_at`),
  CONSTRAINT `cheque_settlements_ibfk_2` FOREIGN KEY (`settled_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cheque_settlements_cheque` FOREIGN KEY (`cheque_id`) REFERENCES `cheques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheque_settlements`
--

LOCK TABLES `cheque_settlements` WRITE;
/*!40000 ALTER TABLE `cheque_settlements` DISABLE KEYS */;
INSERT INTO `cheque_settlements` VALUES (4,89,'excess_coverage',NULL,NULL,NULL,NULL,NULL,'Excess covered by new cheque #1026. ',1,'2025-06-05 21:21:03','2025-06-05 21:21:03');
/*!40000 ALTER TABLE `cheque_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheques`
--

DROP TABLE IF EXISTS `cheques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheques` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,4) DEFAULT NULL,
  `issued_to` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Unallocated',
  `department` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payer_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `due_date` date DEFAULT NULL,
  `issued_date` date DEFAULT NULL,
  `status` enum('open','active','settled','overspent','refunded','cancelled','closed','pending','cleared','bounced','issued','assigned','settled_pending_invoice','created') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'created',
  `closing_remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `safe_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bank_account_id` int DEFAULT NULL,
  `bank_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `overspent_amount` decimal(12,2) DEFAULT '0.00',
  `settlement_date` datetime DEFAULT NULL,
  `is_settled` tinyint(1) DEFAULT '0',
  `is_supplier_payment` tinyint(1) DEFAULT '0',
  `supplier_invoice_uploaded` tinyint(1) DEFAULT '0',
  `supplier_invoice_file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_invoice_upload_date` datetime DEFAULT NULL,
  `supplier_invoice_uploaded_by` int DEFAULT NULL,
  `assigned_by` int DEFAULT NULL,
  `is_assigned_to_safe` tinyint(1) DEFAULT '0',
  `total_expenses` decimal(12,2) DEFAULT '0.00',
  `settled_by_cheque_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cheques_number` (`cheque_number`),
  KEY `idx_cheques_status` (`status`),
  KEY `idx_cheques_safe` (`safe_id`),
  KEY `idx_cheques_issue_date` (`issue_date`),
  KEY `idx_cheques_department` (`department`),
  KEY `idx_cheque_bank_account` (`bank_account_id`),
  KEY `fk_cheques_invoice_uploader` (`supplier_invoice_uploaded_by`),
  CONSTRAINT `cheques_ibfk_1` FOREIGN KEY (`safe_id`) REFERENCES `safes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cheque_bank_account` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `fk_cheques_invoice_uploader` FOREIGN KEY (`supplier_invoice_uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=219 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheques`
--

LOCK TABLES `cheques` WRITE;
/*!40000 ALTER TABLE `cheques` DISABLE KEYS */;
INSERT INTO `cheques` VALUES (89,'1001',5500.0000,'kabnoury ','Finance','dsfsd','2025-06-07 20:17:57','2025-06-05','2025-06-05','settled','Excess covered by cheque #1006 (Amount: $300.0) | Excess covered by cheque #1007 (Amount: $300.0)','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-23 20:02:30',2,'ALEX BANK','1839233',NULL,0.00,'2025-06-23 22:02:30',1,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(90,'1002',5500.0000,'kabnoury ','fsdf','fdsfsd','2025-06-07 20:17:57','2025-06-05','2025-06-05','settled',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-23 20:03:00',2,'ALEX BANK','1839233',NULL,0.00,'2025-06-23 22:03:00',1,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(91,'1003',5500.0000,'kabnoury ','Finance',NULL,'2025-06-07 20:17:57','2025-06-05','2025-06-05','assigned','Assigned for excess from cheque #1001 - Excess amount from cheque #1001','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 11:31:25',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(92,'1004',100.0000,'kabnoury ','Finance',NULL,NULL,'2025-06-05','2025-06-05','assigned','Assigned for excess from cheque #1001 - Excess amount from cheque #1001','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 12:01:09',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,100.00,NULL),(93,'1005',100.0000,'fds','Finance',NULL,NULL,'2025-06-05','2025-06-05','settled','SETTLED: Assigned for excess from cheque #1001 - Excess amount from cheque #1001',NULL,NULL,'2025-06-04 22:33:48','2025-06-07 17:22:46',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(94,'1006',300.0000,'dfsd','Finance',NULL,NULL,'2025-06-05','2025-06-05','settled','SETTLED: Assigned for excess from cheque #1001 - Excess amount from cheque #1001',NULL,NULL,'2025-06-04 22:33:48','2025-06-07 17:22:46',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(95,'1007',300.0000,'dfsd','Finance',NULL,NULL,'2025-06-05','2025-06-05','settled','SETTLED: Assigned for excess from cheque #1001 - Excess amount from cheque #1001',NULL,NULL,'2025-06-04 22:33:48','2025-06-07 17:22:46',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(96,'1008',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 12:07:09',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(97,'1009',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 12:09:35',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(98,'1010',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 12:14:04',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(99,'1011',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 16:41:14',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(100,'1012',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 16:50:26',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(101,'1013',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 16:52:13',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(102,'1014',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 16:55:58',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(103,'1015',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-17 18:24:42',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(104,'1016',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 17:35:00',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(105,'1017',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-17 18:01:17',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(106,'1018',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-17 18:39:57',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(107,'1019',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 12:20:58',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(108,'1020',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-16 16:45:31',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(109,'1021',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-17 18:53:01',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(110,'1022',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-17 19:22:21',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(111,'1023',5000.0000,'احمد عبد الحليم ','General',NULL,'2025-06-17 23:52:43','2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Department: Finance Department | Department: تسويق',2,'2025-06-04 22:33:48','2025-06-17 20:52:43',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,1,0.00,NULL),(112,'1024',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','assigned','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-19 05:53:23',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(113,'1025',5500.0000,'kabnoury ','General',NULL,NULL,'2025-06-05','2025-06-05','settled','Book: Cheque Book #1001-1025, Created by user admin on 2025-06-05 01:33:48','Payment for Purchase Order #22 - kabnoury ',1,'2025-06-04 22:33:48','2025-06-21 13:38:50',2,NULL,NULL,NULL,0.00,NULL,0,1,1,'uploads/supplier_invoices\\invoice_cheque_113_20250621_163850.png','2025-06-21 16:38:50',1,1,1,5500.00,NULL),(114,'1026',1000.0000,'dfsd','Finance',NULL,NULL,'2025-06-06','2025-06-06','open','Coverage cheque for overspent cheque #89',NULL,NULL,'2025-06-05 21:21:03','2025-06-07 17:22:46',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(115,'TEST000001',111.9100,'Unallocated',NULL,NULL,'2025-06-09 16:36:51',NULL,NULL,'settled',NULL,'Test cheques for debugging',NULL,'2025-06-09 13:36:51','2025-06-09 17:51:22',2,NULL,NULL,NULL,0.00,'2025-06-09 20:51:22',1,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(116,'TEST000002',0.0000,'Unallocated',NULL,NULL,'2025-06-09 16:36:51',NULL,NULL,'pending',NULL,'Test cheques for debugging',NULL,'2025-06-09 13:36:51','2025-06-09 13:36:51',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(117,'TEST000003',0.0000,'Unallocated',NULL,NULL,'2025-06-09 16:36:51',NULL,NULL,'pending',NULL,'Test cheques for debugging',NULL,'2025-06-09 13:36:51','2025-06-09 13:36:51',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(118,'TEST000004',0.0000,'Unallocated',NULL,NULL,'2025-06-09 16:36:51',NULL,NULL,'pending',NULL,'Test cheques for debugging',NULL,'2025-06-09 13:36:51','2025-06-09 13:36:51',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(119,'TEST000005',0.0000,'Unallocated',NULL,NULL,'2025-06-09 16:36:51',NULL,NULL,'pending',NULL,'Test cheques for debugging',NULL,'2025-06-09 13:36:51','2025-06-09 13:36:51',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(120,'000035',0.0000,'Unallocated',NULL,NULL,'2025-06-09 16:37:10',NULL,NULL,'settled',NULL,'Settlement for overspent cheque 000039',1,'2025-06-09 13:37:10','2025-06-12 04:56:21',2,NULL,NULL,NULL,0.00,'2025-06-12 07:56:21',1,0,0,NULL,NULL,NULL,NULL,1,0.00,NULL),(121,'000036',5000.0000,'Unallocated',NULL,NULL,'2025-06-12 00:36:58',NULL,NULL,'cancelled',NULL,' | CANCELLED: testing (by user ID: 1 on 2025-06-12 01:14:31)',2,'2025-06-09 13:37:10','2025-06-11 22:14:31',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,1,0.00,NULL),(122,'000037',5000.0000,'Unallocated',NULL,NULL,'2025-06-12 10:17:27',NULL,NULL,'assigned',NULL,'',2,'2025-06-09 13:37:10','2025-06-12 07:17:27',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,1,0.00,NULL),(123,'000038',5000.0000,'Unallocated',NULL,NULL,'2025-06-16 10:16:51',NULL,NULL,'settled',NULL,'',1,'2025-06-09 13:37:10','2025-06-23 19:06:19',2,NULL,NULL,NULL,0.00,'2025-06-23 21:06:19',1,0,0,NULL,NULL,NULL,NULL,1,0.00,NULL),(124,'000039',1000.0000,'Unallocated',NULL,NULL,'2025-06-10 22:17:24',NULL,NULL,'settled',NULL,'',1,'2025-06-09 13:37:10','2025-06-11 08:45:02',2,NULL,NULL,NULL,0.00,'2025-06-11 11:45:02',1,0,0,NULL,NULL,NULL,NULL,1,0.00,120),(125,'000040',5500.0000,'kabnoury ',NULL,NULL,'2025-06-09 16:37:10',NULL,NULL,'settled',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-09 13:37:10','2025-06-23 19:57:14',2,NULL,NULL,NULL,0.00,'2025-06-23 21:57:14',1,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(126,'3001',5500.0000,'kabnoury ',NULL,NULL,'2025-06-10 23:04:33',NULL,NULL,'assigned',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-10 20:04:33','2025-06-16 17:08:57',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(127,'3002',0.0000,'Unallocated',NULL,NULL,'2025-06-10 23:04:33',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-10 20:04:33','2025-06-10 20:04:33',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(128,'3003',0.0000,'Unallocated',NULL,NULL,'2025-06-10 23:04:33',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-10 20:04:33','2025-06-10 20:04:33',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(129,'3004',0.0000,'Unallocated',NULL,NULL,'2025-06-10 23:04:33',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-10 20:04:33','2025-06-10 20:04:33',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(130,'3005',5500.0000,'kabnoury ',NULL,NULL,'2025-06-10 23:04:33',NULL,NULL,'assigned',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-10 20:04:33','2025-06-17 19:44:31',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(131,'445',0.0000,'Unallocated',NULL,NULL,'2025-06-10 23:05:06',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-10 20:05:06','2025-06-10 20:05:06',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(132,'446',5500.0000,'kabnoury ',NULL,NULL,'2025-06-10 23:05:06',NULL,NULL,'assigned',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-10 20:05:06','2025-06-17 19:05:13',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(133,'447',5500.0000,'kabnoury ',NULL,NULL,'2025-06-10 23:05:06',NULL,NULL,'assigned',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-10 20:05:06','2025-06-17 19:29:09',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(134,'448',0.0000,'Unallocated',NULL,NULL,'2025-06-10 23:05:06',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-10 20:05:06','2025-06-10 20:05:06',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(135,'449',5500.0000,'kabnoury ',NULL,NULL,'2025-06-10 23:05:06',NULL,NULL,'assigned',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-10 20:05:06','2025-06-17 19:25:51',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(136,'450',0.0000,'Unallocated',NULL,NULL,'2025-06-10 23:05:06',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-10 20:05:06','2025-06-10 20:05:06',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(137,'90',0.0000,'Unallocated',NULL,NULL,'2025-06-12 00:35:47',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-11 21:35:47','2025-06-11 21:35:47',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(138,'91',0.0000,'Unallocated',NULL,NULL,'2025-06-12 00:35:47',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-11 21:35:47','2025-06-11 21:35:47',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(139,'92',0.0000,'Unallocated',NULL,NULL,'2025-06-12 00:35:47',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-11 21:35:47','2025-06-11 21:35:47',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(140,'93',0.0000,'Unallocated',NULL,NULL,'2025-06-12 00:35:47',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-11 21:35:47','2025-06-11 21:35:47',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(141,'94',0.0000,'Unallocated',NULL,NULL,'2025-06-12 00:35:47',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-11 21:35:47','2025-06-11 21:35:47',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(142,'95',0.0000,'Unallocated',NULL,NULL,'2025-06-12 00:35:47',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-11 21:35:47','2025-06-11 21:35:47',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(143,'45',0.0000,'Unallocated',NULL,NULL,'2025-06-12 07:54:28',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-12 04:54:28','2025-06-12 04:54:28',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(144,'46',0.0000,'Unallocated',NULL,NULL,'2025-06-12 07:54:28',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-12 04:54:28','2025-06-12 04:54:28',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(145,'000047',5500.0000,'kabnoury ',NULL,NULL,'2025-06-15 23:13:59',NULL,NULL,'settled',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-15 20:13:59','2025-06-23 20:01:14',2,NULL,NULL,1,0.00,'2025-06-23 22:01:14',1,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(146,'000048',5500.0000,'kabnoury ',NULL,NULL,'2025-06-15 23:33:45',NULL,NULL,'settled',NULL,'Payment for Purchase Order #22 - kabnoury ',1,'2025-06-15 20:33:44','2025-06-23 20:02:11',2,NULL,NULL,1,0.00,'2025-06-23 22:02:11',1,0,0,NULL,NULL,NULL,1,1,5500.00,NULL),(147,'200',10000.0000,'احمد منتصر',NULL,NULL,'2025-06-19 13:50:26',NULL,NULL,'settled',NULL,NULL,1,'2025-06-19 10:48:32','2025-06-19 10:57:01',2,NULL,NULL,NULL,0.00,'2025-06-19 13:57:01',1,0,0,NULL,NULL,NULL,NULL,1,0.00,148),(148,'201',200.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'assigned',NULL,'Settlement for overspent cheque 200',1,'2025-06-19 10:48:32','2025-06-19 10:57:01',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,1,0.00,NULL),(149,'202',625.0100,'kabnoury ',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'settled_pending_invoice',NULL,'Payment for Purchase Order #21 - kabnoury ',1,'2025-06-19 10:48:32','2025-06-21 10:39:08',2,NULL,NULL,NULL,0.00,NULL,0,1,0,NULL,NULL,NULL,1,1,625.01,NULL),(150,'203',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(151,'204',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(152,'205',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(153,'206',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(154,'207',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(155,'208',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(156,'209',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(157,'210',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(158,'211',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(159,'212',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(160,'213',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(161,'214',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(162,'215',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(163,'216',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(164,'217',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(165,'218',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(166,'219',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(167,'220',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(168,'221',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(169,'222',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(170,'223',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(171,'224',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(172,'225',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(173,'226',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(174,'227',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(175,'228',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(176,'229',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(177,'230',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(178,'231',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(179,'232',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(180,'233',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(181,'234',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(182,'235',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(183,'236',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(184,'237',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(185,'238',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(186,'239',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(187,'240',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(188,'241',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(189,'242',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(190,'243',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(191,'244',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(192,'245',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(193,'246',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(194,'247',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(195,'248',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(196,'249',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(197,'250',0.0000,'Unallocated',NULL,NULL,'2025-06-19 13:48:32',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-19 10:48:32','2025-06-19 10:48:32',2,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(198,'1',125.1400,'kabnoury ',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'settled',NULL,'Payment for Purchase Order #20 - kabnoury ',1,'2025-06-21 09:25:05','2025-06-21 13:27:28',5,NULL,NULL,NULL,0.00,NULL,0,1,1,'uploads/supplier_invoices\\invoice_cheque_198_20250621_162728.png','2025-06-21 16:27:28',1,1,1,125.14,NULL),(199,'2',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(200,'3',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(201,'4',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(202,'5',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(203,'6',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(204,'7',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(205,'8',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(206,'9',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(207,'10',7590.0000,'احمد قباني',NULL,NULL,'2025-06-23 14:56:02',NULL,NULL,'settled',NULL,NULL,1,'2025-06-21 09:25:05','2025-06-23 19:05:21',5,NULL,NULL,NULL,0.00,'2025-06-23 21:05:21',1,0,0,NULL,NULL,NULL,NULL,1,0.00,NULL),(208,'11',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(209,'12',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(210,'13',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(211,'14',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(212,'15',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(213,'16',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(214,'17',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(215,'18',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(216,'19',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL),(217,'20',0.0000,'Unallocated',NULL,NULL,'2025-06-21 12:25:05',NULL,NULL,'open',NULL,NULL,NULL,'2025-06-21 09:25:05','2025-06-21 09:25:05',5,NULL,NULL,NULL,0.00,NULL,0,0,0,NULL,NULL,NULL,NULL,0,0.00,NULL);
/*!40000 ALTER TABLE `cheques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheques_backup`
--

DROP TABLE IF EXISTS `cheques_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheques_backup` (
  `id` int NOT NULL DEFAULT '0',
  `cheque_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payer_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,4) NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','cleared','bounced','cancelled','issued') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `bank_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `safe_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheques_backup`
--

LOCK TABLES `cheques_backup` WRITE;
/*!40000 ALTER TABLE `cheques_backup` DISABLE KEYS */;
/*!40000 ALTER TABLE `cheques_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheques_old`
--

DROP TABLE IF EXISTS `cheques_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheques_old` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payer_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,4) NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','cleared','bounced','cancelled','issued') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `bank_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `safe_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_cheques_number` (`cheque_number`),
  KEY `idx_cheques_status` (`status`),
  KEY `idx_cheques_safe` (`safe_id`),
  KEY `idx_cheques_date` (`issue_date`),
  KEY `idx_cheques_safe_id` (`safe_id`),
  CONSTRAINT `cheques_old_ibfk_1` FOREIGN KEY (`safe_id`) REFERENCES `safes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `cheques_old_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheques_old`
--

LOCK TABLES `cheques_old` WRITE;
/*!40000 ALTER TABLE `cheques_old` DISABLE KEYS */;
/*!40000 ALTER TABLE `cheques_old` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `current_item_costs`
--

DROP TABLE IF EXISTS `current_item_costs`;
/*!50001 DROP VIEW IF EXISTS `current_item_costs`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_item_costs` AS SELECT 
 1 AS `item_id`,
 1 AS `warehouse_id`,
 1 AS `total_quantity`,
 1 AS `weighted_avg_cost`,
 1 AS `min_cost`,
 1 AS `max_cost`,
 1 AS `batch_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `department_permissions`
--

DROP TABLE IF EXISTS `department_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_type` enum('view_all_departments','manage_all_departments','approve_all_cheques') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`,`permission_type`),
  CONSTRAINT `department_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=235 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_permissions`
--

LOCK TABLES `department_permissions` WRITE;
/*!40000 ALTER TABLE `department_permissions` DISABLE KEYS */;
INSERT INTO `department_permissions` VALUES (1,1,'view_all_departments','2025-05-29 17:13:38'),(2,1,'manage_all_departments','2025-05-29 17:13:38'),(3,1,'approve_all_cheques','2025-05-29 17:13:38'),(4,15,'view_all_departments','2025-05-29 17:13:38'),(5,15,'manage_all_departments','2025-05-29 17:13:38'),(6,15,'approve_all_cheques','2025-05-29 17:13:38');
/*!40000 ALTER TABLE `department_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `department_safe_cheques`
--

DROP TABLE IF EXISTS `department_safe_cheques`;
/*!50001 DROP VIEW IF EXISTS `department_safe_cheques`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `department_safe_cheques` AS SELECT 
 1 AS `id`,
 1 AS `cheque_number`,
 1 AS `department`,
 1 AS `issued_to`,
 1 AS `cheque_amount`,
 1 AS `issued_date`,
 1 AS `due_date`,
 1 AS `status`,
 1 AS `closing_remark`,
 1 AS `bank_account_id`,
 1 AS `bank_name`,
 1 AS `account_number`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `department_safe_cheques_backup`
--

DROP TABLE IF EXISTS `department_safe_cheques_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_safe_cheques_backup` (
  `id` int NOT NULL DEFAULT '0',
  `department_id` int DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `issued_to` varchar(255) DEFAULT NULL,
  `cheque_amount` decimal(10,2) DEFAULT NULL,
  `issued_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('open','active','settled','overspent','refunded','cancelled','closed') DEFAULT 'open',
  `closing_remark` text,
  `closed_at` datetime DEFAULT NULL,
  `cheque_number` varchar(50) DEFAULT NULL,
  `cancelled_by` int DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text,
  `safe_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_safe_cheques_backup`
--

LOCK TABLES `department_safe_cheques_backup` WRITE;
/*!40000 ALTER TABLE `department_safe_cheques_backup` DISABLE KEYS */;
/*!40000 ALTER TABLE `department_safe_cheques_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_safe_cheques_old`
--

DROP TABLE IF EXISTS `department_safe_cheques_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_safe_cheques_old` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `issued_to` varchar(255) DEFAULT NULL,
  `cheque_amount` decimal(10,2) DEFAULT NULL,
  `issued_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('open','active','settled','overspent','refunded','cancelled','closed') DEFAULT 'open',
  `closing_remark` text,
  `closed_at` datetime DEFAULT NULL,
  `cheque_number` varchar(50) DEFAULT NULL,
  `cancelled_by` int DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text,
  `safe_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cheque_number` (`cheque_number`),
  KEY `fk_cancelled_by` (`cancelled_by`),
  KEY `department_id` (`department_id`),
  KEY `idx_dept_cheques_safe` (`safe_id`),
  CONSTRAINT `department_safe_cheques_old_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dept_cheques_safe` FOREIGN KEY (`safe_id`) REFERENCES `safes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_safe_cheques_old`
--

LOCK TABLES `department_safe_cheques_old` WRITE;
/*!40000 ALTER TABLE `department_safe_cheques_old` DISABLE KEYS */;
/*!40000 ALTER TABLE `department_safe_cheques_old` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `manager_id` int DEFAULT NULL,
  `budget_limit` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `manager_id` (`manager_id`),
  KEY `idx_name` (`name`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=196 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Finance','Financial operations and accounting',NULL,NULL,'2025-05-29 17:13:38','2025-05-29 17:13:38',1),(2,'HR','Human Resources',NULL,NULL,'2025-05-29 17:13:38','2025-05-29 17:13:38',1),(3,'IT','Information Technology',NULL,NULL,'2025-05-29 17:13:38','2025-05-29 17:13:38',1),(4,'Operations','General operations',NULL,NULL,'2025-05-29 17:13:38','2025-05-29 17:13:38',1),(5,'Marketing','Marketing and sales',NULL,NULL,'2025-05-29 17:13:38','2025-05-29 17:13:38',1);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `early_settlement_files`
--

DROP TABLE IF EXISTS `early_settlement_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `early_settlement_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `early_settlement_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_type` varchar(50) DEFAULT 'deposit_screenshot',
  `uploaded_by` int DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `early_settlement_id` (`early_settlement_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `early_settlement_files_ibfk_1` FOREIGN KEY (`early_settlement_id`) REFERENCES `early_settlements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `early_settlement_files_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `early_settlement_files`
--

LOCK TABLES `early_settlement_files` WRITE;
/*!40000 ALTER TABLE `early_settlement_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `early_settlement_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `early_settlements`
--

DROP TABLE IF EXISTS `early_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `early_settlements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_id` int NOT NULL,
  `deposit_number` varchar(100) NOT NULL,
  `deposit_amount` decimal(12,2) NOT NULL,
  `deposit_date` datetime NOT NULL,
  `bank_deposit_reference` varchar(200) DEFAULT NULL,
  `notes` text,
  `status` varchar(20) DEFAULT 'pending',
  `settlement_date` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cheque_id` (`cheque_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `early_settlements_ibfk_1` FOREIGN KEY (`cheque_id`) REFERENCES `cheques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `early_settlements_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `early_settlements_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `early_settlements`
--

LOCK TABLES `early_settlements` WRITE;
/*!40000 ALTER TABLE `early_settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `early_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_config`
--

DROP TABLE IF EXISTS `email_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `app_password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_config`
--

LOCK TABLES `email_config` WRITE;
/*!40000 ALTER TABLE `email_config` DISABLE KEYS */;
INSERT INTO `email_config` VALUES (1,'admin@kbscakestudio.com','vcfo cdqw hvwe rynu','2025-06-01 17:58:37','2025-06-01 17:58:37');
/*!40000 ALTER TABLE `email_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipients` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `success` tinyint(1) DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_audit_log`
--

DROP TABLE IF EXISTS `expense_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `action_type` varchar(50) NOT NULL COMMENT 'created, updated, deleted, cancelled, transferred',
  `field_name` varchar(100) NOT NULL COMMENT 'Field that was changed',
  `old_value` text COMMENT 'Previous value',
  `new_value` text COMMENT 'New value',
  `changed_by` varchar(100) NOT NULL,
  `change_date` datetime NOT NULL,
  `description` text COMMENT 'Additional details about the change',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_id` (`expense_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_change_date` (`change_date`),
  KEY `idx_changed_by` (`changed_by`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Comprehensive audit trail for all expense changes';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_audit_log`
--

LOCK TABLES `expense_audit_log` WRITE;
/*!40000 ALTER TABLE `expense_audit_log` DISABLE KEYS */;
INSERT INTO `expense_audit_log` VALUES (1,1,'updated','category','Oils & Fats','','admin','2025-06-03 15:11:22',NULL,'2025-06-03 12:11:22'),(2,1,'updated','reason','das','ahmed','admin','2025-06-03 15:11:23',NULL,'2025-06-03 12:11:22'),(3,34,'updated','category','Oils & Fats','Decorator Wages','admin','2025-06-06 01:43:04',NULL,'2025-06-05 22:43:03');
/*!40000 ALTER TABLE `expense_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `path` varchar(1000) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `color` varchar(7) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `icon` varchar(50) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `description` text,
  `level` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `expense_categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `expense_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES (1,'Items',NULL,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(2,'Flour & Grains',1,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(3,'البان',1,NULL,1,NULL,'2025-06-15 19:20:04','2025-06-07 16:48:28',NULL,0,'',1),(4,'Sweeteners',1,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(5,'بيض',1,NULL,1,NULL,'2025-06-19 14:05:39','2025-06-07 16:48:28',NULL,0,'',1),(6,'Oils & Fats',1,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(7,'Decorating Supplie',1,NULL,1,NULL,'2025-06-10 22:52:27','2025-06-07 16:48:28',NULL,0,'',1),(8,'Kitchen Operations',NULL,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(9,'Equipment Maintenance',8,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(10,'Utilities',8,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(11,'Cleaning Supplies',8,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(12,'Packaging & Delivery',NULL,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(13,'Boxes & Containers',12,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(14,'Labels & Stickers',12,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(15,'Delivery Costs',12,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(16,'Staff Expenses',NULL,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(17,'Baker Salaries',16,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(18,'Decorator Wages',16,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(19,'Delivery Personnel',16,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(20,'Egg whites',5,NULL,1,NULL,'2025-06-07 16:48:28','2025-06-07 16:48:28',NULL,0,NULL,0),(21,'ضرائب',NULL,'ضرائب',1,'#007bff','2025-06-09 14:20:03','2025-06-07 16:48:28','fas fa-folder',0,'',0),(22,'كسب عمل',21,'ضرائب/كسب عمل',1,'#007bff','2025-06-09 14:20:17','2025-06-07 16:48:28','fas fa-folder',0,'',1),(23,'مرتبات',NULL,'مرتبات',1,'#007bff','2025-06-09 14:21:38','2025-06-07 20:03:30','fas fa-folder',0,'',0),(24,'Ingredients',NULL,'Ingredients',1,'#007bff','2025-06-07 20:03:38','2025-06-07 20:03:38','fas fa-folder',0,'',0),(25,'عام',NULL,'عام',1,'#007bff','2025-06-09 14:19:35','2025-06-07 20:03:46','fas fa-folder',0,'',0),(26,'مدفوعات الموردين',NULL,'مدفوعات الموردين',1,'#4CAF50','2025-06-15 23:13:59','2025-06-15 23:13:59','fas fa-truck',0,'Supplier Payments',0),(27,'عقارية',21,NULL,1,NULL,'2025-06-24 01:11:23','2025-06-24 01:11:23',NULL,0,'',1),(28,'يسبش',22,NULL,1,NULL,'2025-06-24 01:11:48','2025-06-24 01:11:48',NULL,0,'',2);
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_files`
--

DROP TABLE IF EXISTS `expense_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `uploaded_by` int DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `expense_files_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expense_files_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_files`
--

LOCK TABLES `expense_files` WRITE;
/*!40000 ALTER TABLE `expense_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `expense_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `safe_id` int DEFAULT NULL,
  `amount` decimal(15,4) NOT NULL,
  `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `expense_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `vendor_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issued_to` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logged_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT 'active, cancelled, transferred, deleted',
  `created_by` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `cheque_id` int NOT NULL DEFAULT '0',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `paid_to` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_safe` (`safe_id`),
  KEY `idx_expenses_date` (`expense_date`),
  KEY `idx_expenses_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_expenses_status_date` (`status`,`expense_date`),
  KEY `idx_expenses_safe_id_status` (`safe_id`,`status`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`safe_id`) REFERENCES `safes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (46,1,500.0000,NULL,NULL,'2025-06-09 21:00:00',NULL,NULL,NULL,NULL,'2025-06-10 19:42:51','2025-06-10 19:42:51','pending',NULL,13,NULL,124,'سشيسش',NULL,''),(47,1,600.0000,NULL,NULL,'2025-06-10 21:00:00',NULL,NULL,NULL,NULL,'2025-06-11 08:11:50','2025-06-11 08:11:50','pending',NULL,13,NULL,124,'dsfds',NULL,''),(48,2,2000.0000,NULL,NULL,'2025-06-14 21:00:00',NULL,NULL,NULL,NULL,'2025-06-15 16:05:17','2025-06-15 16:05:17','pending',NULL,22,NULL,121,'ضرايب كده كده',NULL,''),(49,NULL,5500.0000,NULL,NULL,'2025-06-15 20:13:59',NULL,NULL,NULL,NULL,'2025-06-15 20:13:59','2025-06-15 20:13:59','approved',1,26,1,145,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(50,NULL,5500.0000,NULL,NULL,'2025-06-15 20:33:45',NULL,NULL,NULL,NULL,'2025-06-15 20:33:44','2025-06-15 20:33:44','approved',1,26,1,146,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(51,NULL,5500.0000,NULL,NULL,'2025-06-16 09:01:49',NULL,NULL,NULL,NULL,'2025-06-16 09:01:48','2025-06-16 09:01:48','approved',1,26,1,125,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(52,NULL,5500.0000,NULL,NULL,'2025-06-16 09:09:31',NULL,NULL,NULL,NULL,'2025-06-16 09:09:31','2025-06-16 09:09:31','approved',1,26,1,89,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(53,NULL,5500.0000,NULL,NULL,'2025-06-16 10:58:23',NULL,NULL,NULL,NULL,'2025-06-16 10:58:23','2025-06-16 10:58:23','approved',1,26,1,90,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(54,NULL,5500.0000,NULL,NULL,'2025-06-16 11:31:26',NULL,NULL,NULL,NULL,'2025-06-16 11:31:25','2025-06-16 11:31:25','approved',1,26,1,91,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(55,NULL,100.0000,NULL,NULL,'2025-06-16 12:01:10',NULL,NULL,NULL,NULL,'2025-06-16 12:01:09','2025-06-16 12:01:09','approved',1,26,1,92,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(56,NULL,5500.0000,NULL,NULL,'2025-06-16 12:07:10',NULL,NULL,NULL,NULL,'2025-06-16 12:07:09','2025-06-16 12:07:09','approved',1,26,1,96,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(57,NULL,5500.0000,NULL,NULL,'2025-06-16 12:09:35',NULL,NULL,NULL,NULL,'2025-06-16 12:09:35','2025-06-16 12:09:35','approved',1,26,1,97,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(58,NULL,5500.0000,NULL,NULL,'2025-06-16 12:14:04',NULL,NULL,NULL,NULL,'2025-06-16 12:14:04','2025-06-16 12:14:04','approved',1,26,1,98,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(59,NULL,5500.0000,NULL,NULL,'2025-06-16 12:20:58',NULL,NULL,NULL,NULL,'2025-06-16 12:20:58','2025-06-16 12:20:58','approved',1,26,1,107,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(60,NULL,5500.0000,NULL,NULL,'2025-06-16 16:41:14',NULL,NULL,NULL,NULL,'2025-06-16 16:41:14','2025-06-16 16:41:14','approved',1,26,1,99,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(61,NULL,5500.0000,NULL,NULL,'2025-06-16 16:45:32',NULL,NULL,NULL,NULL,'2025-06-16 16:45:31','2025-06-16 16:45:31','approved',1,26,1,108,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(62,NULL,5500.0000,NULL,NULL,'2025-06-16 16:50:27',NULL,NULL,NULL,NULL,'2025-06-16 16:50:26','2025-06-16 16:50:26','approved',1,26,1,100,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(63,NULL,5500.0000,NULL,NULL,'2025-06-16 16:52:14',NULL,NULL,NULL,NULL,'2025-06-16 16:52:13','2025-06-16 16:52:13','approved',1,26,1,101,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(64,NULL,5500.0000,NULL,NULL,'2025-06-16 16:55:59',NULL,NULL,NULL,NULL,'2025-06-16 16:55:58','2025-06-16 16:55:58','approved',1,26,1,102,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(65,NULL,5500.0000,NULL,NULL,'2025-06-16 17:08:58',NULL,NULL,NULL,NULL,'2025-06-16 17:08:57','2025-06-16 17:08:57','approved',1,26,1,126,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(66,NULL,5500.0000,NULL,NULL,'2025-06-16 17:35:01',NULL,NULL,NULL,NULL,'2025-06-16 17:35:00','2025-06-16 17:35:00','approved',1,26,1,104,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(67,NULL,5500.0000,NULL,NULL,'2025-06-17 18:01:18',NULL,NULL,NULL,NULL,'2025-06-17 18:01:17','2025-06-17 18:01:17','approved',1,26,1,105,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(68,NULL,5500.0000,NULL,NULL,'2025-06-17 18:24:42',NULL,NULL,NULL,NULL,'2025-06-17 18:24:42','2025-06-17 18:24:42','approved',1,26,1,103,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(69,NULL,5500.0000,NULL,NULL,'2025-06-17 18:39:57',NULL,NULL,NULL,NULL,'2025-06-17 18:39:57','2025-06-17 18:39:57','approved',1,26,1,106,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(70,NULL,5500.0000,NULL,NULL,'2025-06-17 18:53:01',NULL,NULL,NULL,NULL,'2025-06-17 18:53:01','2025-06-17 18:53:01','approved',1,26,1,109,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(71,NULL,5500.0000,NULL,NULL,'2025-06-17 19:05:13',NULL,NULL,NULL,NULL,'2025-06-17 19:05:13','2025-06-17 19:05:13','approved',1,26,1,132,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(72,NULL,5500.0000,NULL,NULL,'2025-06-17 19:22:21',NULL,NULL,NULL,NULL,'2025-06-17 19:22:21','2025-06-17 19:22:21','approved',1,26,1,110,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(73,NULL,5500.0000,NULL,NULL,'2025-06-17 19:25:51',NULL,NULL,NULL,NULL,'2025-06-17 19:25:51','2025-06-17 19:25:51','approved',1,26,1,135,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(74,NULL,5500.0000,NULL,NULL,'2025-06-17 19:29:10',NULL,NULL,NULL,NULL,'2025-06-17 19:29:09','2025-06-17 19:29:09','approved',1,26,1,133,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(75,NULL,5500.0000,NULL,NULL,'2025-06-17 19:44:32',NULL,NULL,NULL,NULL,'2025-06-17 19:44:31','2025-06-17 19:44:31','approved',1,26,1,130,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(76,NULL,5500.0000,NULL,NULL,'2025-06-19 05:53:23',NULL,NULL,NULL,NULL,'2025-06-19 05:53:23','2025-06-19 05:53:23','approved',1,26,1,112,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(77,NULL,5500.0000,NULL,NULL,'2025-06-19 06:12:34',NULL,NULL,NULL,NULL,'2025-06-19 06:12:33','2025-06-19 06:12:33','approved',1,26,1,113,'دفعة لأمر الشراء #22 - kabnoury ',NULL,'Purchase Order: 22, Supplier: kabnoury , Items: 1'),(78,1,5000.0000,NULL,NULL,'2025-06-18 21:00:00',NULL,NULL,NULL,NULL,'2025-06-19 10:52:33','2025-06-19 10:52:33','pending',NULL,22,NULL,147,'نييسيسيبسي',NULL,''),(79,1,5200.0000,NULL,NULL,'2025-06-18 21:00:00',NULL,NULL,NULL,NULL,'2025-06-19 10:56:15','2025-06-19 10:56:15','pending',NULL,17,NULL,147,'dsfsdads',NULL,''),(80,NULL,625.0100,NULL,NULL,'2025-06-19 11:04:23',NULL,NULL,NULL,NULL,'2025-06-19 11:04:23','2025-06-19 11:04:23','approved',1,26,1,149,'دفعة لأمر الشراء #21 - kabnoury ',NULL,'Purchase Order: 21, Supplier: kabnoury , Items: 3'),(81,NULL,125.1400,NULL,NULL,'2025-06-21 10:27:01',NULL,NULL,NULL,NULL,'2025-06-21 10:27:01','2025-06-21 10:27:01','approved',1,26,1,198,'دفعة لأمر الشراء #20 - kabnoury ',NULL,'Purchase Order: 20, Supplier: kabnoury , Items: 1'),(82,1,5000.0000,NULL,NULL,'2025-06-20 21:00:00',NULL,NULL,NULL,NULL,'2025-06-21 14:35:44','2025-06-21 14:35:44','pending',NULL,17,NULL,123,'دفع الفواتير','احمد متولي','');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foodics_branches`
--

DROP TABLE IF EXISTS `foodics_branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foodics_branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `foodics_branch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_default` tinyint(1) DEFAULT '0',
  `warehouse_id` int DEFAULT NULL,
  `last_synced` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `foodics_branch_id` (`foodics_branch_id`),
  KEY `idx_branch_id` (`foodics_branch_id`),
  KEY `idx_warehouse` (`warehouse_id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foodics_branches`
--

LOCK TABLES `foodics_branches` WRITE;
/*!40000 ALTER TABLE `foodics_branches` DISABLE KEYS */;
/*!40000 ALTER TABLE `foodics_branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foodics_product_mapping`
--

DROP TABLE IF EXISTS `foodics_product_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foodics_product_mapping` (
  `id` int NOT NULL AUTO_INCREMENT,
  `local_item_id` int NOT NULL,
  `foodics_product_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `foodics_branch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sync_enabled` tinyint(1) DEFAULT '1',
  `last_synced` timestamp NULL DEFAULT NULL,
  `sync_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `sync_error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_mapping` (`local_item_id`,`foodics_branch_id`),
  KEY `idx_branch` (`foodics_branch_id`),
  KEY `idx_sync_status` (`sync_status`),
  KEY `idx_sync_enabled` (`sync_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foodics_product_mapping`
--

LOCK TABLES `foodics_product_mapping` WRITE;
/*!40000 ALTER TABLE `foodics_product_mapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `foodics_product_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foodics_sync_logs`
--

DROP TABLE IF EXISTS `foodics_sync_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foodics_sync_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sync_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `items_processed` int DEFAULT '0',
  `items_successful` int DEFAULT '0',
  `items_failed` int DEFAULT '0',
  `error_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`sync_type`),
  KEY `idx_branch` (`branch_id`),
  KEY `idx_status` (`status`),
  KEY `idx_started` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foodics_sync_logs`
--

LOCK TABLES `foodics_sync_logs` WRITE;
/*!40000 ALTER TABLE `foodics_sync_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `foodics_sync_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foodics_tokens`
--

DROP TABLE IF EXISTS `foodics_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foodics_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `api_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `configured_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foodics_tokens`
--

LOCK TABLES `foodics_tokens` WRITE;
/*!40000 ALTER TABLE `foodics_tokens` DISABLE KEYS */;
INSERT INTO `foodics_tokens` VALUES (1,'gAAAAABoTIXhFXemmpQCiHIuZBfay__yIfg61MtCr_ySjIvPeEST60nmVN8Mfkb5KNNhbuAn68pLTI37BtuJw9YQxpdMpD4aTepgigYdLav0alfqQ7gBC-EWjClTFTNBV4goZdtOMMguvo6hcO9cKyoU0pUQegYnviTz2T1Ag1oGhuQf44-Xxsx0ODYX23mjTG4tI7iCWSIE9dx2ZS5To7jMHjkIAkYkK7vv_vwjGYnxKFCnsJ_3S-eS0LK3cbXklTkELv42TRLSfkNpr9FG2QSMnO-Dv8opCu-14CSGkYOethUdJ6-R_iHDOCPMGTH6KCoSu3mz2oaimje36ic4EM03ET2QQY8IGQnLYrPtiHhSP5OkqiorVNM5uF7wfvgs9ZtGLz0AhsZ8Ew_5pb3CrX2moCh7LjSVHUrQ8lXpIxh44wxta31rZ1YPnsqEjegiyTIHAVRj-OFX6fT2s-m9e-7-WwyQggFk7dcYSnULpbqjS5Sr4IQijzopTFhad1tONXtoIhUOwIuatkAyjv9BqEkaE-UP1Oi9p2YWHwTSts2ma9_pWvuwMlDe2WsfHcP8Oxct99_Hnx26Tnfy_MLdpyDqjBlWnVnVXwPKvPdnAYI6TTi4-fVGv_0yrvAvkBTLdmx_Zib3buc2ljIKg533v2L41CgsFbMH13fx77PQeXaY_QwBOk1BBDgyVDdoP1lj-VbtFSpaM_1auoABvzX6bIGqfBwWdoJMsXVjArrmX141y8cLfu9hzQSBTuAteG8wcYbX31K3w0c9OfzrYaD3fL_JQJObWKikn5Sk_uI22U2hiojreuWJqxqkDVM5u2h8Rcj7djwDwAbNPUYIJ0lZ-Id_Bw4n4GLhdCQ93jRiRX0Aty0CSv7LQ4ulk7V2DaFEqWZ7uPanED2Md4hS7jI1Y41MIFiPw0KjZUU1Q_WAqglBg96XEBgsP0VzhA0HpmNxwfBjX3zO6BDM2FscPHTPBlr9WFAsRenffSGZf0a0t24GUEtVBYYOOStCr90eIRRnHRzIXJpn04tG2QPQiYgyLJkmuKYpbps-l8p6kElLvncCn0unJSK24jHE7z4WdrFjWcQEbzWjrP43dY4-uftWVq7HoJ4VGFyLov4qFaxDshz-3V8CHaaWaYEz5jds-hiKv61ON6Zy3a-JQHX75aQHoe-bdZTrQC6_QFaub-BZlTDoHP7YayRsRESVNkjdLwIuoRho-kwDZVPf1T_eOY07LeAM29gaBPfNHPo6aejnaqPiPGgYFqLtvj8Enmk_ezc7JQwG58ZYX_I5HWHGH4GXS--i9MwX1EoulpY1PRZaEiOC2RrLOj7vK_DOxtbilPfJNO7dJKvLMM9z4T06WC4uWeLw6TnG2BB1ZkaFdVmcHKzPu7Ue9qTp42jBY24wPU3CxYhhTrDI_DXUCfwmxF0IlRZ8OIub6B99B68YH6bCEOq3ei9_SPs851G8-1npNJEaKiNV4IpNAJIwrAV1A8Rcj_5eNIl3fx7QyD49PRnEOLb7nSUw8hTw_wtioYaBD915H0FmmNsl8K7Mr9-uDRZ7m2FIutA4FXDQnQM45JazPkuoYxDQVysYVLituEwSstcI0iSdtq9-GH9YfIBT92WKj1Za3MQo6FDnQK02QEpI666MJ4VMUN_2Hg1HVqJyLjinAn380xWohtfBhqPI4aVoRIb1NrOvkoUjmSZMOkcaZk_QWAfXDnFP98jPqUlOrw2_Q8QYAV1d8YfCqP9042aCpMeUX4YnMrjUJY7pNm2-AFzDYuu0aLsuTw2CXTUN9140Lk4KcKkIsCzbwfLCZv0a7nGxBAkDggoNivSMw35rj9ddwQkdm9UK_bM=',1,'admin','2025-06-13 20:11:13','2025-06-13 20:11:13');
/*!40000 ALTER TABLE `foodics_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foodics_webhook_logs`
--

DROP TABLE IF EXISTS `foodics_webhook_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foodics_webhook_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `webhook_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `processed` tinyint(1) DEFAULT '0',
  `received_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`webhook_type`),
  KEY `idx_processed` (`processed`),
  KEY `idx_received` (`received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foodics_webhook_logs`
--

LOCK TABLES `foodics_webhook_logs` WRITE;
/*!40000 ALTER TABLE `foodics_webhook_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `foodics_webhook_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredient_packages`
--

DROP TABLE IF EXISTS `ingredient_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredient_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ingredient_id` int NOT NULL,
  `package_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_per_package` decimal(12,3) NOT NULL,
  `unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_per_package` decimal(12,2) DEFAULT '0.00',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `weight_per_item` decimal(10,3) NOT NULL DEFAULT '1.000' COMMENT 'Weight per individual item in the package',
  `is_price_manual` tinyint(1) DEFAULT '0' COMMENT 'TRUE if price is manually set, FALSE if calculated from weight',
  `is_manual` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_ingredient_id` (`ingredient_id`),
  KEY `idx_is_default` (`is_default`),
  CONSTRAINT `ingredient_packages_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredient_packages`
--

LOCK TABLES `ingredient_packages` WRITE;
/*!40000 ALTER TABLE `ingredient_packages` DISABLE KEYS */;
INSERT INTO `ingredient_packages` VALUES (1,1,'Single kilo',1.000,'kilo',110.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(2,2,'Single kilo',1.000,'kilo',110.47,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(3,3,'Single kilo',1.000,'kilo',34.24,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(4,4,'Single Litre',1.000,'Litre',428.96,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(5,5,'Single Litre',1.000,'Litre',88.90,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(6,6,'Single kilo',1.000,'kilo',704.44,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(7,7,'Single kilo',1.000,'kilo',1982.91,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(8,8,'Single kilo',1.000,'kilo',16.36,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(9,9,'Single kilo',1.000,'kilo',125.14,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(10,10,'Single kilo',1.000,'kilo',86.05,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(11,11,'Single kilo',1.000,'kilo',29.42,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(12,12,'Single kilo',1.000,'kilo',480.97,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(13,13,'Single kilo',1.000,'kilo',25.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(14,14,'Single kilo',1.000,'kilo',362.95,1,'2025-05-25 20:43:44','2025-05-27 12:21:03',1.000,0,0),(15,15,'Single kilo',1.000,'kilo',57.02,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(16,16,'Single kilo',1.000,'kilo',360.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(17,17,'Single kilo',1.000,'kilo',110.47,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(18,18,'Single kilo',1.000,'kilo',690.96,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(19,19,'Single Litre',1.000,'Litre',169.75,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(20,20,'Single kilo',1.000,'kilo',516.03,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(21,21,'Single kilo',1.000,'kilo',110.47,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(22,22,'Single kilo',1.000,'kilo',719.78,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(23,23,'Single kilo',1.000,'kilo',749.78,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(24,24,'Single kilo',1.000,'kilo',253.11,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(25,25,'Single kilo',1.000,'kilo',690.96,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(26,26,'Single Litre',1.000,'Litre',0.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(27,27,'Single kilo',1.000,'kilo',174.23,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(28,28,'Single kilo',1.000,'kilo',161.27,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(29,29,'Single kilo',1.000,'kilo',60.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(30,30,'Single kilo',1.000,'kilo',161.27,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(31,31,'Single kilo',1.000,'kilo',157.79,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(32,32,'Single kilo',1.000,'kilo',50.20,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(33,33,'Single kilo',1.000,'kilo',62.74,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(34,34,'Single kilo',1.000,'kilo',605.73,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(35,35,'Single Litre',1.000,'Litre',43.91,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(36,37,'Single kilo',1.000,'kilo',88.90,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(37,38,'Single kilo',1.000,'kilo',320.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(38,39,'Single kilo',1.000,'kilo',408.16,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(39,40,'Single kilo',1.000,'kilo',1973.88,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(40,41,'Single kilo',1.000,'kilo',174.23,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(41,43,'Single kilo',1.000,'kilo',53.41,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(42,44,'Single Litre',1.000,'Litre',1521.90,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(43,45,'Single kilo',1.000,'kilo',8991.80,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(44,46,'Single kilo',1.000,'kilo',50.69,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(45,47,'Single kilo',1.000,'kilo',1276.80,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(46,48,'Single kilo',1.000,'kilo',177.18,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(47,49,'Single kilo',1.000,'kilo',100.35,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(48,50,'Single kilo',1.000,'kilo',60.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(49,51,'Single kilo',1.000,'kilo',860.70,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(50,52,'Single kilo',1.000,'kilo',1276.80,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(51,53,'Single kilo',1.000,'kilo',169.20,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(52,54,'Single kilo',1.000,'kilo',64.84,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(53,55,'Single kilo',1.000,'kilo',950.62,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(54,56,'Single Litre',1.000,'Litre',174.45,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(55,57,'Single Litre',1.000,'Litre',158.56,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(56,58,'Single Litre',1.000,'Litre',137.65,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(57,59,'Single Litre',1.000,'Litre',387.60,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(58,60,'Single kilo',1.000,'kilo',102.61,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(59,61,'Single kilo',1.000,'kilo',520.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(60,62,'Single kilo',1.000,'kilo',460.21,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(61,63,'Single kilo',1.000,'kilo',102.61,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(62,64,'Single kilo',1.000,'kilo',235.80,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(63,65,'Single kilo',1.000,'kilo',72.62,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(64,66,'Single kilo',1.000,'kilo',408.16,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(65,67,'Single kilo',1.000,'kilo',149.92,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(66,68,'Single kilo',1.000,'kilo',135.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(67,70,'Single Litre',1.000,'Litre',137.65,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(68,71,'Single kilo',1.000,'kilo',648.97,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(69,72,'Single kilo',1.000,'kilo',510.92,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(70,73,'Single Litre',1.000,'Litre',0.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(71,75,'Single kilo',1.000,'kilo',56.25,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(72,77,'Single Kilo',1.000,'Kilo',655.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(73,80,'Single kilo',1.000,'kilo',320.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(74,81,'Single kilo',1.000,'kilo',2400.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(75,82,'Single Kilo',1.000,'Kilo',1000.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(76,83,'Single kilo',1.000,'kilo',153.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(77,84,'Single kilo',1.000,'kilo',1218.37,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(78,85,'Single kilo',1.000,'kilo',153.28,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(79,86,'Single kilo',1.000,'kilo',137.66,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(80,87,'Single kilo',1.000,'kilo',650.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(81,88,'Single kilo',1.000,'kilo',84.50,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(82,89,'Single kilo',1.000,'kilo',250.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(83,90,'Single kilo',1.000,'kilo',1002.27,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(84,91,'Single Litre',1.000,'Litre',564.42,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(85,92,'Single kilo',1.000,'kilo',710.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(86,96,'Single kilo',1.000,'kilo',294.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(87,97,'Single kilo',1.000,'kilo',480.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(88,98,'Single kilo',1.000,'kilo',330.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(89,99,'Single Each',1.000,'Each',1.10,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(90,100,'Single Each',1.000,'Each',2.83,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(91,103,'Single kilo',1.000,'kilo',236.47,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(92,104,'Single kilo',1.000,'kilo',195.51,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(93,105,'Single kilo',1.000,'kilo',542.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(94,106,'Single litre',1.000,'litre',17.47,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(95,107,'Single kilo',1.000,'kilo',50.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(96,109,'Single kilo',1.000,'kilo',117.90,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(97,110,'Single kilo',1.000,'kilo',320.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(98,111,'Single kg',1.000,'kg',35.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(99,112,'Single ',1.000,'',384.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(100,113,'Single kilo',1.000,'kilo',1.00,1,'2025-05-25 20:43:44','2025-05-25 20:43:44',1.000,0,0),(101,114,'Single kilo',1.000,'kilo',10.00,0,'2025-05-25 21:30:27','2025-05-25 21:30:27',1.000,0,0),(102,114,'Niho Pallet',24.000,'Boxes',240.00,1,'2025-05-25 21:30:27','2025-05-25 21:30:27',1.000,0,0),(103,114,'Niho box',50.000,'Box',500.00,0,'2025-05-25 21:30:27','2025-05-25 21:30:27',1.000,0,0),(104,116,'Single kilo',1.000,'kilo',500.00,0,'2025-05-26 17:26:01','2025-05-26 17:26:01',1.000,0,0),(105,116,'KeboBox',24.000,'Box',500.00,1,'2025-05-26 17:26:01','2025-05-26 17:26:01',1.000,0,0),(107,14,'بلوك',25.000,'kilo',9073.75,0,'2025-05-27 12:15:49','2025-05-27 12:21:03',1.000,0,0),(108,121,'Single kilo',1.000,'kilo',12.00,1,'2025-05-29 11:42:43','2025-05-29 11:42:43',1.000,0,0),(109,2,'kebo',10.000,'kg',11047.00,0,'2025-06-07 22:38:06','2025-06-07 22:38:06',10.000,0,0);
/*!40000 ALTER TABLE `ingredient_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredient_stock`
--

DROP TABLE IF EXISTS `ingredient_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredient_stock` (
  `ingredient_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `quantity` decimal(10,3) DEFAULT '0.000',
  PRIMARY KEY (`ingredient_id`,`warehouse_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `ingredient_stock_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ingredient_stock_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredient_stock`
--

LOCK TABLES `ingredient_stock` WRITE;
/*!40000 ALTER TABLE `ingredient_stock` DISABLE KEYS */;
INSERT INTO `ingredient_stock` VALUES (1,1,100.000),(1,2,20.000),(2,1,80.000),(2,2,15.000),(3,1,20.000),(3,2,100.000),(4,1,50.000),(4,2,100.000),(5,2,7.600),(5,3,0.000),(6,2,100.000),(7,2,100.000),(8,2,4.000),(8,3,18.000),(9,2,100.000),(10,2,100.000),(11,2,100.000),(12,2,100.000),(13,2,100.000),(13,3,10.000),(14,2,100.000),(14,3,3275.000),(15,2,100.000),(16,2,100.000),(17,2,100.000),(18,2,100.000),(19,2,100.000),(20,2,100.000),(21,2,100.000),(22,2,97.500),(23,2,100.000),(24,2,100.000),(25,2,100.000),(26,2,100.000),(27,2,100.000),(28,2,100.000),(29,2,100.000),(30,2,100.000),(31,2,100.000),(32,2,100.000),(33,2,100.000),(34,2,100.000),(35,2,95.000),(37,2,100.000),(38,2,100.000),(39,2,100.000),(40,2,100.000),(41,2,100.000),(43,2,100.000),(44,2,100.000),(45,2,100.000),(46,2,100.000),(47,2,100.000),(47,3,3.000),(48,2,100.000),(49,2,100.000),(50,2,100.000),(51,2,100.000),(52,2,100.000),(53,2,100.000),(54,2,100.000),(55,2,100.000),(56,2,100.000),(57,2,100.000),(58,2,100.000),(59,2,100.000),(60,2,100.000),(61,2,100.000),(62,2,100.000),(63,2,100.000),(64,2,98.750),(65,2,100.000),(66,2,100.000),(67,2,100.000),(68,2,100.000),(68,3,5.000),(70,2,100.000),(71,2,100.000),(72,2,100.000),(73,2,100.000),(75,2,100.000),(77,2,4.000),(77,3,45.000),(80,2,523.900),(80,3,83.000),(81,2,100.000),(82,2,100.000),(83,2,20.000),(83,3,9.000),(84,2,100.000),(84,3,2.000),(85,2,100.000),(86,2,55.000),(86,3,672.000),(87,2,8.000),(87,3,20.000),(88,2,100.000),(89,2,344.000),(89,3,156.000),(90,2,100.000),(91,2,100.000),(92,2,100.000),(96,2,100.000),(97,2,100.000),(98,2,100.000),(99,2,100.000),(100,2,100.000),(103,2,100.000),(104,2,100.000),(105,2,100.000),(106,2,100.000),(107,2,100.000),(109,2,100.000),(110,2,100.000),(111,2,100.000),(112,2,100.000),(113,2,100.000),(114,2,127.000),(114,3,184.000),(115,2,100.000),(116,2,24.000),(116,3,216.000),(117,1,3.000),(117,2,5.000),(118,2,10.000),(119,2,1.000),(120,1,4.000),(120,2,2.000);
/*!40000 ALTER TABLE `ingredient_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredient_translations`
--

DROP TABLE IF EXISTS `ingredient_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredient_translations` (
  `ingredient_id` int NOT NULL,
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ingredient_id`,`language`),
  CONSTRAINT `ingredient_translations_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredient_translations`
--

LOCK TABLES `ingredient_translations` WRITE;
/*!40000 ALTER TABLE `ingredient_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `ingredient_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_batches`
--

DROP TABLE IF EXISTS `inventory_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `batch_reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity_received` decimal(12,3) NOT NULL,
  `quantity_remaining` decimal(12,3) NOT NULL,
  `unit_cost` decimal(12,4) NOT NULL,
  `received_date` date NOT NULL,
  `po_id` int DEFAULT NULL,
  `receiving_id` int DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `po_id` (`po_id`),
  KEY `idx_item_warehouse` (`item_id`,`warehouse_id`),
  KEY `idx_remaining_qty` (`quantity_remaining`),
  KEY `idx_received_date` (`received_date`),
  CONSTRAINT `inventory_batches_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_batches_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_batches_ibfk_3` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_batches`
--

LOCK TABLES `inventory_batches` WRITE;
/*!40000 ALTER TABLE `inventory_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_categories`
--

DROP TABLE IF EXISTS `inventory_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_categories`
--

LOCK TABLES `inventory_categories` WRITE;
/*!40000 ALTER TABLE `inventory_categories` DISABLE KEYS */;
INSERT INTO `inventory_categories` VALUES (1,'مكونات',NULL,'2025-05-31 16:19:40'),(2,'packing',NULL,'2025-05-31 16:19:40'),(3,'Ingredients',NULL,'2025-05-31 16:19:40'),(4,'Final Product',NULL,'2025-05-31 16:19:40');
/*!40000 ALTER TABLE `inventory_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_packages`
--

DROP TABLE IF EXISTS `item_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `quantity_per_package` decimal(10,3) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `price_per_package` decimal(10,2) DEFAULT NULL,
  `weight_per_item` decimal(10,4) NOT NULL,
  `is_default` tinyint(1) DEFAULT NULL,
  `is_manual` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `ix_item_packages_id` (`id`),
  CONSTRAINT `item_packages_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_packages`
--

LOCK TABLES `item_packages` WRITE;
/*!40000 ALTER TABLE `item_packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_stock`
--

DROP TABLE IF EXISTS `item_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_stock` (
  `ingredient_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `quantity` decimal(10,3) DEFAULT '0.000',
  PRIMARY KEY (`ingredient_id`,`warehouse_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `item_stock_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `item_stock_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_stock`
--

LOCK TABLES `item_stock` WRITE;
/*!40000 ALTER TABLE `item_stock` DISABLE KEYS */;
INSERT INTO `item_stock` VALUES (1,1,100.000),(1,2,100.000),(2,1,80.000),(2,2,100.000),(3,1,20.000),(3,2,100.000),(4,1,50.000),(4,2,100.000),(5,2,98.000),(5,3,0.000),(6,2,100.000),(7,2,100.000),(8,2,100.000),(8,3,18.000),(9,2,100.000),(10,2,100.000),(11,2,100.000),(12,2,100.000),(13,2,100.000),(13,3,10.000),(14,2,100.000),(14,3,3275.000),(15,2,100.000),(16,2,100.000),(17,2,100.000),(18,2,100.000),(19,2,100.000),(20,2,100.000),(21,2,100.000),(22,2,97.500),(23,2,100.000),(24,2,100.000),(25,2,100.000),(26,2,100.000),(27,2,100.000),(28,2,100.000),(29,2,100.000),(30,2,100.000),(31,2,100.000),(32,2,100.000),(33,2,100.000),(34,2,100.000),(35,2,95.000),(37,2,100.000),(38,2,100.000),(39,2,100.000),(40,2,100.000),(41,2,100.000),(43,2,100.000),(44,2,100.000),(45,2,100.000),(46,2,100.000),(47,2,100.000),(47,3,3.000),(48,2,100.000),(49,2,100.000),(50,2,100.000),(51,2,100.000),(52,2,100.000),(53,2,100.000),(54,2,100.000),(55,2,100.000),(56,2,100.000),(57,2,100.000),(58,2,100.000),(59,2,100.000),(60,2,100.000),(61,2,100.000),(62,2,100.000),(63,2,100.000),(64,2,98.750),(65,2,100.000),(66,2,100.000),(67,2,100.000),(68,2,100.000),(68,3,5.000),(70,2,100.000),(71,2,100.000),(72,2,100.000),(73,2,100.000),(75,2,100.000),(77,2,99.900),(77,3,45.000),(80,2,100.000),(80,3,83.000),(81,2,100.000),(82,2,100.000),(83,2,100.000),(83,3,9.000),(84,2,100.000),(84,3,2.000),(85,2,100.000),(86,2,100.000),(86,3,672.000),(87,2,100.000),(87,3,20.000),(88,2,100.000),(89,2,100.000),(89,3,156.000),(90,2,100.000),(91,2,100.000),(92,2,100.000),(96,2,100.000),(97,2,100.000),(98,2,100.000),(99,2,100.000),(100,2,100.000),(103,2,100.000),(104,2,100.000),(105,2,100.000),(106,2,100.000),(107,2,100.000),(109,2,100.000),(110,2,100.000),(111,2,100.000),(112,2,100.000),(113,2,100.000),(114,2,100.000),(114,3,184.000),(115,2,100.000),(116,2,100.000),(116,3,216.000),(117,1,3.000),(117,2,100.000),(118,2,100.000),(119,2,100.000),(120,1,4.000),(120,2,0.000);
/*!40000 ALTER TABLE `item_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `minimum_stock` decimal(10,2) DEFAULT '0.00',
  `price_per_unit` decimal(10,2) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `item_type` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_id` (`id`),
  KEY `fk_ingredient_category` (`category_id`),
  CONSTRAINT `fk_ingredient_category` FOREIGN KEY (`category_id`) REFERENCES `inventory_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,' Egg ','kilo',0.00,110.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(2,'Egg','kilo',0.00,110.47,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(3,'White Sugar','kilo',0.00,34.24,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(4,'Vanilla Parade','Litre',0.00,428.96,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(5,'Crystal Oil Sun Flower','Litre',0.00,88.90,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(6,'Cinnamon Powder','kilo',0.00,704.44,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(7,'Nutmeg','kilo',0.00,1982.91,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(8,'Salt Cooks','kilo',0.00,16.36,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(9,'Baking Powder Cooks','kilo',0.00,125.14,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(10,'Baking Soda','kilo',0.00,86.05,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(11,'White Flour 5 Star','kilo',0.00,29.42,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(12,'Walnuts','kilo',0.00,480.97,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(13,'Carrot','kilo',0.00,25.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(14,'Butter nuzlandi','kilo',0.00,362.95,2,NULL,'2025-06-01 16:39:24','مكونات'),(15,'Powder Suger','kilo',0.00,57.02,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(16,'Kiri Cheese','kilo',0.00,360.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(17,'Egg white','kilo',0.00,110.47,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(18,'Hazelnut p','kilo',0.00,690.96,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(19,'Dairy Elmaraai','Litre',0.00,169.75,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(20,'Caco','kilo',0.00,516.03,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(21,'Egg yellow','kilo',0.00,110.47,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(22,'Dark Chocolate','kilo',0.00,719.78,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(23,'Milk Chocolate','kilo',0.00,749.78,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(24,'Moltobella *10k','kilo',0.00,253.11,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(25,'Hazelnut','kilo',0.00,690.96,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(26,'Water','Litre',0.00,0.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(27,'Vuttin','kilo',0.00,174.23,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(28,'Golden Pack Sada','kilo',0.00,161.27,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(29,'Lemon','kilo',0.00,60.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(30,'Golden Pack Dark','kilo',0.00,161.27,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(31,'Golden Pack White','kilo',0.00,157.79,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(32,'Glucose Honey','kilo',0.00,50.20,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(33,'Jelly Polish','kilo',0.00,62.74,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(34,'Gelatin Powder','kilo',0.00,605.73,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(35,'Milk Elmaraai','Litre',0.00,43.91,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(37,'Corn Flour Cooks','kilo',0.00,88.90,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(38,'Raspberry Puree','kilo',0.00,320.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(39,'Cheese Saudi Anchor','kilo',0.00,408.16,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(40,'Nescafe Gold','kilo',0.00,1973.88,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(41,'Futin','kilo',0.00,174.23,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(43,'Corn Flour Cooks 240G','kilo',0.00,53.41,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(44,'Vanilla French Auf','Litre',0.00,1521.90,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(45,'Mestic','kilo',0.00,8991.80,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(46,'Dextrose Sugar','kilo',0.00,50.69,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(47,'Baz Milk Ice cream','kilo',0.00,1276.80,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(48,'Milk Powder DonÃ¢â‚¬â„¢t Fat','kilo',0.00,177.18,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(49,'Fresh Mango','kilo',0.00,100.35,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(50,' Lemon','kilo',0.00,60.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(51,'Baz Fruit Ice cream','kilo',0.00,860.70,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(52,'Base Milk Ice cream','kilo',0.00,1276.80,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(53,'Syrup Classic','kilo',0.00,169.20,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(54,'Tres Leches Cake','kilo',0.00,64.84,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(55,'Vanilla Powder Chines','kilo',0.00,950.62,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(56,'Condensed Milk','Litre',0.00,174.45,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(57,'Evaporated Milk','Litre',0.00,158.56,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(58,'Dairy Pratos','Litre',0.00,137.65,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(59,'Rose Water','Litre',0.00,387.60,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(60,'Daimond Sugar Brown','kilo',0.00,102.61,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(61,'Lotus Spread','kilo',0.00,520.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(62,'Lotus Biscuit','kilo',0.00,460.21,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(63,'Domino Sugar Brown','kilo',0.00,102.61,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(64,'Chocolate Sauce','kilo',0.00,235.80,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(65,'Mango Frozen','kilo',0.00,72.62,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(66,'Kiri Cheese block','kilo',0.00,408.16,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(67,'Digestive Biscuit','kilo',0.00,149.92,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(68,'Boosh Honey','kilo',0.00,135.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(70,'Dairy Lactofil','Litre',0.00,137.65,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(71,'Biscuit Ladyfinger','kilo',0.00,648.97,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(72,'Coffe Espresso','kilo',0.00,605.32,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(73,'Cold Water','Litre',0.00,0.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(75,'Fresh Dates','kilo',0.00,56.25,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(77,'Blueberry Fresh ','Kilo',0.00,655.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(80,' Cheese Mascarpone  ','kilo',0.00,320.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(81,'Red Current Fresh ','kilo',0.00,2400.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(82,'Dried Rose','Kilo',0.00,1000.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(83,' Hair Sweetness ','kilo',0.00,153.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(84,' Pistachio ','kilo',0.00,1218.37,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(85,' Rose Water Cream ','kilo',0.00,153.28,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(86,' Dairy Pratos ','kilo',0.00,137.66,2,NULL,'2025-06-01 16:39:24','مكونات'),(87,' Pistachio paste ','kilo',0.00,650.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(88,'Fresh Strawberry','kilo',0.00,84.50,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(89,' Daimond Sugar Brown ','kilo',0.00,250.00,1,NULL,'2025-06-01 16:39:24','مكونات'),(90,'Pecan','kilo',0.00,1002.27,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(91,'Vern Fat','Litre',0.00,564.42,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(92,'Marron Glace','kilo',0.00,710.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(96,'Milk Powder Full Fat','kilo',0.00,294.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(97,'Kahk Smell','kilo',0.00,480.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(98,'Sesame','kilo',0.00,330.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(99,'Kunafa Bracelets','Each',0.00,1.10,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(100,'Kunafa Dressing','Each',0.00,2.83,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(103,'Pistachio Cream ','kilo',0.00,236.47,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(104,'Blueberry Cream ','kilo',0.00,195.51,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(105,'Nutella ','kilo',0.00,542.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(106,' Syrup Maamoul & Basbousa ','litre',0.00,17.47,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(107,'Samolina Flour ','kilo',0.00,50.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(109,'Cream Pastry ing','kilo',0.00,117.90,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(110,'Rasberry Pure ing','kilo',0.00,320.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(111,'kunafa hair','kilo',0.00,35.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(112,'Majdool Dates','',0.00,384.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(113,'testdbING','kilo',0.00,1.00,NULL,NULL,'2025-06-01 16:39:24','مكونات'),(114,'Niho','kilo',0.00,10.00,2,NULL,'2025-06-01 16:39:24','مكونات'),(115,'','',0.00,0.00,2,NULL,'2025-06-01 16:39:24','مكونات'),(116,'KeboTest','kilo',0.00,500.00,1,NULL,'2025-06-01 16:39:24','مكونات'),(117,'Test ','kilo',0.00,1.00,3,NULL,'2025-06-01 16:39:24','مكونات'),(118,'testMk','kilo',0.00,100.00,1,NULL,'2025-06-01 16:39:24','مكونات'),(119,'Raspberry Fresh','Kilo',0.00,880.00,3,NULL,'2025-06-01 16:39:24','مكونات'),(120,'Blackberry Fresh','Kilo',0.00,720.00,3,NULL,'2025-06-01 16:39:24','مكونات'),(121,'test _item new','kilo',0.00,12.00,2,NULL,'2025-05-31 16:19:40','مكونات'),(122,'Test Sugar','kg',0.00,2.50,NULL,NULL,'2025-05-31 16:19:40','مكونات'),(127,'[PRODUCED] Carrot Cake Base','batch',0.00,0.00,NULL,NULL,'2025-06-11 19:49:05','مكونات'),(128,'[PRODUCED] Frosting','batch',0.00,0.00,NULL,NULL,'2025-06-11 19:50:42','مكونات'),(129,'[PRODUCED] Dakwaz Hazelnut','batch',0.00,0.00,NULL,NULL,'2025-06-11 19:52:44','مكونات'),(130,'[PRODUCED]   Dark Ganache ','batch',0.00,0.00,NULL,NULL,'2025-06-11 20:04:17','مكونات'),(131,'[PRODUCED] Big Carrot Cake','piece',0.00,0.00,NULL,NULL,'2025-06-11 20:14:01','مكونات'),(132,'[PRODUCED]  Barlinah ','batch',0.00,0.00,NULL,NULL,'2025-06-12 16:10:14','production'),(133,'[PRODUCED]  Biscuit Cheese Cake ','batch',0.00,0.00,NULL,NULL,'2025-06-12 16:10:14','production'),(134,'[PRODUCED]  Cream Pastry ','batch',0.00,0.00,NULL,NULL,'2025-06-19 17:30:27','production'),(135,'[PRODUCED] Frozen Chocolate cake big','batch',0.00,0.00,NULL,NULL,'2025-06-19 17:31:06','production');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kitchen_batch_log`
--

DROP TABLE IF EXISTS `kitchen_batch_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kitchen_batch_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_type` varchar(50) DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `produced_at` datetime DEFAULT NULL,
  `produced_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kitchen_batch_log`
--

LOCK TABLES `kitchen_batch_log` WRITE;
/*!40000 ALTER TABLE `kitchen_batch_log` DISABLE KEYS */;
INSERT INTO `kitchen_batch_log` VALUES (1,'cake',2,1.00,'2025-05-27 18:19:15','admin'),(2,'cake',32,10.00,'2025-05-27 18:19:15','admin'),(3,'cake',44,1.00,'2025-05-27 18:19:15','admin'),(4,'cake',2,2.00,'2025-05-27 18:21:24','admin'),(5,'cake',1,1.00,'2025-05-27 18:21:24','admin'),(6,'cake',2,5.00,'2025-05-27 18:22:32','admin'),(7,'cake',1,5.00,'2025-05-27 18:22:32','admin');
/*!40000 ALTER TABLE `kitchen_batch_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mid_prep_batches`
--

DROP TABLE IF EXISTS `mid_prep_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mid_prep_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mid_prep_id` int DEFAULT NULL,
  `quantity_produced` float DEFAULT NULL,
  `warehouse_id` int DEFAULT NULL,
  `produced_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mid_prep_id` (`mid_prep_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `mid_prep_batches_ibfk_1` FOREIGN KEY (`mid_prep_id`) REFERENCES `mid_prep_recipes` (`id`),
  CONSTRAINT `mid_prep_batches_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mid_prep_batches`
--

LOCK TABLES `mid_prep_batches` WRITE;
/*!40000 ALTER TABLE `mid_prep_batches` DISABLE KEYS */;
INSERT INTO `mid_prep_batches` VALUES (1,1,10,2,'2025-05-28 16:32:37'),(2,2,5,2,'2025-05-28 16:32:37'),(3,2,2,2,'2025-05-28 17:17:19'),(4,1,2,2,'2025-05-28 17:17:19'),(5,2,1,2,'2025-05-28 17:23:17'),(6,1,1,2,'2025-05-28 17:23:17'),(7,2,10,2,'2025-05-28 17:28:24'),(8,1,5,2,'2025-05-28 17:28:24'),(9,2,1,2,'2025-05-28 17:31:50'),(10,1,1,2,'2025-05-28 17:31:50'),(11,2,1,2,'2025-05-28 17:32:41'),(12,2,1,2,'2025-05-28 17:32:56'),(13,2,1,2,'2025-05-28 17:37:21'),(14,1,1,2,'2025-05-28 17:37:21'),(15,2,1,2,'2025-05-28 17:43:45'),(16,2,1,2,'2025-05-28 17:43:59'),(17,2,1,2,'2025-05-28 18:04:58'),(18,1,1,2,'2025-05-28 18:04:58'),(19,3,1,2,'2025-05-28 19:02:05'),(20,3,1,2,'2025-05-28 19:51:43'),(21,3,1,2,'2025-05-28 20:18:02'),(22,3,1,2,'2025-05-28 20:41:03'),(23,3,1,2,'2025-05-28 20:56:38'),(24,3,1,2,'2025-05-29 11:46:36'),(25,3,1,2,'2025-05-29 11:53:42'),(26,3,1,2,'2025-05-30 09:53:35');
/*!40000 ALTER TABLE `mid_prep_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mid_prep_ingredients`
--

DROP TABLE IF EXISTS `mid_prep_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mid_prep_ingredients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mid_prep_id` int DEFAULT NULL,
  `ingredient_id` int DEFAULT NULL,
  `quantity` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mid_prep_id` (`mid_prep_id`),
  KEY `mid_prep_ingredients_ibfk_2` (`ingredient_id`),
  CONSTRAINT `mid_prep_ingredients_ibfk_1` FOREIGN KEY (`mid_prep_id`) REFERENCES `mid_prep_recipes` (`id`),
  CONSTRAINT `mid_prep_ingredients_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mid_prep_ingredients`
--

LOCK TABLES `mid_prep_ingredients` WRITE;
/*!40000 ALTER TABLE `mid_prep_ingredients` DISABLE KEYS */;
INSERT INTO `mid_prep_ingredients` VALUES (1,1,52,10);
/*!40000 ALTER TABLE `mid_prep_ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mid_prep_recipes`
--

DROP TABLE IF EXISTS `mid_prep_recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mid_prep_recipes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mid_prep_recipes`
--

LOCK TABLES `mid_prep_recipes` WRITE;
/*!40000 ALTER TABLE `mid_prep_recipes` DISABLE KEYS */;
INSERT INTO `mid_prep_recipes` VALUES (1,'chocolate mid test','2025-05-28 16:15:05'),(2,'Carrot-mid','2025-05-28 16:17:28'),(3,'Frozen Chocolate cake big','2025-05-28 19:01:17');
/*!40000 ALTER TABLE `mid_prep_recipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mid_prep_stock`
--

DROP TABLE IF EXISTS `mid_prep_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mid_prep_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mid_prep_id` int DEFAULT NULL,
  `warehouse_id` int DEFAULT NULL,
  `quantity` float DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `mid_prep_id` (`mid_prep_id`,`warehouse_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `mid_prep_stock_ibfk_1` FOREIGN KEY (`mid_prep_id`) REFERENCES `mid_prep_recipes` (`id`),
  CONSTRAINT `mid_prep_stock_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mid_prep_stock`
--

LOCK TABLES `mid_prep_stock` WRITE;
/*!40000 ALTER TABLE `mid_prep_stock` DISABLE KEYS */;
INSERT INTO `mid_prep_stock` VALUES (1,1,2,21),(2,2,2,25),(19,3,2,1);
/*!40000 ALTER TABLE `mid_prep_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mid_prep_subrecipes`
--

DROP TABLE IF EXISTS `mid_prep_subrecipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mid_prep_subrecipes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mid_prep_id` int DEFAULT NULL,
  `sub_recipe_id` int DEFAULT NULL,
  `quantity` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mid_prep_id` (`mid_prep_id`),
  KEY `sub_recipe_id` (`sub_recipe_id`),
  CONSTRAINT `mid_prep_subrecipes_ibfk_1` FOREIGN KEY (`mid_prep_id`) REFERENCES `mid_prep_recipes` (`id`),
  CONSTRAINT `mid_prep_subrecipes_ibfk_2` FOREIGN KEY (`sub_recipe_id`) REFERENCES `sub_recipes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mid_prep_subrecipes`
--

LOCK TABLES `mid_prep_subrecipes` WRITE;
/*!40000 ALTER TABLE `mid_prep_subrecipes` DISABLE KEYS */;
INSERT INTO `mid_prep_subrecipes` VALUES (1,1,5,10),(2,1,4,5),(3,2,1,1),(4,2,46,1),(5,3,7,0.07),(6,3,5,1.2),(7,3,4,1.1),(8,3,3,0.16),(9,3,6,0.08),(10,3,11,0.18);
/*!40000 ALTER TABLE `mid_prep_subrecipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_conditions`
--

DROP TABLE IF EXISTS `notification_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_conditions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_type_id` int NOT NULL,
  `condition_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `condition_operator` enum('equals','not_equals','greater_than','less_than','contains','not_contains') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `condition_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type_condition` (`notification_type_id`,`condition_key`),
  CONSTRAINT `notification_conditions_ibfk_1` FOREIGN KEY (`notification_type_id`) REFERENCES `notification_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_conditions`
--

LOCK TABLES `notification_conditions` WRITE;
/*!40000 ALTER TABLE `notification_conditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_conditions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_settings`
--

DROP TABLE IF EXISTS `notification_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_type_id` int NOT NULL,
  `role_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `is_email_enabled` tinyint(1) DEFAULT '0',
  `is_system_enabled` tinyint(1) DEFAULT '1',
  `priority_override` enum('low','medium','high','critical') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_type_role` (`notification_type_id`,`role_id`),
  UNIQUE KEY `unique_type_user` (`notification_type_id`,`user_id`),
  KEY `idx_type` (`notification_type_id`),
  KEY `idx_role` (`role_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `notification_settings_ibfk_1` FOREIGN KEY (`notification_type_id`) REFERENCES `notification_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_settings_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_settings_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_settings`
--

LOCK TABLES `notification_settings` WRITE;
/*!40000 ALTER TABLE `notification_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_types`
--

DROP TABLE IF EXISTS `notification_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name_en` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name_ar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_en` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description_ar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_key` (`type_key`),
  KEY `idx_category` (`category`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_types`
--

LOCK TABLES `notification_types` WRITE;
/*!40000 ALTER TABLE `notification_types` DISABLE KEYS */;
INSERT INTO `notification_types` VALUES (1,'cheque_cancel','Cheque Cancellation','إلغاء شيك','Notification when a cheque is cancelled','إشعار عند إلغاء شيك','cheque',1,'2025-06-01 18:12:19'),(2,'cheque_edit','Cheque Edit','تعديل شيك','Notification when a cheque is edited','إشعار عند تعديل شيك','cheque',1,'2025-06-01 18:12:19'),(3,'cheque_status_change','Cheque Status Change','تغيير حالة شيك','Notification when cheque status changes','إشعار عند تغيير حالة الشيك','cheque',1,'2025-06-01 18:12:19'),(4,'cheque_overspent','Cheque Overspent','شيك مفرط الإنفاق','Notification when expenses exceed cheque amount','إشعار عند تجاوز المصروفات لمبلغ الشيك','cheque',1,'2025-06-01 18:12:19'),(5,'cheque_allocation','Cheque Allocation','تخصيص شيك','Notification when a cheque is allocated','إشعار عند تخصيص شيك','cheque',1,'2025-06-01 18:12:19'),(6,'low_stock','Low Stock Alert','تنبيه نقص المخزون','Notification when stock is running low','إشعار عند نقص المخزون','inventory',1,'2025-06-01 18:12:19'),(7,'stock_movement','Stock Movement','حركة المخزون','Notification for significant stock movements','إشعار لحركات المخزون المهمة','inventory',1,'2025-06-01 18:12:19'),(8,'transfer_order','Transfer Order','أمر تحويل','Notification for transfer orders','إشعار لأوامر التحويل','inventory',1,'2025-06-01 18:12:19'),(9,'production_complete','Production Complete','اكتمال الإنتاج','Notification when production is completed','إشعار عند اكتمال الإنتاج','production',1,'2025-06-01 18:12:19'),(10,'batch_ready','Batch Ready','الدفعة جاهزة','Notification when a batch is ready','إشعار عند جاهزية الدفعة','production',1,'2025-06-01 18:12:19'),(11,'suspicious_activity','Suspicious Activity','نشاط مشبوه','Notification for suspicious activities','إشعار للأنشطة المشبوهة','security',1,'2025-06-01 18:12:19'),(12,'login_failure','Login Failure','فشل تسجيل الدخول','Notification for failed login attempts','إشعار لمحاولات فشل تسجيل الدخول','security',1,'2025-06-01 18:12:19'),(13,'system_backup','System Backup','نسخ احتياطي للنظام','Notification for system backup status','إشعار لحالة النسخ الاحتياطي','system',1,'2025-06-01 18:12:19'),(14,'system_error','System Error','خطأ في النظام','Notification for system errors','إشعار لأخطاء النظام','system',1,'2025-06-01 18:12:19');
/*!40000 ALTER TABLE `notification_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payables`
--

DROP TABLE IF EXISTS `payables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `due_date` date NOT NULL,
  `amount_due` decimal(12,2) NOT NULL,
  `amount_paid` decimal(12,2) DEFAULT '0.00',
  `status` enum('Pending','Partial','Paid','Overdue') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `po_id` (`po_id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `payables_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payables_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payables`
--

LOCK TABLES `payables` WRITE;
/*!40000 ALTER TABLE `payables` DISABLE KEYS */;
INSERT INTO `payables` VALUES (1,1,2,'2025-06-24',60.00,60.00,'Paid','2025-05-25 12:17:35','2025-05-25 16:54:35'),(2,2,2,'2025-06-24',100.00,100.00,'Paid','2025-05-25 12:27:13','2025-05-25 16:54:35'),(3,3,2,'2025-06-24',1400.00,1400.00,'Paid','2025-05-25 12:27:14','2025-05-25 16:54:35'),(4,4,2,'2025-06-24',8970.00,8970.00,'Paid','2025-05-25 12:27:14','2025-05-25 19:11:10'),(5,5,2,'2025-06-24',5000.00,5000.00,'Paid','2025-05-25 12:27:14','2025-05-25 19:11:10'),(6,6,2,'2025-06-24',1000.00,1000.00,'Paid','2025-05-25 12:27:14','2025-05-26 10:22:10'),(7,7,2,'2025-06-24',500.00,500.00,'Paid','2025-05-25 12:27:14','2025-05-26 10:22:10'),(8,8,2,'2025-06-24',1000.00,1000.00,'Paid','2025-05-25 12:27:14','2025-05-26 10:22:10'),(9,9,2,'2025-06-24',25.00,0.00,'Pending','2025-05-25 12:27:14','2025-05-25 12:27:14'),(10,10,2,'2025-06-24',825.00,0.00,'Pending','2025-05-25 12:27:14','2025-05-25 12:27:14'),(11,11,2,'2025-06-24',300.00,0.00,'Pending','2025-05-25 12:27:14','2025-05-25 12:27:14'),(12,12,2,'2025-06-24',50.00,0.00,'Pending','2025-05-25 12:27:14','2025-05-25 12:27:14'),(13,13,2,'2025-06-25',1530.00,0.00,'Pending','2025-05-26 18:21:59','2025-05-26 18:21:59'),(14,14,2,'2025-06-25',6384.00,0.00,'Pending','2025-05-26 18:21:59','2025-05-26 18:21:59'),(15,15,2,'2025-06-26',675.00,0.00,'Pending','2025-05-26 21:32:39','2025-05-26 21:32:39');
/*!40000 ALTER TABLE `payables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_attachments`
--

DROP TABLE IF EXISTS `payment_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `file_type` enum('receipt','payment_proof') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_data` longblob NOT NULL,
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_file_type` (`file_type`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_attachments`
--

LOCK TABLES `payment_attachments` WRITE;
/*!40000 ALTER TABLE `payment_attachments` DISABLE KEYS */;
INSERT INTO `payment_attachments` VALUES (7,30,'receipt','','Screenshot 2024-03-24 221050.png',0,'2025-05-26 10:22:11'),(8,30,'payment_proof','','Screenshot 2023-11-19 203803.png',0,'2025-05-26 10:22:11');
/*!40000 ALTER TABLE `payment_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_terms`
--

DROP TABLE IF EXISTS `payment_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_terms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `payment_days` int DEFAULT '30',
  `discount_percentage` decimal(5,2) DEFAULT '0.00',
  `discount_days` int DEFAULT '0',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_supplier_terms` (`supplier_id`),
  CONSTRAINT `payment_terms_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_terms`
--

LOCK TABLES `payment_terms` WRITE;
/*!40000 ALTER TABLE `payment_terms` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_terms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `po_id` int DEFAULT NULL,
  `cheque_id` int DEFAULT NULL,
  `expense_category_id` int DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` enum('Cash','Check','Bank Transfer','Credit Card') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `receipt_photo` longblob,
  `receipt_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_proof_photo` longblob,
  `payment_proof_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `po_id` (`po_id`),
  KEY `cheque_id` (`cheque_id`),
  KEY `expense_category_id` (`expense_category_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`cheque_id`) REFERENCES `department_safe_cheques_old` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_4` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,2,1,NULL,NULL,60.00,'2025-05-25','Cash','','Part of multi-PO payment ($60.00)',NULL,NULL,NULL,NULL,'2025-05-25 12:06:53','admin'),(2,2,4,NULL,NULL,8970.00,'2025-05-25','Cash','','Part of multi-PO payment ($8970.00)',NULL,NULL,NULL,NULL,'2025-05-25 12:06:53','admin'),(3,2,9,NULL,NULL,25.00,'2025-05-25','Cash','','Part of multi-PO payment ($25.00)',NULL,NULL,NULL,NULL,'2025-05-25 12:06:53','admin'),(4,2,NULL,NULL,NULL,5.00,'2025-05-25','Cash','','Excess from multi-PO payment ($5.00)',NULL,NULL,NULL,NULL,'2025-05-25 12:06:53','admin'),(5,2,1,NULL,NULL,60.00,'2025-05-25','Check','','Part of multi-PO payment ($60.00)',NULL,NULL,NULL,NULL,'2025-05-25 12:10:37','admin'),(6,2,4,NULL,NULL,8970.00,'2025-05-25','Check','','Part of multi-PO payment ($8970.00)',NULL,NULL,NULL,NULL,'2025-05-25 12:10:37','admin'),(7,2,9,NULL,NULL,25.00,'2025-05-25','Check','','Part of multi-PO payment ($25.00)',NULL,NULL,NULL,NULL,'2025-05-25 12:10:37','admin'),(8,2,NULL,NULL,NULL,5.00,'2025-05-25','Check','','Excess from multi-PO payment ($5.00)',NULL,NULL,NULL,NULL,'2025-05-25 12:10:37','admin'),(23,2,1,NULL,NULL,60.00,'2025-05-25','Cash','','Part of multi-PO payment ($60.00)',NULL,NULL,NULL,NULL,'2025-05-25 16:54:35','admin'),(24,2,2,NULL,NULL,100.00,'2025-05-25','Cash','','Part of multi-PO payment ($100.00)',NULL,NULL,NULL,NULL,'2025-05-25 16:54:35','admin'),(25,2,3,NULL,NULL,1400.00,'2025-05-25','Cash','','Part of multi-PO payment ($1400.00)',NULL,NULL,NULL,NULL,'2025-05-25 16:54:35','admin'),(26,2,4,NULL,NULL,8970.00,'2025-05-25','Check','','Part of multi-PO payment ($8970.00)',NULL,NULL,NULL,NULL,'2025-05-25 19:11:10','admin'),(27,2,5,NULL,NULL,5000.00,'2025-05-25','Check','','Part of multi-PO payment ($5000.00)',NULL,NULL,NULL,NULL,'2025-05-25 19:11:10','admin'),(28,2,6,NULL,NULL,1000.00,'2025-05-26','Cash','45656453','Part of multi-PO payment ($1000.00)',NULL,NULL,NULL,NULL,'2025-05-26 10:22:10','admin '),(29,2,7,NULL,NULL,500.00,'2025-05-26','Cash','45656453','Part of multi-PO payment ($500.00)',NULL,NULL,NULL,NULL,'2025-05-26 10:22:10','admin '),(30,2,8,NULL,NULL,1000.00,'2025-05-26','Cash','45656453','Part of multi-PO payment ($1000.00)',NULL,NULL,NULL,NULL,'2025-05-26 10:22:10','admin ');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int DEFAULT NULL,
  `feature_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_feature` (`role_id`,`feature_key`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (106,1,'access_all_safes'),(87,1,'access_all_warehouses'),(100,1,'add_items'),(55,1,'approve_waste'),(111,1,'assign_bank_account_access'),(104,1,'assign_cheques_to_safe'),(102,1,'assign_warehouses'),(63,1,'batch_production'),(64,1,'kitchen_production'),(107,1,'log_expenses'),(109,1,'manage_bank_accounts'),(108,1,'manage_banks'),(58,1,'manage_cakes'),(59,1,'manage_categories'),(56,1,'manage_ingredients'),(101,1,'manage_items'),(62,1,'manage_roles'),(103,1,'manage_safes'),(57,1,'manage_sub_recipes'),(60,1,'manage_translations'),(61,1,'manage_users'),(99,1,'package_management'),(50,1,'receive_transfers'),(47,1,'stock_movements'),(46,1,'stock_report'),(53,1,'transfer_charts'),(52,1,'transfer_dashboard'),(51,1,'transfer_history'),(49,1,'transfer_orders'),(45,1,'update_stock'),(110,1,'view_all_bank_accounts'),(48,1,'view_costs'),(105,1,'view_safe_transactions'),(44,1,'warehouse_overview'),(54,1,'waste_management'),(74,2,'approve_waste'),(75,2,'manage_categories'),(70,2,'receive_transfers'),(68,2,'stock_movements'),(67,2,'stock_report'),(72,2,'transfer_dashboard'),(71,2,'transfer_history'),(69,2,'transfer_orders'),(66,2,'update_stock'),(65,2,'warehouse_overview'),(73,2,'waste_management'),(98,3,'access_all_warehouses'),(83,3,'approve_waste'),(78,3,'stock_movements'),(77,3,'stock_report'),(81,3,'transfer_charts'),(80,3,'transfer_dashboard'),(79,3,'transfer_history'),(76,3,'view_costs'),(82,3,'waste_management'),(85,4,'stock_report'),(86,4,'transfer_history'),(84,4,'warehouse_overview');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pre_production_log`
--

DROP TABLE IF EXISTS `pre_production_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pre_production_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sub_recipe_id` int DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `produced_at` datetime DEFAULT NULL,
  `produced_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sub_recipe_id` (`sub_recipe_id`),
  CONSTRAINT `pre_production_log_ibfk_1` FOREIGN KEY (`sub_recipe_id`) REFERENCES `sub_recipes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_production_log`
--

LOCK TABLES `pre_production_log` WRITE;
/*!40000 ALTER TABLE `pre_production_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `pre_production_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_history`
--

DROP TABLE IF EXISTS `price_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `old_price` decimal(12,4) DEFAULT NULL,
  `new_price` decimal(12,4) NOT NULL,
  `change_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `change_reason` enum('po_received','manual_adjustment','initial_setup') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'po_received',
  `po_id` int DEFAULT NULL,
  `receiving_id` int DEFAULT NULL,
  `changed_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_item_date` (`item_id`,`change_date`),
  KEY `idx_po_id` (`po_id`),
  CONSTRAINT `price_history_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `price_history_ibfk_2` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_history`
--

LOCK TABLES `price_history` WRITE;
/*!40000 ALTER TABLE `price_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_cost_details`
--

DROP TABLE IF EXISTS `production_cost_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_cost_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `production_type` enum('cake','sub_recipe','pre_production') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `production_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity_used` decimal(12,3) NOT NULL,
  `unit_cost` decimal(12,4) NOT NULL,
  `total_cost` decimal(12,2) NOT NULL,
  `batch_id` int DEFAULT NULL,
  `production_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `batch_id` (`batch_id`),
  KEY `idx_production` (`production_type`,`production_id`),
  KEY `idx_production_date` (`production_date`),
  CONSTRAINT `production_cost_details_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `production_cost_details_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_cost_details`
--

LOCK TABLES `production_cost_details` WRITE;
/*!40000 ALTER TABLE `production_cost_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_cost_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_cost_summary`
--

DROP TABLE IF EXISTS `production_cost_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_cost_summary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `production_type` enum('cake','sub_recipe','pre_production') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `production_id` int NOT NULL,
  `production_batch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_ingredient_cost` decimal(12,2) DEFAULT '0.00',
  `total_subrecipe_cost` decimal(12,2) DEFAULT '0.00',
  `total_production_cost` decimal(12,2) DEFAULT '0.00',
  `quantity_produced` decimal(12,3) NOT NULL,
  `cost_per_unit` decimal(12,4) GENERATED ALWAYS AS ((case when (`quantity_produced` > 0) then (`total_production_cost` / `quantity_produced`) else 0 end)) STORED,
  `production_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `produced_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_production` (`production_type`,`production_id`,`production_batch_id`),
  KEY `idx_production_date` (`production_date`),
  KEY `idx_cost_per_unit` (`cost_per_unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_cost_summary`
--

LOCK TABLES `production_cost_summary` WRITE;
/*!40000 ALTER TABLE `production_cost_summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_cost_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_order_consumption`
--

DROP TABLE IF EXISTS `production_order_consumption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_order_consumption` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `consumed_type` enum('ingredient','sub_recipe','mid_prep') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `consumed_item_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `for_item_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_before` decimal(10,3) NOT NULL,
  `quantity_after` decimal(10,3) NOT NULL,
  `quantity_consumed` decimal(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `production_order_consumption_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `production_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_order_consumption`
--

LOCK TABLES `production_order_consumption` WRITE;
/*!40000 ALTER TABLE `production_order_consumption` DISABLE KEYS */;
INSERT INTO `production_order_consumption` VALUES (1,1,'ingredient','Base Milk Ice cream','Legacy Item',70.000,20.000,50.000),(2,2,'ingredient','Base Milk Ice cream','Legacy Item',20.000,10.000,10.000),(3,3,'sub_recipe','Carrot Cake Base','Legacy Item',100.000,99.000,1.000),(4,3,'sub_recipe',' Cream Pastry ','Legacy Item',100.000,99.000,1.000),(5,4,'ingredient','Base Milk Ice cream','Legacy Item',10.000,0.000,10.000),(6,4,'sub_recipe','Chocolate Fudge Cake','Legacy Item',100.000,90.000,10.000),(7,4,'sub_recipe','Chocolate CreamMix','Legacy Item',100.000,95.000,5.000),(8,5,'sub_recipe','Carrot Cake Base','Carrot-mid',99.000,98.000,1.000),(9,5,'sub_recipe',' Cream Pastry ','Carrot-mid',99.000,98.000,1.000),(10,6,'ingredient','Base Milk Ice cream','chocolate mid test',0.000,0.000,0.000),(11,6,'sub_recipe','Chocolate Fudge Cake','chocolate mid test',90.000,90.000,0.000),(12,6,'sub_recipe','Chocolate CreamMix','chocolate mid test',95.000,95.000,0.000),(13,6,'sub_recipe','Carrot Cake Base','Carrot-mid',98.000,97.000,1.000),(14,6,'sub_recipe',' Cream Pastry ','Carrot-mid',98.000,97.000,1.000),(15,9,'sub_recipe','Carrot Cake Base','Carrot-mid',97.000,96.000,1.000),(16,9,'sub_recipe',' Cream Pastry ','Carrot-mid',97.000,96.000,1.000),(17,9,'ingredient','Base Milk Ice cream','chocolate mid test',100.000,90.000,10.000),(18,9,'sub_recipe','Chocolate Fudge Cake','chocolate mid test',90.000,80.000,10.000),(19,9,'sub_recipe','Chocolate CreamMix','chocolate mid test',95.000,90.000,5.000),(20,11,'sub_recipe',' Barlinah ','Frozen Chocolate cake big',101.000,100.930,0.070),(21,11,'sub_recipe','Chocolate Fudge Cake','Frozen Chocolate cake big',80.000,78.800,1.200),(22,11,'sub_recipe','Chocolate CreamMix','Frozen Chocolate cake big',90.000,88.900,1.100),(23,11,'sub_recipe','Dakwaz Hazelnut','Frozen Chocolate cake big',100.000,99.840,0.160),(24,11,'sub_recipe',' Croquant Vuttin ','Frozen Chocolate cake big',101.000,100.920,0.080),(25,11,'sub_recipe',' Syrup Chocolate ','Frozen Chocolate cake big',101.000,100.820,0.180),(26,12,'sub_recipe',' Barlinah ','Frozen Chocolate cake big',100.930,100.860,0.070),(27,12,'sub_recipe','Chocolate Fudge Cake','Frozen Chocolate cake big',78.800,77.600,1.200),(28,12,'sub_recipe','Chocolate CreamMix','Frozen Chocolate cake big',88.900,87.800,1.100),(29,12,'sub_recipe','Dakwaz Hazelnut','Frozen Chocolate cake big',99.840,99.680,0.160),(30,12,'sub_recipe',' Croquant Vuttin ','Frozen Chocolate cake big',100.920,100.840,0.080),(31,12,'sub_recipe',' Syrup Chocolate ','Frozen Chocolate cake big',100.820,100.640,0.180),(32,15,'ingredient','Milk Elmaraai',' Chocolate Sauce ',100.000,95.000,5.000),(33,15,'ingredient','Dark Chocolate',' Chocolate Sauce ',100.000,97.500,2.500),(34,15,'ingredient','Crystal Oil Sun Flower',' Chocolate Sauce ',100.000,98.000,2.000),(35,16,'mid_prep','Frozen Chocolate cake big','Big chocolate praline cake',2.000,1.000,1.000),(36,16,'ingredient','Blueberry Fresh ','Big chocolate praline cake',100.000,99.980,0.020),(37,16,'ingredient','Chocolate Sauce','Big chocolate praline cake',100.000,99.750,0.250),(38,17,'mid_prep','Frozen Chocolate cake big','Big chocolate praline cake',1.000,0.000,1.000),(39,17,'ingredient','Blueberry Fresh ','Big chocolate praline cake',99.980,99.960,0.020),(40,17,'ingredient','Chocolate Sauce','Big chocolate praline cake',99.750,99.500,0.250),(41,17,'sub_recipe',' New Glaze ','Big chocolate praline cake',100.000,99.800,0.200),(42,17,'sub_recipe','  Dark Ganache ','Big chocolate praline cake',100.000,99.600,0.400),(43,18,'sub_recipe',' Barlinah ','Frozen Chocolate cake big',100.860,100.790,0.070),(44,18,'sub_recipe','Chocolate Fudge Cake','Frozen Chocolate cake big',77.600,76.400,1.200),(45,18,'sub_recipe','Chocolate CreamMix','Frozen Chocolate cake big',87.800,86.700,1.100),(46,18,'sub_recipe','Dakwaz Hazelnut','Frozen Chocolate cake big',99.680,99.520,0.160),(47,18,'sub_recipe',' Croquant Vuttin ','Frozen Chocolate cake big',100.840,100.760,0.080),(48,18,'sub_recipe',' Syrup Chocolate ','Frozen Chocolate cake big',100.640,100.460,0.180),(49,19,'mid_prep','Frozen Chocolate cake big','Big chocolate praline cake',1.000,0.000,1.000),(50,19,'ingredient','Blueberry Fresh ','Big chocolate praline cake',99.960,99.940,0.020),(51,19,'ingredient','Chocolate Sauce','Big chocolate praline cake',99.500,99.250,0.250),(52,19,'sub_recipe',' New Glaze ','Big chocolate praline cake',99.800,99.600,0.200),(53,19,'sub_recipe','  Dark Ganache ','Big chocolate praline cake',99.600,99.200,0.400),(54,20,'sub_recipe',' Barlinah ','Frozen Chocolate cake big',100.790,100.720,0.070),(55,20,'sub_recipe','Chocolate Fudge Cake','Frozen Chocolate cake big',76.400,75.200,1.200),(56,20,'sub_recipe','Chocolate CreamMix','Frozen Chocolate cake big',86.700,85.600,1.100),(57,20,'sub_recipe','Dakwaz Hazelnut','Frozen Chocolate cake big',99.520,99.360,0.160),(58,20,'sub_recipe',' Croquant Vuttin ','Frozen Chocolate cake big',100.760,100.680,0.080),(59,20,'sub_recipe',' Syrup Chocolate ','Frozen Chocolate cake big',100.460,100.280,0.180),(60,21,'mid_prep','Frozen Chocolate cake big','Big chocolate praline cake',1.000,0.000,1.000),(61,21,'ingredient','Blueberry Fresh ','Big chocolate praline cake',99.940,99.920,0.020),(62,21,'ingredient','Chocolate Sauce','Big chocolate praline cake',99.250,99.000,0.250),(63,21,'sub_recipe',' New Glaze ','Big chocolate praline cake',99.600,99.400,0.200),(64,21,'sub_recipe','  Dark Ganache ','Big chocolate praline cake',99.200,98.800,0.400),(65,23,'sub_recipe',' Barlinah ','Frozen Chocolate cake big',100.720,100.650,0.070),(66,23,'sub_recipe','Chocolate Fudge Cake','Frozen Chocolate cake big',75.200,74.000,1.200),(67,23,'sub_recipe','Chocolate CreamMix','Frozen Chocolate cake big',85.600,84.500,1.100),(68,23,'sub_recipe','Dakwaz Hazelnut','Frozen Chocolate cake big',99.360,99.200,0.160),(69,23,'sub_recipe',' Croquant Vuttin ','Frozen Chocolate cake big',100.680,100.600,0.080),(70,23,'sub_recipe',' Syrup Chocolate ','Frozen Chocolate cake big',100.280,100.100,0.180),(71,24,'mid_prep','Frozen Chocolate cake big','Big chocolate praline cake',1.000,0.000,1.000),(72,24,'ingredient','Blueberry Fresh ','Big chocolate praline cake',99.920,99.900,0.020),(73,24,'ingredient','Chocolate Sauce','Big chocolate praline cake',99.000,98.750,0.250),(74,24,'sub_recipe',' New Glaze ','Big chocolate praline cake',99.400,99.200,0.200),(75,24,'sub_recipe','  Dark Ganache ','Big chocolate praline cake',98.800,98.400,0.400),(76,25,'sub_recipe',' Barlinah ','Frozen Chocolate cake big',100.650,100.580,0.070),(77,25,'sub_recipe','Chocolate Fudge Cake','Frozen Chocolate cake big',74.000,72.800,1.200),(78,25,'sub_recipe','Chocolate CreamMix','Frozen Chocolate cake big',84.500,83.400,1.100),(79,25,'sub_recipe','Dakwaz Hazelnut','Frozen Chocolate cake big',99.200,99.040,0.160),(80,25,'sub_recipe',' Croquant Vuttin ','Frozen Chocolate cake big',100.600,100.520,0.080),(81,25,'sub_recipe',' Syrup Chocolate ','Frozen Chocolate cake big',100.100,99.920,0.180),(82,26,'sub_recipe',' Barlinah ','Frozen Chocolate cake big',100.580,100.510,0.070),(83,26,'sub_recipe','Chocolate Fudge Cake','Frozen Chocolate cake big',72.800,71.600,1.200),(84,26,'sub_recipe','Chocolate CreamMix','Frozen Chocolate cake big',83.400,82.300,1.100),(85,26,'sub_recipe','Dakwaz Hazelnut','Frozen Chocolate cake big',99.040,98.880,0.160),(86,26,'sub_recipe',' Croquant Vuttin ','Frozen Chocolate cake big',100.520,100.440,0.080),(87,26,'sub_recipe',' Syrup Chocolate ','Frozen Chocolate cake big',99.920,99.740,0.180),(88,27,'mid_prep','Frozen Chocolate cake big','Big chocolate praline cake',2.000,1.000,1.000),(89,27,'ingredient','Blueberry Fresh ','Big chocolate praline cake',99.900,99.880,0.020),(90,27,'ingredient','Chocolate Sauce','Big chocolate praline cake',98.750,98.500,0.250),(91,27,'sub_recipe',' New Glaze ','Big chocolate praline cake',99.200,99.000,0.200),(92,27,'sub_recipe','  Dark Ganache ','Big chocolate praline cake',98.400,98.000,0.400),(93,28,'sub_recipe',' Barlinah ','Frozen Chocolate cake big',100.510,100.440,0.070),(94,28,'sub_recipe','Chocolate Fudge Cake','Frozen Chocolate cake big',71.600,70.400,1.200),(95,28,'sub_recipe','Chocolate CreamMix','Frozen Chocolate cake big',82.300,81.200,1.100),(96,28,'sub_recipe','Dakwaz Hazelnut','Frozen Chocolate cake big',98.880,98.720,0.160),(97,28,'sub_recipe',' Croquant Vuttin ','Frozen Chocolate cake big',100.440,100.360,0.080),(98,28,'sub_recipe',' Syrup Chocolate ','Frozen Chocolate cake big',99.740,99.560,0.180),(99,29,'mid_prep','Frozen Chocolate cake big','Big chocolate praline cake',2.000,1.000,1.000),(100,29,'ingredient','Blueberry Fresh ','Big chocolate praline cake',99.880,99.860,0.020),(101,29,'ingredient','Chocolate Sauce','Big chocolate praline cake',98.500,98.250,0.250),(102,29,'sub_recipe',' New Glaze ','Big chocolate praline cake',99.000,98.800,0.200),(103,29,'sub_recipe','  Dark Ganache ','Big chocolate praline cake',98.000,97.600,0.400);
/*!40000 ALTER TABLE `production_order_consumption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_order_consumption_backup`
--

DROP TABLE IF EXISTS `production_order_consumption_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_order_consumption_backup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `consumed_type` enum('ingredient','sub_recipe','mid_prep') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `consumed_item_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_before` decimal(10,3) NOT NULL,
  `quantity_after` decimal(10,3) NOT NULL,
  `quantity_consumed` decimal(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_order_consumption_backup`
--

LOCK TABLES `production_order_consumption_backup` WRITE;
/*!40000 ALTER TABLE `production_order_consumption_backup` DISABLE KEYS */;
INSERT INTO `production_order_consumption_backup` VALUES (1,1,'ingredient','Base Milk Ice cream',70.000,20.000,50.000),(2,2,'ingredient','Base Milk Ice cream',20.000,10.000,10.000),(3,3,'sub_recipe','Carrot Cake Base',100.000,99.000,1.000),(4,3,'sub_recipe',' Cream Pastry ',100.000,99.000,1.000),(5,4,'ingredient','Base Milk Ice cream',10.000,0.000,10.000),(6,4,'sub_recipe','Chocolate Fudge Cake',100.000,90.000,10.000),(7,4,'sub_recipe','Chocolate CreamMix',100.000,95.000,5.000);
/*!40000 ALTER TABLE `production_order_consumption_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_orders`
--

DROP TABLE IF EXISTS `production_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `production_type` enum('mid_prep','sub_recipe','cake') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `total_items_produced` decimal(10,3) NOT NULL DEFAULT '0.000',
  `warehouse_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `production_orders_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_orders`
--

LOCK TABLES `production_orders` WRITE;
/*!40000 ALTER TABLE `production_orders` DISABLE KEYS */;
INSERT INTO `production_orders` VALUES (1,'mid_prep','Migrated Mid-Prep: chocolate mid test','✅ Produced: chocolate mid test (×5.000)',5.000,2,1,'2025-05-28 17:28:24'),(2,'mid_prep','Migrated Mid-Prep: chocolate mid test','✅ Produced: chocolate mid test (×1.000)',1.000,2,1,'2025-05-28 17:31:50'),(3,'mid_prep','Migrated Mid-Prep: Carrot-mid','✅ Produced: Carrot-mid (×1.000)',1.000,2,1,'2025-05-28 17:37:21'),(4,'mid_prep','Migrated Mid-Prep: chocolate mid test','✅ Produced: chocolate mid test (×1.000)',1.000,2,1,'2025-05-28 17:37:21'),(5,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Carrot-mid (×1.0)',1.000,2,1,'2025-05-28 17:43:45'),(6,'mid_prep','Bulk Mid-Prep: 1 successful, 1 failed','✅ Success: Carrot-mid (×1.0) | ❌ Failed: chocolate mid test (×1.0)',1.000,2,1,'2025-05-28 17:43:59'),(7,'mid_prep','Failed Mid-Prep: 2 items','❌ Failed validation: Carrot-mid (×1.0), chocolate mid test (×1.0)',0.000,2,1,'2025-05-28 17:49:17'),(8,'mid_prep','Failed Mid-Prep: 2 items','❌ Failed validation: Carrot-mid (×1.0), chocolate mid test (×1.0)',0.000,2,1,'2025-05-28 17:51:32'),(9,'mid_prep','Bulk Mid-Prep: 2 items','✅ Produced: Carrot-mid (×1.0), chocolate mid test (×1.0)',2.000,2,1,'2025-05-28 18:04:58'),(10,'sub_recipe','Failed Sub-Recipe: 3 items','❌ Failed validation:  Caramel Toffee  (×1.0),  Caramel Sauce  (×1.0),  Date Cake Glaze Caramel  (×1.0)',0.000,2,1,'2025-05-28 18:54:49'),(11,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Frozen Chocolate cake big (×1.0)',1.000,2,1,'2025-05-28 19:02:05'),(12,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Frozen Chocolate cake big (×1.0)',1.000,2,1,'2025-05-28 19:51:43'),(13,'cake','Failed Cake: 1 items','❌ Failed validation: Big chocolate praline cake (×1.0)',0.000,2,1,'2025-05-28 19:52:17'),(14,'sub_recipe','Failed Sub-Recipe: 1 items','❌ Failed validation:  Chocolate Sauce  (×10.0)',0.000,2,1,'2025-05-28 19:52:53'),(15,'sub_recipe','Bulk Sub-Recipe: 1 items','✅ Produced:  Chocolate Sauce  (×10.0)',1.000,2,1,'2025-05-28 20:02:12'),(16,'cake','Bulk Cake: 1 items','✅ Produced: Big chocolate praline cake (×1.0)',1.000,2,1,'2025-05-28 20:02:19'),(17,'cake','Bulk Cake: 1 items','✅ Produced: Big chocolate praline cake (×1.0)',1.000,2,1,'2025-05-28 20:05:18'),(18,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Frozen Chocolate cake big (×1.0)',1.000,2,1,'2025-05-28 20:18:02'),(19,'cake','Bulk Cake: 1 items','✅ Produced: Big chocolate praline cake (×1.0)',1.000,2,1,'2025-05-28 20:18:23'),(20,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Frozen Chocolate cake big (×1.0)',1.000,2,1,'2025-05-28 20:41:03'),(21,'cake','Bulk Cake: 1 items','✅ Produced: Big chocolate praline cake (×1.0)',1.000,2,1,'2025-05-28 20:41:17'),(22,'cake','Failed Cake: 1 items','❌ Failed validation: Big chocolate praline cake (×1.0)',0.000,2,1,'2025-05-28 20:56:18'),(23,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Frozen Chocolate cake big (×1.0)',1.000,2,1,'2025-05-28 20:56:38'),(24,'cake','Bulk Cake: 1 items','✅ Produced: Big chocolate praline cake (×1.0)',1.000,2,1,'2025-05-28 20:56:44'),(25,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Frozen Chocolate cake big (×1.0)',1.000,2,1,'2025-05-29 11:46:36'),(26,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Frozen Chocolate cake big (×1.0)',1.000,2,1,'2025-05-29 11:53:42'),(27,'cake','Bulk Cake: 1 items','✅ Produced: Big chocolate praline cake (×1.0)',1.000,2,1,'2025-05-29 11:54:55'),(28,'mid_prep','Bulk Mid-Prep: 1 items','✅ Produced: Frozen Chocolate cake big (×1.0)',1.000,2,1,'2025-05-30 09:53:35'),(29,'cake','Bulk Cake: 1 items','✅ Produced: Big chocolate praline cake (×1.0)',1.000,2,1,'2025-05-30 09:53:53');
/*!40000 ALTER TABLE `production_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_orders_backup`
--

DROP TABLE IF EXISTS `production_orders_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_orders_backup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `production_type` enum('mid_prep','sub_recipe','cake') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_produced` decimal(10,3) NOT NULL,
  `warehouse_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `production_orders_backup_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_orders_backup`
--

LOCK TABLES `production_orders_backup` WRITE;
/*!40000 ALTER TABLE `production_orders_backup` DISABLE KEYS */;
INSERT INTO `production_orders_backup` VALUES (1,'mid_prep','chocolate mid test',5.000,2,1,'2025-05-28 17:28:24'),(2,'mid_prep','chocolate mid test',1.000,2,1,'2025-05-28 17:31:50'),(3,'mid_prep','Carrot-mid',1.000,2,1,'2025-05-28 17:37:21'),(4,'mid_prep','chocolate mid test',1.000,2,1,'2025-05-28 17:37:21');
/*!40000 ALTER TABLE `production_orders_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity_ordered` decimal(12,3) NOT NULL,
  `unit_price` decimal(12,4) NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `quantity_received` decimal(12,3) DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  KEY `idx_po_items_price` (`item_id`,`unit_price`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES (1,1,80,4.000,15.0000,60.00,NULL,'pending'),(2,2,86,5.000,20.0000,100.00,NULL,'pending'),(3,3,86,20.000,20.0000,400.00,NULL,'pending'),(4,3,83,20.000,50.0000,1000.00,NULL,'pending'),(5,4,80,598.000,15.0000,8970.00,NULL,'pending'),(6,5,77,50.000,100.0000,5000.00,NULL,'pending'),(7,6,87,20.000,50.0000,1000.00,NULL,'pending'),(8,7,87,10.000,50.0000,500.00,NULL,'pending'),(9,8,13,50.000,20.0000,1000.00,NULL,'pending'),(10,9,84,5.000,5.0000,25.00,NULL,'pending'),(11,10,80,55.000,15.0000,825.00,NULL,'pending'),(12,11,83,15.000,20.0000,300.00,NULL,'pending'),(13,12,80,1.000,15.0000,15.00,NULL,'pending'),(14,12,68,1.000,15.0000,15.00,NULL,'pending'),(15,12,14,1.000,20.0000,20.00,NULL,'pending'),(16,13,83,10.000,153.0000,1530.00,NULL,'pending'),(17,14,47,5.000,1276.8000,6384.00,NULL,'pending'),(18,15,68,15.000,135.0000,2025.00,NULL,'pending'),(19,16,80,5.000,15.0000,75.00,NULL,'pending'),(20,17,3,10.000,25.0000,250.00,NULL,'pending'),(21,18,1,10.000,110.0000,1100.00,NULL,'pending'),(22,19,1,1.000,110.0000,110.00,NULL,'pending'),(23,20,9,1.000,125.1400,125.14,NULL,'pending'),(24,21,1,1.000,110.0000,110.00,1.000,'received'),(25,21,4,1.000,428.9600,428.96,1.000,'received'),(26,21,10,1.000,86.0500,86.05,1.000,'received'),(27,22,1,50.000,110.0000,5500.00,50.000,'received');
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `order_date` date NOT NULL,
  `expected_date` date DEFAULT NULL,
  `status` enum('Pending','Received','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `payment_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `payment_date` datetime DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `payment_cheque_id` int DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `warehouse_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `received_date` datetime DEFAULT NULL,
  `received_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `fk_purchase_orders_warehouse` (`warehouse_id`),
  KEY `fk_purchase_orders_received_by_user` (`received_by`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `fk_paid_by` (`paid_by`),
  KEY `fk_payment_cheque` (`payment_cheque_id`),
  CONSTRAINT `fk_paid_by` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payment_cheque` FOREIGN KEY (`payment_cheque_id`) REFERENCES `cheques` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_purchase_orders_received_by_user` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_purchase_orders_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (1,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,60.00,1,'2025-05-25 05:57:10','2025-06-15 18:06:40',NULL,NULL),(2,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,100.00,1,'2025-05-25 06:23:29','2025-06-15 18:06:40',NULL,NULL),(3,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,1400.00,1,'2025-05-25 06:59:09','2025-06-15 18:06:40',NULL,NULL),(4,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,8970.00,1,'2025-05-25 07:09:06','2025-06-15 18:06:40',NULL,NULL),(5,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,5000.00,1,'2025-05-25 07:13:32','2025-06-15 18:06:40',NULL,NULL),(6,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,1000.00,1,'2025-05-25 07:15:45','2025-06-15 18:06:40',NULL,NULL),(7,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,500.00,1,'2025-05-25 07:17:40','2025-06-15 18:06:40',NULL,NULL),(8,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,1000.00,1,'2025-05-25 07:24:01','2025-06-15 18:06:40',NULL,NULL),(9,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,25.00,1,'2025-05-25 07:28:54','2025-06-15 18:06:40',NULL,NULL),(10,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,825.00,1,'2025-05-25 10:04:13','2025-06-15 18:06:40',NULL,NULL),(11,2,'2025-05-25','2025-05-25','Received','unpaid',NULL,NULL,NULL,300.00,1,'2025-05-25 10:07:59','2025-06-15 18:06:40',NULL,NULL),(12,2,'2025-05-25','2025-05-28','Received','unpaid',NULL,NULL,NULL,50.00,1,'2025-05-25 11:21:03','2025-06-15 18:06:40',NULL,NULL),(13,2,'2025-05-26','2025-05-26','Received','unpaid',NULL,NULL,NULL,1530.00,1,'2025-05-26 17:48:24','2025-06-15 18:06:40',NULL,NULL),(14,2,'2025-05-26','2025-05-26','Received','unpaid',NULL,NULL,NULL,6384.00,1,'2025-05-26 18:20:46','2025-06-15 18:06:40',NULL,NULL),(15,2,'2025-05-26','2025-05-26','Received','unpaid',NULL,NULL,NULL,675.00,1,'2025-05-26 18:32:55','2025-06-15 18:06:40',NULL,NULL),(16,2,'2025-06-12','2025-06-15','Pending','unpaid',NULL,NULL,NULL,75.00,1,'2025-06-12 15:45:29','2025-06-15 18:06:40',NULL,NULL),(17,2,'2025-06-12','2025-06-19','Pending','unpaid',NULL,NULL,NULL,250.00,1,'2025-06-12 15:47:39','2025-06-15 18:06:40',NULL,NULL),(18,2,'2025-06-12','2025-06-23','Pending','unpaid',NULL,NULL,NULL,1100.00,1,'2025-06-12 18:23:24','2025-06-15 18:06:40',NULL,NULL),(19,2,'2025-06-12','2025-06-12','Pending','unpaid',NULL,NULL,NULL,110.00,1,'2025-06-12 19:58:05','2025-06-15 18:06:40',NULL,NULL),(20,2,'2025-06-12','2025-06-12','Pending','paid','2025-06-21 13:27:01',1,198,125.14,1,'2025-06-12 20:10:00','2025-06-21 10:27:01',NULL,NULL),(21,2,'2025-06-15','2025-06-15','Received','paid','2025-06-19 14:04:23',1,149,625.01,1,'2025-06-15 16:47:51','2025-06-19 11:04:23','2025-06-15 19:19:09',1),(22,2,'2025-06-15','2025-06-15','Received','paid','2025-06-19 09:12:34',1,113,5500.00,1,'2025-06-15 16:58:16','2025-06-19 06:12:33','2025-06-15 18:55:16',1);
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receiving_items`
--

DROP TABLE IF EXISTS `receiving_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receiving_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receiving_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity_received` decimal(12,3) NOT NULL,
  `warehouse_id` int NOT NULL,
  `unit_cost` decimal(12,4) DEFAULT NULL,
  `total_cost` decimal(12,2) DEFAULT NULL,
  `batch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `receiving_id` (`receiving_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `receiving_items_ibfk_2` (`item_id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `receiving_items_ibfk_1` FOREIGN KEY (`receiving_id`) REFERENCES `receiving_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `receiving_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `receiving_items_ibfk_3` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `receiving_items_ibfk_4` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receiving_items`
--

LOCK TABLES `receiving_items` WRITE;
/*!40000 ALTER TABLE `receiving_items` DISABLE KEYS */;
INSERT INTO `receiving_items` VALUES (1,1,86,3.000,3,NULL,NULL,NULL),(2,2,86,3.000,3,NULL,NULL,NULL),(3,3,80,3.000,3,NULL,NULL,NULL),(4,4,80,3.000,3,NULL,NULL,NULL),(5,5,80,1.000,3,NULL,NULL,NULL),(6,6,86,2.000,3,NULL,NULL,NULL),(7,7,86,20.000,3,NULL,NULL,NULL),(8,7,83,20.000,3,NULL,NULL,NULL),(9,8,80,598.000,3,NULL,NULL,NULL),(10,9,77,50.000,3,NULL,NULL,NULL),(11,10,87,20.000,3,NULL,NULL,NULL),(12,11,87,5.000,3,NULL,NULL,NULL),(13,12,87,5.000,3,NULL,NULL,NULL),(14,13,13,10.000,3,NULL,NULL,NULL),(15,14,84,2.000,3,NULL,NULL,NULL),(16,15,80,10.000,3,NULL,NULL,NULL),(17,17,83,7.000,3,NULL,NULL,NULL),(18,21,80,1.000,3,NULL,NULL,NULL),(19,21,14,1.000,3,NULL,NULL,NULL),(20,23,83,1.000,3,NULL,NULL,NULL),(21,24,83,2.000,3,NULL,NULL,NULL),(22,26,47,3.000,3,NULL,NULL,NULL),(23,28,68,5.000,3,NULL,NULL,NULL);
/*!40000 ALTER TABLE `receiving_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receiving_logs`
--

DROP TABLE IF EXISTS `receiving_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receiving_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_id` int NOT NULL,
  `received_date` date NOT NULL,
  `received_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_po_id` (`po_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receiving_logs`
--

LOCK TABLES `receiving_logs` WRITE;
/*!40000 ALTER TABLE `receiving_logs` DISABLE KEYS */;
INSERT INTO `receiving_logs` VALUES (1,2,'2025-05-25','current_user','','2025-05-25 06:44:05'),(2,2,'2025-05-25','current_user','','2025-05-25 06:45:51'),(3,1,'2025-05-25','current_user','','2025-05-25 06:47:32'),(4,1,'2025-05-25','current_user','','2025-05-25 06:48:12'),(5,1,'2025-05-25','current_user','','2025-05-25 06:49:10'),(6,2,'2025-05-25','current_user','','2025-05-25 06:49:26'),(7,3,'2025-05-25','admin','','2025-05-25 06:59:47'),(8,4,'2025-05-25','admin','','2025-05-25 07:09:21'),(9,5,'2025-05-25','admin','','2025-05-25 07:14:06'),(10,6,'2025-05-25','admin','','2025-05-25 07:16:03'),(11,7,'2025-05-25','admin','','2025-05-25 07:18:03'),(12,7,'2025-05-25','admin','','2025-05-25 07:19:14'),(13,8,'2025-05-25','admin','','2025-05-25 07:24:24'),(14,9,'2025-05-25','admin','','2025-05-25 07:29:13'),(15,10,'2025-05-25','admin','','2025-05-25 10:04:43'),(16,10,'2025-05-25','admin','Remaining PO amount cancelled','2025-05-25 10:05:01'),(17,11,'2025-05-25','admin','','2025-05-25 10:08:34'),(18,11,'2025-05-25','admin','Remaining PO amount cancelled','2025-05-25 10:11:05'),(21,12,'2025-05-25','admin','','2025-05-25 11:22:20'),(22,12,'2025-05-25','admin','Remaining PO amount cancelled\n\nCancelled quantities details:\nBoosh Honey: 1.0 (من أصل 1.0, تم استلام 0.0)\n\nTotal cancelled value: 15.00','2025-05-25 11:22:48'),(23,13,'2025-05-26','admin','','2025-05-26 17:51:16'),(24,13,'2025-05-26','admin','','2025-05-26 17:52:12'),(25,13,'2025-05-26','admin','Remaining PO amount cancelled\n\nCancelled quantities details:\n Hair Sweetness : 7.0 (من أصل 10.0, تم استلام 3.0)\n\nTotal cancelled value: 1071.00','2025-05-26 17:52:18'),(26,14,'2025-05-26','admin','','2025-05-26 18:21:39'),(27,14,'2025-05-26','admin','Remaining PO amount cancelled\n\nCancelled quantities details:\nBaz Milk Ice cream: 2.0 (من أصل 5.0, تم استلام 3.0)\n\nTotal cancelled value: 2553.60','2025-05-26 18:21:48'),(28,15,'2025-05-26','admin','','2025-05-26 18:33:39'),(29,15,'2025-05-26','admin','Remaining PO amount cancelled\n\nCancelled quantities details:\nBoosh Honey: 10.0 (من أصل 15.0, تم استلام 5.0)\n\nTotal cancelled value: 1350.00','2025-05-26 18:33:46');
/*!40000 ALTER TABLE `receiving_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refund_proofs`
--

DROP TABLE IF EXISTS `refund_proofs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refund_proofs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `bank_receipt_link` text,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cheque_id` (`cheque_id`),
  CONSTRAINT `refund_proofs_ibfk_1` FOREIGN KEY (`cheque_id`) REFERENCES `department_safe_cheques_old` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refund_proofs`
--

LOCK TABLES `refund_proofs` WRITE;
/*!40000 ALTER TABLE `refund_proofs` DISABLE KEYS */;
/*!40000 ALTER TABLE `refund_proofs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin'),(3,'Cost Control'),(15,'Finance'),(4,'User'),(2,'Warehouse Manager');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safe_access`
--

DROP TABLE IF EXISTS `safe_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safe_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `safe_id` int NOT NULL,
  `role_id` int NOT NULL,
  `access_type` enum('read','write','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'read',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_safe_role_access` (`safe_id`,`role_id`),
  KEY `idx_safe_access_safe` (`safe_id`),
  KEY `idx_safe_access_role` (`role_id`),
  CONSTRAINT `safe_access_ibfk_1` FOREIGN KEY (`safe_id`) REFERENCES `safes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `safe_access_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safe_access`
--

LOCK TABLES `safe_access` WRITE;
/*!40000 ALTER TABLE `safe_access` DISABLE KEYS */;
/*!40000 ALTER TABLE `safe_access` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `safe_balances`
--

DROP TABLE IF EXISTS `safe_balances`;
/*!50001 DROP VIEW IF EXISTS `safe_balances`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `safe_balances` AS SELECT 
 1 AS `safe_id`,
 1 AS `safe_name`,
 1 AS `description`,
 1 AS `is_active`,
 1 AS `total_cheques`,
 1 AS `total_expenses`,
 1 AS `available_balance`,
 1 AS `cheque_count`,
 1 AS `expense_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `safe_expenditures`
--

DROP TABLE IF EXISTS `safe_expenditures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safe_expenditures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cheque_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `recipient_type` enum('person','company') DEFAULT NULL,
  `reason` text,
  `vendor_name` varchar(255) DEFAULT NULL,
  `issued_to` varchar(255) DEFAULT NULL,
  `expense_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `logged_by` varchar(255) DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `safe_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cheque_id` (`cheque_id`),
  KEY `category_id` (`category_id`),
  KEY `idx_safe_expenditures_safe` (`safe_id`),
  KEY `idx_safe_expenditures_cheque_id` (`cheque_id`),
  CONSTRAINT `fk_safe_expenditures_cheque` FOREIGN KEY (`cheque_id`) REFERENCES `cheques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_safe_expenditures_safe` FOREIGN KEY (`safe_id`) REFERENCES `safes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `safe_expenditures_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safe_expenditures`
--

LOCK TABLES `safe_expenditures` WRITE;
/*!40000 ALTER TABLE `safe_expenditures` DISABLE KEYS */;
INSERT INTO `safe_expenditures` VALUES (48,89,500.00,20,NULL,NULL,'dasdfa',NULL,NULL,'2025-06-05 01:38:46','admin',NULL,NULL),(49,89,600.00,7,NULL,NULL,'dfs',NULL,NULL,'2025-06-05 01:45:36','admin',NULL,NULL),(50,89,200.00,6,NULL,NULL,'fsd',NULL,NULL,'2025-06-05 02:32:13','admin',NULL,NULL),(51,89,500.00,17,NULL,NULL,'sfdsfsd','dsfd','sads','2025-06-05 22:53:38','admin',NULL,NULL),(52,89,200.00,17,NULL,NULL,'sfdsfsd','dsfd','sads','2025-06-05 23:27:03','admin',NULL,NULL);
/*!40000 ALTER TABLE `safe_expenditures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safe_transactions`
--

DROP TABLE IF EXISTS `safe_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safe_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `safe_id` int NOT NULL,
  `transaction_type` enum('cheque_added','cheque_removed','expense_logged','expense_deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cheque_id` int DEFAULT NULL,
  `expense_id` int DEFAULT NULL,
  `amount` decimal(15,4) NOT NULL,
  `balance_before` decimal(15,4) NOT NULL,
  `balance_after` decimal(15,4) NOT NULL,
  `performed_by` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cheque_id` (`cheque_id`),
  KEY `expense_id` (`expense_id`),
  KEY `performed_by` (`performed_by`),
  KEY `idx_safe_transactions_safe` (`safe_id`),
  KEY `idx_safe_transactions_date` (`created_at`),
  CONSTRAINT `safe_transactions_cheque_fk` FOREIGN KEY (`cheque_id`) REFERENCES `cheques` (`id`) ON DELETE SET NULL,
  CONSTRAINT `safe_transactions_ibfk_1` FOREIGN KEY (`safe_id`) REFERENCES `safes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `safe_transactions_ibfk_3` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `safe_transactions_ibfk_4` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safe_transactions`
--

LOCK TABLES `safe_transactions` WRITE;
/*!40000 ALTER TABLE `safe_transactions` DISABLE KEYS */;
INSERT INTO `safe_transactions` VALUES (49,1,'cheque_added',89,NULL,1000.0000,0.0000,1000.0000,1,'Cheque assigned to safe','2025-06-04 22:35:33'),(50,1,'expense_logged',NULL,NULL,500.0000,500.0000,0.0000,1,'New expense: dasdfa','2025-06-04 22:38:45'),(51,1,'cheque_added',90,NULL,1000.0000,500.0000,1500.0000,1,'Cheque assigned to safe','2025-06-04 22:41:15'),(52,1,'expense_logged',NULL,NULL,600.0000,900.0000,300.0000,1,'New expense: dfs','2025-06-04 22:45:35'),(53,1,'expense_logged',NULL,NULL,200.0000,700.0000,500.0000,1,'New expense: fsd','2025-06-04 23:32:13');
/*!40000 ALTER TABLE `safe_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safes`
--

DROP TABLE IF EXISTS `safes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `initial_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `current_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `created_by` (`created_by`),
  KEY `idx_safe_name` (`name`),
  KEY `idx_safe_active` (`is_active`),
  CONSTRAINT `safes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safes`
--

LOCK TABLES `safes` WRITE;
/*!40000 ALTER TABLE `safes` DISABLE KEYS */;
INSERT INTO `safes` VALUES (1,'General Safe','Default safe for all cheques and expenses',1,'2025-06-03 03:52:32','2025-06-23 20:03:00',1,0.00,63881.00),(2,'Finance safe','',NULL,'2025-06-10 20:17:36','2025-06-17 20:52:43',1,0.00,10000.00);
/*!40000 ALTER TABLE `safes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `sale_time` datetime DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `source` varchar(50) DEFAULT 'Foodics',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  KEY `sales_ibfk_2` (`product_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `search_analytics`
--

DROP TABLE IF EXISTS `search_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `search_analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `search_query` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `search_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `results_count` int DEFAULT '0',
  `search_time_ms` int DEFAULT NULL,
  `clicked_result_id` int DEFAULT NULL,
  `clicked_result_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_query` (`search_query`),
  KEY `idx_type` (`search_type`),
  KEY `idx_user` (`user_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `search_analytics`
--

LOCK TABLES `search_analytics` WRITE;
/*!40000 ALTER TABLE `search_analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `search_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ingredient_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `change` decimal(10,3) NOT NULL,
  `reason` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime NOT NULL,
  `weight_per_item` decimal(10,3) DEFAULT '1.000' COMMENT 'Weight per item moved',
  `total_weight` decimal(12,3) DEFAULT NULL COMMENT 'Total weight moved (calculated: quantity × weight_per_item)',
  `package_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Information about package used (name, supplier, etc.)',
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `stock_movements_ibfk_1` (`ingredient_id`),
  KEY `fk_stock_movements_user` (`user_id`),
  CONSTRAINT `fk_stock_movements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,86,3,1.000,'Manual Update','2025-05-23 01:03:03',1.000,1.000,NULL,NULL),(2,80,3,1.000,'تحديث يدوي','2025-05-23 12:22:45',1.000,1.000,NULL,NULL),(3,80,3,2.000,'System Adjustment (Negative Stock Fix)','2025-05-24 09:24:20',1.000,2.000,NULL,NULL),(4,89,3,1.000,'System Adjustment (Negative Stock Fix)','2025-05-24 09:24:20',1.000,1.000,NULL,NULL),(5,80,3,1.000,'Manual Update','2025-05-24 09:34:32',1.000,1.000,NULL,NULL),(6,80,3,4.000,'Manual Update','2025-05-24 09:46:12',1.000,4.000,NULL,NULL),(7,8,2,-1.000,'Approved Waste','2025-05-24 23:55:07',1.000,1.000,NULL,NULL),(8,8,2,-2.000,'Approved Waste','2025-05-24 23:55:55',1.000,2.000,NULL,NULL),(9,80,2,-1.000,'Approved Waste','2025-05-25 14:13:10',1.000,1.000,NULL,NULL),(10,114,3,48.000,'Manual Update (2.0x Niho Pallet)','2025-05-26 00:36:43',1.000,48.000,NULL,NULL),(11,114,3,265.000,'Manual Update (10.0x Niho Pallet)','2025-05-26 11:46:09',1.000,265.000,NULL,NULL),(12,89,3,500.000,'Manual Update','2025-05-26 13:13:05',1.000,NULL,NULL,NULL),(13,86,3,701.000,'Manual Update','2025-05-26 13:13:14',1.000,NULL,NULL,NULL),(14,116,3,240.000,'Manual Update (10.0x KeboBox)','2025-05-26 20:27:00',1.000,NULL,NULL,NULL),(15,14,3,3274.000,'Manual Update (131.0x بلوك, 3275.0000 kilo)','2025-05-27 15:22:23',1.000,NULL,NULL,NULL),(16,52,2,100.000,'Manual Update','2025-05-28 20:48:49',1.000,NULL,NULL,NULL),(17,120,2,-101.000,'Manual Update','2025-05-28 23:57:42',1.000,NULL,NULL,NULL);
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_recipe_batches`
--

DROP TABLE IF EXISTS `sub_recipe_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_recipe_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sub_recipe_id` int NOT NULL,
  `quantity_produced` decimal(10,3) NOT NULL,
  `warehouse_id` int NOT NULL,
  `produced_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sub_recipe_id` (`sub_recipe_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `sub_recipe_batches_ibfk_1` FOREIGN KEY (`sub_recipe_id`) REFERENCES `sub_recipes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sub_recipe_batches_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_recipe_batches`
--

LOCK TABLES `sub_recipe_batches` WRITE;
/*!40000 ALTER TABLE `sub_recipe_batches` DISABLE KEYS */;
INSERT INTO `sub_recipe_batches` VALUES (1,7,1.000,2,'2025-05-28 17:16:51'),(2,43,1.000,2,'2025-05-28 17:16:51'),(3,6,1.000,2,'2025-05-28 17:16:51'),(4,11,1.000,2,'2025-05-28 17:16:51'),(5,10,10.000,2,'2025-05-28 20:02:12');
/*!40000 ALTER TABLE `sub_recipe_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_recipe_ingredients`
--

DROP TABLE IF EXISTS `sub_recipe_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_recipe_ingredients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sub_recipe_id` int NOT NULL,
  `ingredient_id` int NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sub_recipe_id` (`sub_recipe_id`),
  KEY `ingredient_id` (`ingredient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=472 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_recipe_ingredients`
--

LOCK TABLES `sub_recipe_ingredients` WRITE;
/*!40000 ALTER TABLE `sub_recipe_ingredients` DISABLE KEYS */;
INSERT INTO `sub_recipe_ingredients` VALUES (1,1,2,2.400),(2,1,3,3.600),(3,1,4,0.100),(4,1,5,2.560),(5,1,6,0.050),(6,1,7,0.000),(7,1,8,0.020),(8,1,9,0.070),(9,1,10,0.050),(10,1,11,3.120),(11,1,12,0.720),(12,1,13,3.600),(13,2,14,0.200),(14,2,15,0.360),(15,2,16,0.720),(16,2,4,0.020),(17,3,17,0.280),(18,3,3,0.280),(19,3,15,0.280),(20,3,18,0.240),(21,3,11,0.055),(22,3,4,0.020),(23,4,19,0.500),(24,4,20,0.010),(25,4,21,0.110),(26,4,3,0.050),(27,4,4,0.007),(28,4,22,0.140),(29,4,23,0.080),(30,4,24,0.070),(31,4,14,0.035),(32,5,2,4.500),(33,5,3,3.370),(34,5,5,2.700),(35,5,19,2.700),(36,5,11,2.250),(37,5,20,0.720),(38,5,9,0.130),(39,5,4,0.075),(40,6,25,1.000),(41,6,3,0.750),(42,6,26,0.250),(43,6,27,0.750),(44,6,28,0.800),(45,6,29,0.030),(46,6,5,0.080),(47,7,25,1.800),(48,7,26,0.280),(49,7,3,1.200),(50,8,19,1.000),(51,8,30,0.900),(52,8,31,0.200),(53,8,32,0.100),(54,9,19,3.000),(55,9,26,3.700),(56,9,31,6.800),(57,9,28,4.800),(58,9,33,9.000),(59,9,34,0.500),(60,10,35,0.500),(61,10,36,0.250),(62,10,22,0.250),(63,10,5,0.200),(64,11,26,1.000),(65,11,3,0.600),(66,12,2,2.250),(67,12,3,1.670),(68,12,5,1.350),(69,12,19,1.350),(70,12,11,1.130),(71,12,37,0.590),(72,12,9,0.270),(73,12,4,0.070),(74,13,38,0.700),(75,13,3,0.100),(76,13,34,0.040),(77,13,17,0.150),(78,13,19,0.500),(79,14,39,0.500),(80,14,35,0.050),(81,14,3,0.100),(82,14,2,0.150),(83,14,4,0.010),(84,15,2,1.000),(85,15,3,4.000),(86,15,35,2.200),(87,15,5,1.000),(88,15,4,0.100),(89,15,11,2.500),(90,15,20,0.700),(91,15,9,0.150),(92,15,10,0.200),(93,15,40,0.100),(94,15,26,2.000),(95,16,25,2.000),(96,16,3,1.500),(97,16,41,1.500),(98,16,30,1.600),(99,16,5,0.160),(100,16,29,0.030),(101,16,26,0.500),(102,17,35,10.000),(103,17,19,2.500),(104,17,3,2.000),(105,17,43,0.300),(106,17,20,0.700),(107,17,35,1.000),(108,17,14,0.400),(109,17,44,0.010),(110,18,3,0.500),(111,18,40,0.020),(112,18,26,1.000),(113,19,30,3.000),(114,19,5,0.200),(115,20,35,6.000),(116,20,45,0.065),(117,20,3,1.050),(118,20,46,0.150),(119,20,47,0.050),(120,20,48,0.320),(121,20,19,0.700),(122,21,3,0.600),(123,21,17,0.550),(124,21,4,0.015),(125,21,29,0.040),(126,22,49,12.500),(127,22,26,4.000),(128,22,3,3.100),(129,22,29,0.050),(130,22,32,0.150),(131,22,51,0.070),(132,23,52,0.075),(133,23,3,1.000),(134,23,46,0.150),(135,23,35,5.000),(136,23,53,4.500),(137,23,48,0.300),(138,23,19,0.800),(139,23,54,1.500),(140,24,2,4.500),(141,24,3,3.750),(142,24,55,0.020),(143,24,11,2.624),(144,24,8,0.015),(145,24,9,0.064),(146,24,35,1.000),(147,24,5,0.100),(148,25,56,0.397),(149,26,3,1.100),(150,26,32,0.200),(151,26,4,0.150),(152,26,17,0.550),(153,27,57,0.200),(154,27,56,0.360),(155,27,19,0.440),(156,28,58,0.300),(157,28,59,0.020),(158,29,58,0.300),(159,29,15,0.050),(160,29,40,0.015),(161,30,3,1.200),(162,30,2,0.600),(163,30,14,0.800),(164,30,22,0.450),(165,30,23,0.450),(166,30,11,0.500),(167,30,20,0.070),(168,30,4,0.015),(169,31,14,0.565),(170,31,3,0.365),(171,31,60,0.500),(172,31,61,0.285),(173,31,2,0.250),(174,31,4,0.050),(175,31,62,0.565),(176,31,11,0.740),(177,31,10,0.010),(178,32,14,0.115),(179,32,3,0.050),(180,32,63,0.125),(181,32,2,0.050),(182,32,4,0.010),(183,32,10,0.002),(184,32,11,0.190),(185,32,23,0.020),(186,32,22,0.050),(187,33,26,1.000),(188,33,3,0.600),(189,33,64,0.500),(190,34,35,5.000),(191,34,48,0.300),(192,34,32,0.300),(193,34,47,0.030),(194,34,19,0.800),(195,34,3,1.000),(196,34,44,0.150),(197,35,65,5.000),(198,35,26,2.500),(199,35,51,0.250),(200,35,29,0.050),(201,35,3,1.650),(202,35,32,0.150),(203,36,35,1.000),(204,36,3,0.220),(205,36,48,0.060),(206,36,46,0.030),(207,36,4,0.010),(208,36,20,0.030),(209,36,22,0.130),(210,36,23,0.160),(211,36,19,0.140),(212,36,22,0.200),(213,36,19,0.200),(214,37,35,1.000),(215,37,3,0.210),(216,37,48,0.060),(217,37,46,0.030),(218,37,47,0.010),(219,37,20,0.050),(220,37,23,0.200),(221,37,22,0.080),(222,37,19,0.140),(223,38,66,1.000),(224,38,3,0.200),(225,38,2,0.300),(226,38,19,0.200),(227,38,4,0.010),(228,39,67,2.000),(229,39,14,0.500),(230,39,68,0.500),(231,40,2,0.225),(232,40,3,0.155),(233,40,37,0.025),(234,40,11,0.125),(235,40,55,0.005),(236,41,72,0.050),(237,41,3,0.020),(238,41,26,0.300),(239,42,3,0.200),(240,42,19,0.120),(241,42,68,0.050),(242,42,32,0.050),(243,42,14,0.050),(244,43,3,0.200),(245,43,19,0.100),(246,43,14,0.100),(247,43,26,0.050),(248,44,38,10.000),(249,44,3,4.000),(250,44,34,0.240),(251,44,26,2.220),(252,45,11,1.000),(253,45,14,0.850),(254,45,3,0.020),(255,45,8,0.020),(256,45,73,0.450),(257,46,35,1.000),(258,46,3,0.240),(259,46,21,0.240),(260,46,37,0.100),(261,46,14,0.100),(262,46,34,0.020),(263,46,44,0.020),(264,47,75,0.500),(265,47,60,0.500),(266,47,2,0.250),(267,47,19,0.230),(268,47,5,0.230),(269,47,11,0.380),(270,47,9,0.020),(271,47,6,0.010),(272,47,55,0.000),(274,48,26,0.050),(275,48,19,0.350),(276,48,14,0.050),(277,49,3,1.000),(278,49,26,0.500),(279,49,19,1.000),(280,49,43,0.100),(281,49,34,0.050),(282,50,14,0.040),(283,50,15,0.020),(284,50,11,0.060),(285,51,3,2.000),(286,51,32,0.200),(287,51,26,1.000),(288,52,91,0.900),(289,52,3,0.375),(290,52,32,0.038),(291,52,26,0.188),(292,53,19,1.000),(293,53,31,2.000),(294,54,92,0.050),(297,55,65,0.600),(298,55,3,0.150),(318,57,19,0.050),(319,57,31,0.100),(320,58,19,1.000),(321,58,35,0.100),(322,58,55,0.003),(323,58,43,0.060),(324,59,14,0.900),(325,59,15,1.000),(326,59,96,1.000),(327,59,107,1.000),(335,60,26,2.100),(336,60,3,1.700),(337,60,32,0.250),(338,61,26,0.040),(339,61,35,0.080),(340,61,91,0.500),(341,61,97,0.004),(342,61,11,1.000),(343,61,15,0.075),(344,61,9,0.008),(345,62,91,0.250),(346,62,11,0.250),(347,62,98,0.100),(348,62,68,1.500),(349,62,90,0.200),(350,63,3,1.500),(351,63,26,1.000),(352,63,32,0.400),(353,63,29,0.010),(354,64,19,0.750),(355,64,35,0.250),(356,64,74,0.050),(357,64,96,0.050),(358,64,14,0.050),(359,64,4,0.006),(365,54,19,0.050),(366,54,31,0.100),(367,65,87,0.030),(368,65,19,0.050),(369,65,31,0.100),(370,66,95,0.150),(371,66,92,0.050),(380,56,109,0.015),(381,56,65,0.040),(382,56,3,0.010),(384,56,19,0.050),(385,56,31,0.100),(386,57,110,0.050),(387,57,109,0.015),(389,59,19,0.172),(391,59,35,0.017),(392,59,55,0.006),(394,59,43,0.010),(395,59,9,0.016),(396,59,2,0.100),(398,67,35,0.240),(399,67,3,0.125),(400,67,11,0.017),(401,67,21,0.150),(402,67,14,0.028),(403,67,44,0.010),(404,67,80,0.250),(405,67,19,0.240),(406,67,70,0.080),(407,67,20,0.021),(409,67,1,0.150),(410,67,37,0.025),(411,67,55,0.005),(413,48,89,0.300),(414,68,29,2.300),(415,68,16,2.000),(416,68,111,2.000),(417,68,116,1.000),(418,69,21,1.080),(422,69,19,3.000),(424,69,35,1.000),(426,69,3,0.600),(428,69,44,0.080),(429,70,14,0.320),(431,70,60,0.320),(433,70,21,0.200),(437,70,11,0.400),(439,70,20,0.050),(440,70,9,0.003),(441,70,9,0.003),(442,71,2,0.650),(444,71,14,0.500),(446,71,26,0.500),(448,71,11,0.600),(450,71,8,0.010),(452,71,3,0.020),(453,71,4,0.020),(454,71,4,0.020),(455,72,35,1.800),(457,72,3,0.400),(459,72,11,0.130),(461,72,37,0.130),(463,72,14,0.560),(465,72,21,0.600),(466,72,44,0.030),(467,72,44,0.030),(468,73,7,1.100),(469,73,10,0.002),(471,75,3,1.000);
/*!40000 ALTER TABLE `sub_recipe_ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_recipe_nested`
--

DROP TABLE IF EXISTS `sub_recipe_nested`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_recipe_nested` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_sub_recipe_id` int NOT NULL,
  `sub_recipe_id` int NOT NULL,
  `quantity` decimal(10,4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_sub_recipe_id` (`parent_sub_recipe_id`),
  KEY `sub_recipe_id` (`sub_recipe_id`),
  CONSTRAINT `sub_recipe_nested_ibfk_1` FOREIGN KEY (`parent_sub_recipe_id`) REFERENCES `sub_recipes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sub_recipe_nested_ibfk_2` FOREIGN KEY (`sub_recipe_id`) REFERENCES `sub_recipes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_recipe_nested`
--

LOCK TABLES `sub_recipe_nested` WRITE;
/*!40000 ALTER TABLE `sub_recipe_nested` DISABLE KEYS */;
INSERT INTO `sub_recipe_nested` VALUES (1,66,20,0.9400),(2,66,20,0.9400),(3,75,52,1.0000);
/*!40000 ALTER TABLE `sub_recipe_nested` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_recipe_stock`
--

DROP TABLE IF EXISTS `sub_recipe_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_recipe_stock` (
  `sub_recipe_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `quantity` decimal(10,3) DEFAULT '0.000',
  PRIMARY KEY (`sub_recipe_id`,`warehouse_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `sub_recipe_stock_ibfk_1` FOREIGN KEY (`sub_recipe_id`) REFERENCES `sub_recipes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sub_recipe_stock_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_recipe_stock`
--

LOCK TABLES `sub_recipe_stock` WRITE;
/*!40000 ALTER TABLE `sub_recipe_stock` DISABLE KEYS */;
INSERT INTO `sub_recipe_stock` VALUES (1,2,96.000),(2,2,100.000),(3,2,98.720),(4,2,81.200),(5,2,70.400),(6,2,100.360),(7,2,100.440),(8,2,97.600),(9,2,98.800),(10,2,110.000),(11,2,99.560),(12,2,100.000),(13,2,100.000),(14,2,100.000),(15,2,100.000),(16,2,100.000),(17,2,100.000),(18,2,100.000),(19,2,100.000),(20,2,100.000),(21,2,100.000),(22,2,100.000),(23,2,100.000),(24,2,100.000),(25,2,100.000),(26,2,100.000),(27,2,100.000),(28,2,100.000),(29,2,100.000),(30,2,100.000),(31,2,100.000),(32,2,100.000),(33,2,100.000),(34,2,100.000),(35,2,100.000),(36,2,100.000),(37,2,100.000),(38,2,100.000),(39,2,100.000),(40,2,100.000),(41,2,100.000),(42,2,100.000),(43,2,101.000),(44,2,100.000),(45,2,100.000),(46,2,96.000),(47,2,100.000),(48,2,100.000),(49,2,100.000),(50,2,100.000),(51,2,100.000),(52,2,100.000),(53,2,100.000),(54,2,100.000),(55,2,100.000),(56,2,100.000),(57,2,100.000),(58,2,100.000),(59,2,100.000),(60,2,100.000),(61,2,100.000),(62,2,100.000),(63,2,100.000),(64,2,100.000),(65,2,100.000),(66,2,100.000),(67,2,100.000);
/*!40000 ALTER TABLE `sub_recipe_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_recipe_translations`
--

DROP TABLE IF EXISTS `sub_recipe_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_recipe_translations` (
  `sub_recipe_id` int NOT NULL,
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`sub_recipe_id`,`language`),
  CONSTRAINT `sub_recipe_translations_ibfk_1` FOREIGN KEY (`sub_recipe_id`) REFERENCES `sub_recipes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_recipe_translations`
--

LOCK TABLES `sub_recipe_translations` WRITE;
/*!40000 ALTER TABLE `sub_recipe_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `sub_recipe_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_recipes`
--

DROP TABLE IF EXISTS `sub_recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_recipes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_recipes`
--

LOCK TABLES `sub_recipes` WRITE;
/*!40000 ALTER TABLE `sub_recipes` DISABLE KEYS */;
INSERT INTO `sub_recipes` VALUES (8,'  Dark Ganache '),(7,' Barlinah '),(39,' Biscuit Cheese Cake '),(40,' Biscuit Ladyfinger '),(43,' Caramel Sauce '),(42,' Caramel Toffee '),(14,' Cheese Cake base'),(37,' Chocolate Ice Cream Soft '),(10,' Chocolate Sauce '),(46,' Cream Pastry '),(16,' Croquant Dream Cake'),(6,' Croquant Vuttin '),(47,' Date Cake '),(49,' Date Cake Glaze Caramel '),(48,' Date Cake Sauce '),(36,' Hard Chocolate Ice cream '),(52,' Kunafa dressing '),(51,' Kunafa Honey '),(58,' Maamoul Cream '),(35,' Mango Ice Cream Soft '),(45,' Milfie Dough '),(9,' New Glaze '),(17,' Pudding Dream Cake'),(44,' Raspberry Jam '),(28,' Rose Water Cream '),(50,' Sable '),(18,' Syrup  Dream Cake'),(11,' Syrup Chocolate '),(41,' Syrup Coffey '),(27,' Syrup Tres Leches '),(38,'Abray Cheese Cake '),(62,'Ajamiyya '),(57,'Blueberry Cream'),(30,'Brownies '),(15,'Cake for Dream Cake '),(1,'Carrot Cake Base'),(70,'Chocolate breton Event'),(32,'Chocolate Chip dough '),(4,'Chocolate CreamMix'),(5,'Chocolate Fudge Cake'),(29,'Coffe Cream '),(64,'Cream Filling '),(69,'Creme Brulee sub'),(19,'Crust Layer Dream Cake'),(3,'Dakwaz Hazelnut'),(71,'Dough Profiterole Event'),(25,'Dulce Deleche'),(2,'Frosting'),(66,'Ganache test'),(20,'Ghazal Ice Cream'),(23,'Ice Cream Tres Leches'),(21,'Italian Meringue '),(61,'Kahk dough '),(63,'Kunafa Syrup '),(31,'Lotus Cookies '),(59,'Maamoul Dough'),(56,'Mango Cream'),(55,'Mango Juice'),(22,'Mango Sorbet'),(54,'Marron Cream'),(26,'Marshmallow Flav '),(72,'Pastry Éclair & Profiterole Event'),(65,'Pistachio Cream'),(13,'Rasperry Mousse'),(33,'Syrup Chocolate Outlets '),(60,'Syrup Maamoul '),(68,'test'),(73,'test no sub recipe'),(75,'test sub recipe'),(67,'Tiramisu Sub'),(24,'Tres Leches Cake Base'),(34,'Vanilla Ice Cream Soft '),(12,'White Fudge'),(53,'White ganache ');
/*!40000 ALTER TABLE `sub_recipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_items`
--

DROP TABLE IF EXISTS `supplier_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_items` (
  `supplier_id` int NOT NULL,
  `item_id` int NOT NULL,
  `supplier_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`supplier_id`,`item_id`),
  KEY `supplier_items_ibfk_2` (`item_id`),
  CONSTRAINT `supplier_items_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_items`
--

LOCK TABLES `supplier_items` WRITE;
/*!40000 ALTER TABLE `supplier_items` DISABLE KEYS */;
INSERT INTO `supplier_items` VALUES (2,17,10.00),(2,68,15.00),(2,71,5.00),(2,80,15.00),(2,86,20.00);
/*!40000 ALTER TABLE `supplier_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_packages`
--

DROP TABLE IF EXISTS `supplier_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `package_id` int NOT NULL,
  `supplier_package_price` decimal(12,4) DEFAULT NULL,
  `lead_time_days` int DEFAULT '0',
  `minimum_order_qty` int DEFAULT '1',
  `is_preferred` tinyint(1) DEFAULT '0',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_supplier_package` (`supplier_id`,`package_id`),
  KEY `package_id` (`package_id`),
  CONSTRAINT `supplier_packages_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_packages_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `ingredient_packages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_packages`
--

LOCK TABLES `supplier_packages` WRITE;
/*!40000 ALTER TABLE `supplier_packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_suggestions`
--

DROP TABLE IF EXISTS `supplier_suggestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_suggestions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ingredient_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `frequency_score` int DEFAULT '1',
  `last_purchase_date` date DEFAULT NULL,
  `avg_price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ingredient_supplier` (`ingredient_id`,`supplier_id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `supplier_suggestions_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_suggestions_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_suggestions`
--

LOCK TABLES `supplier_suggestions` WRITE;
/*!40000 ALTER TABLE `supplier_suggestions` DISABLE KEYS */;
INSERT INTO `supplier_suggestions` VALUES (1,80,2,4,'2025-05-25',15.00,'2025-05-25 19:59:32','2025-05-25 19:59:32'),(2,68,2,1,'2025-05-25',15.00,'2025-05-25 19:59:32','2025-05-25 19:59:32'),(3,14,2,1,'2025-05-25',20.00,'2025-05-25 19:59:32','2025-05-25 19:59:32'),(4,83,2,2,'2025-05-25',35.00,'2025-05-25 19:59:32','2025-05-25 19:59:32'),(5,84,2,1,'2025-05-25',5.00,'2025-05-25 19:59:32','2025-05-25 19:59:32'),(6,13,2,1,'2025-05-25',20.00,'2025-05-25 19:59:32','2025-05-25 19:59:32'),(7,87,2,2,'2025-05-25',50.00,'2025-05-25 19:59:32','2025-05-25 19:59:32'),(8,77,2,1,'2025-05-25',100.00,'2025-05-25 19:59:32','2025-05-25 19:59:32'),(9,86,2,2,'2025-05-25',20.00,'2025-05-25 19:59:32','2025-05-25 19:59:32');
/*!40000 ALTER TABLE `supplier_suggestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (2,'kabnoury ','ahmed kabany','1005410456','mkabany@kbscakestudio.com','sfas','{\"po_template\": [{\"item_id\": 1, \"default_quantity\": 1.0}]}');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_health_logs`
--

DROP TABLE IF EXISTS `system_health_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_health_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `metric_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `metric_value` decimal(10,2) DEFAULT NULL,
  `metric_unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_metric` (`metric_name`),
  KEY `idx_status` (`status`),
  KEY `idx_recorded` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_health_logs`
--

LOCK TABLES `system_health_logs` WRITE;
/*!40000 ALTER TABLE `system_health_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_health_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfer_order_items`
--

DROP TABLE IF EXISTS `transfer_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transfer_order_id` int NOT NULL,
  `ingredient_id` int NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `accepted_qty` decimal(10,2) DEFAULT '0.00',
  `returned_qty` decimal(10,2) DEFAULT '0.00',
  `wasted_qty` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `transfer_order_id` (`transfer_order_id`),
  KEY `transfer_order_items_ibfk_2` (`ingredient_id`),
  CONSTRAINT `transfer_order_items_ibfk_1` FOREIGN KEY (`transfer_order_id`) REFERENCES `transfer_orders` (`id`),
  CONSTRAINT `transfer_order_items_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfer_order_items`
--

LOCK TABLES `transfer_order_items` WRITE;
/*!40000 ALTER TABLE `transfer_order_items` DISABLE KEYS */;
INSERT INTO `transfer_order_items` VALUES (1,1,80,1.00,1.00,0.00,0.00),(2,1,89,1.00,1.00,0.00,0.00),(3,1,86,1.00,1.00,0.00,0.00),(4,2,5,1.00,1.00,0.00,0.00),(5,2,8,2.00,2.00,0.00,0.00),(6,3,80,1.00,1.00,0.00,0.00),(7,3,89,1.00,1.00,0.00,0.00),(8,4,5,1.00,0.80,0.10,0.10),(9,5,5,1.00,0.80,0.10,0.10),(10,6,80,5.00,2.00,0.00,3.00),(11,6,5,2.00,2.00,0.00,0.00),(12,7,5,3.00,2.00,0.00,1.00),(13,8,5,1.00,0.00,0.00,1.00),(14,8,8,1.00,1.00,0.00,0.00),(15,9,8,1.00,0.00,0.00,1.00),(16,10,8,2.00,0.00,1.00,1.00),(17,11,8,4.00,1.00,1.00,2.00),(18,12,80,5.00,2.00,2.00,1.00),(19,12,86,10.00,10.00,0.00,0.00),(20,12,83,5.00,5.00,0.00,0.00),(21,13,114,24.00,24.00,0.00,0.00),(22,13,80,5.00,4.00,0.00,1.00),(23,13,86,10.00,8.00,1.00,1.00),(24,14,80,5.00,5.00,0.00,0.00),(25,14,83,1.00,1.00,0.00,0.00),(26,14,114,1.00,1.00,0.00,0.00),(27,15,114,24.00,24.00,0.00,0.00),(28,15,80,10.00,10.00,0.00,0.00),(29,15,86,5.00,4.00,0.00,1.00),(30,15,83,4.00,4.00,0.00,0.00),(31,16,114,24.00,24.00,0.00,0.00),(32,16,80,5.00,4.00,0.00,1.00),(33,16,86,5.00,4.00,0.00,1.00),(34,16,83,5.00,5.00,0.00,0.00),(35,17,80,5.00,4.00,0.00,1.00),(36,17,83,5.00,4.00,0.00,1.00),(37,17,87,5.00,4.00,0.00,1.00),(38,18,80,5.00,4.00,0.00,1.00),(39,18,87,5.00,4.00,0.00,1.00),(40,18,77,5.00,4.00,0.00,1.00),(41,19,80,5.00,4.00,0.00,1.00),(42,19,114,4.00,3.00,0.00,1.00),(43,19,8,2.00,1.00,0.00,1.00),(44,20,80,10.00,9.00,0.00,1.00),(45,20,83,1.00,1.00,0.00,0.00),(46,20,114,5.00,4.00,0.00,1.00),(47,20,8,2.00,2.00,0.00,0.00),(48,21,80,5.00,4.00,0.00,1.00),(49,22,80,465.00,464.00,0.00,1.00),(50,22,89,342.00,340.00,0.00,2.00),(51,22,86,23.00,23.00,0.00,0.00),(52,22,114,48.00,47.00,1.00,0.00),(53,23,80,5.00,5.00,0.00,0.00),(54,23,89,2.00,2.00,0.00,0.00),(55,23,86,5.00,5.00,0.00,0.00),(56,23,116,24.00,24.00,0.00,0.00),(57,24,117,5.00,3.00,2.00,0.00),(58,24,120,6.00,4.00,2.00,0.00),(59,25,1,59.00,0.00,0.00,0.00),(60,26,2,19.00,17.00,1.00,1.00);
/*!40000 ALTER TABLE `transfer_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfer_orders`
--

DROP TABLE IF EXISTS `transfer_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `source_warehouse_id` int NOT NULL,
  `target_warehouse_id` int NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `received_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `source_warehouse_id` (`source_warehouse_id`),
  KEY `target_warehouse_id` (`target_warehouse_id`),
  CONSTRAINT `transfer_orders_ibfk_1` FOREIGN KEY (`source_warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `transfer_orders_ibfk_2` FOREIGN KEY (`target_warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfer_orders`
--

LOCK TABLES `transfer_orders` WRITE;
/*!40000 ALTER TABLE `transfer_orders` DISABLE KEYS */;
INSERT INTO `transfer_orders` VALUES (1,3,2,'Received','2025-05-23 01:04:23',NULL,'2025-06-07 20:11:00',NULL),(2,3,2,'Received','2025-05-23 12:25:02',NULL,'2025-06-07 20:11:00',NULL),(3,3,2,'Received','2025-05-24 08:53:26',NULL,'2025-06-07 20:11:00',NULL),(4,3,2,'Received','2025-05-24 09:14:15',NULL,'2025-06-07 20:11:00',NULL),(5,3,2,'Received','2025-05-24 09:14:50',NULL,'2025-06-07 20:11:00',NULL),(6,3,2,'Received','2025-05-24 18:28:08',NULL,'2025-06-07 20:11:00',NULL),(7,3,2,'Received','2025-05-24 18:53:04',NULL,'2025-06-07 20:11:00',NULL),(8,3,2,'Received','2025-05-24 21:57:06',NULL,'2025-06-07 20:11:00',NULL),(9,3,2,'Received','2025-05-24 22:04:08',NULL,'2025-06-07 20:11:00',NULL),(10,3,2,'Received','2025-05-24 23:42:44',NULL,'2025-06-07 20:11:00',NULL),(11,3,2,'Received','2025-05-24 23:53:22',NULL,'2025-06-07 20:11:00',NULL),(12,3,2,'Received','2025-05-25 14:09:00',NULL,'2025-06-07 20:11:00',NULL),(13,3,2,'Received','2025-05-26 07:39:23',NULL,'2025-06-07 20:11:00',NULL),(14,3,2,'Received','2025-05-26 07:47:06',NULL,'2025-06-07 20:11:00',NULL),(15,3,2,'Received','2025-05-26 11:28:39',NULL,'2025-06-07 20:11:00',NULL),(16,3,2,'Received','2025-05-26 11:41:01',NULL,'2025-06-07 20:11:00',NULL),(17,3,2,'Received','2025-05-26 11:51:48',NULL,'2025-06-07 20:11:00',NULL),(18,3,2,'Received','2025-05-26 11:56:45',NULL,'2025-06-07 20:11:00',NULL),(19,3,2,'Received','2025-05-26 12:02:39',NULL,'2025-06-07 20:11:00',NULL),(20,3,2,'Received','2025-05-26 12:41:57',NULL,'2025-06-07 20:11:00',NULL),(21,3,2,'Received','2025-05-26 12:45:42',NULL,'2025-06-07 20:11:00',NULL),(22,3,2,'Received','2025-05-26 13:16:13',NULL,'2025-06-07 20:11:00',NULL),(23,3,2,'Received','2025-05-26 20:32:33',NULL,'2025-06-07 20:11:00',NULL),(24,2,1,'Received','2025-05-27 18:27:07',NULL,'2025-06-07 20:11:00',NULL),(25,1,2,'Received','2025-06-07 23:06:15','2025-06-07 20:13:24','2025-06-07 20:13:24',NULL),(26,1,2,'Received','2025-06-07 23:14:14','2025-06-07 20:14:53','2025-06-07 20:14:53',NULL);
/*!40000 ALTER TABLE `transfer_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfer_template_items`
--

DROP TABLE IF EXISTS `transfer_template_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer_template_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `ingredient_id` int NOT NULL,
  `suggested_quantity` decimal(12,3) NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  KEY `ingredient_id` (`ingredient_id`),
  KEY `ix_transfer_template_items_id` (`id`),
  CONSTRAINT `transfer_template_items_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `transfer_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transfer_template_items_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfer_template_items`
--

LOCK TABLES `transfer_template_items` WRITE;
/*!40000 ALTER TABLE `transfer_template_items` DISABLE KEYS */;
INSERT INTO `transfer_template_items` VALUES (1,1,115,10.500,'Test item 1'),(2,1,80,5.000,'Test item 2'),(3,2,115,5.000,''),(4,2,80,10.000,''),(5,3,4,1.000,''),(6,4,115,5.000,''),(7,4,80,3.000,''),(8,5,115,5.000,''),(9,5,80,3.000,''),(10,6,1,1.000,''),(11,6,120,1.000,''),(12,6,86,1.000,''),(13,7,80,5.000,''),(14,7,89,3.000,'');
/*!40000 ALTER TABLE `transfer_template_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfer_templates`
--

DROP TABLE IF EXISTS `transfer_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `source_warehouse_id` int DEFAULT NULL,
  `target_warehouse_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `source_warehouse_id` (`source_warehouse_id`),
  KEY `target_warehouse_id` (`target_warehouse_id`),
  KEY `created_by` (`created_by`),
  KEY `ix_transfer_templates_id` (`id`),
  CONSTRAINT `transfer_templates_ibfk_1` FOREIGN KEY (`source_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transfer_templates_ibfk_2` FOREIGN KEY (`target_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transfer_templates_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfer_templates`
--

LOCK TABLES `transfer_templates` WRITE;
/*!40000 ALTER TABLE `transfer_templates` DISABLE KEYS */;
INSERT INTO `transfer_templates` VALUES (1,'Test Daily Transfer','Test template for daily ingredient transfers',3,1,0,1,'2025-06-10 00:17:51','2025-06-10 00:18:12'),(2,'Frontend Test Template','Testing the frontend save function',3,1,0,1,'2025-06-10 00:22:19','2025-06-10 00:25:59'),(3,'vv','',1,2,0,1,'2025-06-10 00:29:36','2025-06-10 00:37:15'),(4,'Test Display Template','Testing display',3,1,0,1,'2025-06-10 00:33:59','2025-06-10 00:37:17'),(5,'Test Display Template 20250610_003602','Testing display structure',3,1,0,1,'2025-06-10 00:36:04','2025-06-10 00:36:08'),(6,'test quan','',1,2,1,1,'2025-06-10 00:38:32','2025-06-10 00:38:32'),(7,'Stock Test Template 20250610_004410','Testing real stock quantities',3,1,0,1,'2025-06-10 00:44:12','2025-06-10 00:44:16');
/*!40000 ALTER TABLE `transfer_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_departments`
--

DROP TABLE IF EXISTS `user_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `department_id` int NOT NULL,
  `role_in_department` enum('member','approver','viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'member',
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_dept` (`user_id`,`department_id`),
  KEY `assigned_by` (`assigned_by`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_department_id` (`department_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `user_departments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_departments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_departments`
--

LOCK TABLES `user_departments` WRITE;
/*!40000 ALTER TABLE `user_departments` DISABLE KEYS */;
INSERT INTO `user_departments` VALUES (1,4,1,'member','2025-05-29 17:19:02',1,1),(2,2,2,'member','2025-05-29 17:19:02',1,1);
/*!40000 ALTER TABLE `user_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_logs`
--

DROP TABLE IF EXISTS `user_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_log_time` (`log_time`),
  CONSTRAINT `user_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_logs`
--

LOCK TABLES `user_logs` WRITE;
/*!40000 ALTER TABLE `user_logs` DISABLE KEYS */;
INSERT INTO `user_logs` VALUES (1,1,'login','User logged in','2025-05-29 21:02:44'),(2,1,'logout','User logged out','2025-05-29 21:04:03'),(3,1,'login','User logged in','2025-05-29 21:04:13'),(4,1,'bulk_create','Created bakery structure (0 categories)','2025-05-29 21:15:38'),(5,1,'add_category','Added category \"Egg whites\" under \" Eggs\"','2025-05-29 21:20:00'),(6,1,'login','User logged in','2025-05-29 21:40:58'),(7,1,'login','User logged in','2025-05-30 09:53:14'),(8,1,'login','User logged in','2025-05-31 07:37:06'),(9,1,'logout','User logged out','2025-05-31 20:07:35'),(10,1,'login','User logged in','2025-05-31 20:14:39'),(11,1,'login','User logged in','2025-05-31 20:24:25'),(12,1,'rename_category','Renamed category ID 1 from \"Ingredients\" to \"Items\"','2025-05-31 20:26:49'),(13,1,'login','User logged in','2025-05-31 20:51:03'),(14,1,'login','User logged in','2025-05-31 20:53:57'),(15,1,'login','User logged in','2025-05-31 21:01:29'),(16,1,'login','User logged in','2025-05-31 21:07:30'),(17,1,'login','User logged in','2025-06-01 07:55:18'),(18,1,'login','User logged in','2025-06-01 09:46:54'),(19,1,'login','User logged in','2025-06-01 11:09:13'),(20,1,'login','User logged in','2025-06-01 11:14:42'),(21,1,'login','User logged in','2025-06-01 11:17:28'),(22,1,'login','User logged in','2025-06-01 11:20:31'),(23,1,'login','User logged in','2025-06-01 11:22:47'),(24,1,'login','User logged in','2025-06-01 11:23:37'),(25,1,'login','User logged in','2025-06-01 11:24:12'),(26,1,'login','User logged in','2025-06-01 11:27:27'),(27,1,'login','User logged in','2025-06-01 11:35:33'),(28,1,'login','User logged in','2025-06-01 11:45:56'),(29,1,'login','User logged in','2025-06-01 12:04:21'),(30,1,'add_category','Added category \"taxes\" under \"Root\"','2025-06-01 12:29:12'),(31,1,'add_category','Added category \"kasb 3amal\" under \"taxes\"','2025-06-01 12:29:27'),(32,1,'login','User logged in','2025-06-01 14:50:18'),(33,1,'login','User logged in','2025-06-03 04:14:27'),(34,1,'login','User logged in','2025-06-03 09:39:55'),(35,1,'login','User logged in','2025-06-03 09:43:11'),(36,1,'login','User logged in','2025-06-03 10:20:32'),(37,1,'login','User logged in','2025-06-03 10:45:03'),(38,1,'login','User logged in','2025-06-03 10:45:44'),(39,1,'login','User logged in','2025-06-03 10:50:32'),(40,1,'login','User logged in','2025-06-03 10:51:04'),(41,1,'login','User logged in','2025-06-03 21:57:28'),(42,1,'login','User logged in','2025-06-04 07:59:37'),(43,1,'login','User logged in','2025-06-04 08:06:23'),(44,1,'login','User logged in','2025-06-04 16:59:45'),(45,1,'login','User logged in','2025-06-04 20:05:36'),(46,1,'login','User logged in','2025-06-04 20:47:49'),(47,1,'login','User logged in','2025-06-04 20:57:47'),(48,1,'login','User logged in','2025-06-04 21:22:49'),(49,1,'login','User logged in','2025-06-04 21:48:27'),(50,1,'login','User logged in','2025-06-04 22:28:57'),(51,1,'login','User logged in','2025-06-04 22:37:46'),(52,1,'login','User logged in','2025-06-04 22:40:25'),(53,1,'login','User logged in','2025-06-04 22:52:39'),(54,1,'login','User logged in','2025-06-04 22:56:38'),(55,1,'login','User logged in','2025-06-05 00:04:20'),(56,1,'login','User logged in','2025-06-05 16:41:38'),(57,1,'login','User logged in','2025-06-05 19:15:36'),(58,1,'expense_logged','Logged expense of $500.00 against cheque #89','2025-06-05 19:53:38'),(59,1,'expense_logged','Logged expense of $200.00 against cheque #89','2025-06-05 20:27:03'),(60,1,'login','User logged in','2025-06-05 22:41:57');
/*!40000 ALTER TABLE `user_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,'Admin'),(3,'Staff'),(2,'Warehouse Manager');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_safe_assignments`
--

DROP TABLE IF EXISTS `user_safe_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_safe_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `safe_id` int NOT NULL,
  `can_view` tinyint(1) DEFAULT '1',
  `can_create_expense` tinyint(1) DEFAULT '1',
  `can_approve_expense` tinyint(1) DEFAULT '0',
  `assigned_by` int DEFAULT NULL,
  `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `safe_id` (`safe_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `user_safe_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_safe_assignments_ibfk_2` FOREIGN KEY (`safe_id`) REFERENCES `safes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_safe_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_safe_assignments`
--

LOCK TABLES `user_safe_assignments` WRITE;
/*!40000 ALTER TABLE `user_safe_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_safe_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `login_time` datetime NOT NULL,
  `logout_time` datetime DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` VALUES (1,1,'2025-05-30 00:02:44','2025-05-30 00:04:03',79,'KeboHome'),(2,1,'2025-05-30 00:04:14',NULL,NULL,'KeboHome'),(3,1,'2025-05-30 00:40:58','2025-05-31 23:07:35',167197,'KeboHome'),(4,1,'2025-05-30 12:53:14',NULL,NULL,'KeboHome'),(5,1,'2025-05-31 10:37:07',NULL,NULL,'KeboHome'),(6,1,'2025-05-31 23:14:39',NULL,NULL,'DESKTOP-8S3LU6K'),(7,1,'2025-05-31 23:24:25',NULL,NULL,'DESKTOP-8S3LU6K'),(8,1,'2025-05-31 23:51:03',NULL,NULL,'DESKTOP-8S3LU6K'),(9,1,'2025-05-31 23:53:57',NULL,NULL,'DESKTOP-8S3LU6K'),(10,1,'2025-06-01 00:01:29',NULL,NULL,'DESKTOP-8S3LU6K'),(11,1,'2025-06-01 00:07:30',NULL,NULL,'DESKTOP-8S3LU6K'),(12,1,'2025-06-01 10:55:18',NULL,NULL,'DESKTOP-8S3LU6K'),(13,1,'2025-06-01 12:46:54',NULL,NULL,'DESKTOP-8S3LU6K'),(14,1,'2025-06-01 14:09:13',NULL,NULL,'DESKTOP-8S3LU6K'),(15,1,'2025-06-01 14:14:42',NULL,NULL,'DESKTOP-8S3LU6K'),(16,1,'2025-06-01 14:17:28',NULL,NULL,'DESKTOP-8S3LU6K'),(17,1,'2025-06-01 14:20:31',NULL,NULL,'DESKTOP-8S3LU6K'),(18,1,'2025-06-01 14:22:47',NULL,NULL,'DESKTOP-8S3LU6K'),(19,1,'2025-06-01 14:23:37',NULL,NULL,'DESKTOP-8S3LU6K'),(20,1,'2025-06-01 14:24:12',NULL,NULL,'DESKTOP-8S3LU6K'),(21,1,'2025-06-01 14:27:27',NULL,NULL,'DESKTOP-8S3LU6K'),(22,1,'2025-06-01 14:35:33',NULL,NULL,'DESKTOP-8S3LU6K'),(23,1,'2025-06-01 14:45:56',NULL,NULL,'DESKTOP-8S3LU6K'),(24,1,'2025-06-01 15:04:21',NULL,NULL,'DESKTOP-8S3LU6K'),(25,1,'2025-06-01 17:50:18',NULL,NULL,'KeboHome'),(26,1,'2025-06-03 07:14:27',NULL,NULL,'KeboHome'),(27,1,'2025-06-03 12:39:56',NULL,NULL,'KeboHome'),(28,1,'2025-06-03 12:43:11',NULL,NULL,'KeboHome'),(29,1,'2025-06-03 13:20:32',NULL,NULL,'KeboHome'),(30,1,'2025-06-03 13:45:03',NULL,NULL,'KeboHome'),(31,1,'2025-06-03 13:45:44',NULL,NULL,'KeboHome'),(32,1,'2025-06-03 13:50:32',NULL,NULL,'KeboHome'),(33,1,'2025-06-03 13:51:04',NULL,NULL,'KeboHome'),(34,1,'2025-06-04 00:57:28',NULL,NULL,'KeboHome'),(35,1,'2025-06-04 10:59:37',NULL,NULL,'DESKTOP-8S3LU6K'),(36,1,'2025-06-04 11:06:23',NULL,NULL,'DESKTOP-8S3LU6K'),(37,1,'2025-06-04 19:59:45',NULL,NULL,'DESKTOP-8S3LU6K'),(38,1,'2025-06-04 23:05:36',NULL,NULL,'DESKTOP-8S3LU6K'),(39,1,'2025-06-04 23:47:49',NULL,NULL,'DESKTOP-8S3LU6K'),(40,1,'2025-06-04 23:57:47',NULL,NULL,'DESKTOP-8S3LU6K'),(41,1,'2025-06-05 00:22:49',NULL,NULL,'DESKTOP-8S3LU6K'),(42,1,'2025-06-05 00:48:27',NULL,NULL,'DESKTOP-8S3LU6K'),(43,1,'2025-06-05 01:28:57',NULL,NULL,'DESKTOP-8S3LU6K'),(44,1,'2025-06-05 01:37:46',NULL,NULL,'DESKTOP-8S3LU6K'),(45,1,'2025-06-05 01:40:25',NULL,NULL,'DESKTOP-8S3LU6K'),(46,1,'2025-06-05 01:52:39',NULL,NULL,'DESKTOP-8S3LU6K'),(47,1,'2025-06-05 01:56:38',NULL,NULL,'DESKTOP-8S3LU6K'),(48,1,'2025-06-05 03:04:20',NULL,NULL,'DESKTOP-8S3LU6K'),(49,1,'2025-06-05 19:41:38',NULL,NULL,'DESKTOP-8S3LU6K'),(50,1,'2025-06-05 22:15:36',NULL,NULL,'DESKTOP-8S3LU6K'),(51,1,'2025-06-06 01:41:57',NULL,NULL,'DESKTOP-8S3LU6K');
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_warehouses`
--

DROP TABLE IF EXISTS `user_warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_warehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_warehouse` (`user_id`,`warehouse_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `user_warehouses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_warehouses_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_warehouses`
--

LOCK TABLES `user_warehouses` WRITE;
/*!40000 ALTER TABLE `user_warehouses` DISABLE KEYS */;
INSERT INTO `user_warehouses` VALUES (5,1,1),(4,1,2),(2,1,3),(3,1,4),(1,2,2);
/*!40000 ALTER TABLE `user_warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$12$FGfqGz7nbe0.n67b4dR.welJZUhgZ57Tf3uL99duWF4zL.OGHLaqS',1,1,'2025-06-07 16:48:27'),(2,'finn','e0e2087b3efad83c23c899efb0059a16d9ee9d4ef51349c6066548b8d01f1ab8',2,1,'2025-06-07 16:48:27'),(4,'cost','9f82f7b375f4aa1bd7d50abe0f760c4ca5a8f0208aa68555489c39dd7c7aeeaa',3,1,'2025-06-07 16:48:27');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse`
--

DROP TABLE IF EXISTS `warehouse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse` (
  `ingredient_id` int NOT NULL,
  `quantity` decimal(10,2) DEFAULT '0.00',
  `last_updated` datetime DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `par_level` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`ingredient_id`),
  CONSTRAINT `warehouse_ibfk_1` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse`
--

LOCK TABLES `warehouse` WRITE;
/*!40000 ALTER TABLE `warehouse` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse_manager_assignments`
--

DROP TABLE IF EXISTS `warehouse_manager_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_manager_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `can_view_stock` tinyint(1) DEFAULT '1',
  `can_create_transfers_out` tinyint(1) DEFAULT '1',
  `can_receive_transfers` tinyint(1) DEFAULT '1',
  `can_manage_stock` tinyint(1) DEFAULT '1',
  `assigned_by` int DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_warehouse_assignment` (`user_id`,`warehouse_id`),
  KEY `assigned_by` (`assigned_by`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_warehouse_id` (`warehouse_id`),
  CONSTRAINT `warehouse_manager_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `warehouse_manager_assignments_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `warehouse_manager_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_manager_assignments`
--

LOCK TABLES `warehouse_manager_assignments` WRITE;
/*!40000 ALTER TABLE `warehouse_manager_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouse_manager_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse_stock`
--

DROP TABLE IF EXISTS `warehouse_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_stock` (
  `warehouse_id` int NOT NULL,
  `ingredient_id` int NOT NULL,
  `quantity` decimal(10,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`warehouse_id`,`ingredient_id`),
  KEY `warehouse_stock_ibfk_2` (`ingredient_id`),
  KEY `idx_warehouse_stock_item` (`warehouse_id`,`ingredient_id`),
  CONSTRAINT `warehouse_stock_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `warehouse_stock_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_stock`
--

LOCK TABLES `warehouse_stock` WRITE;
/*!40000 ALTER TABLE `warehouse_stock` DISABLE KEYS */;
INSERT INTO `warehouse_stock` VALUES (1,1,151.00,'2025-06-15 19:19:08'),(1,2,62.00,'2025-06-07 20:14:53'),(1,3,20.00,'2025-05-31 16:19:40'),(1,4,51.00,'2025-06-15 19:19:08'),(1,10,1.00,'2025-06-15 19:19:08'),(1,80,2.00,'2025-06-07 20:27:00'),(1,86,1.00,'2025-06-07 20:27:21'),(1,117,3.00,'2025-05-31 16:19:40'),(1,120,4.00,'2025-05-31 16:19:40'),(1,127,9.00,'2025-06-11 20:00:44'),(1,128,6.00,'2025-06-11 19:57:17'),(1,129,8.00,'2025-06-11 19:57:29'),(1,130,3.00,'2025-06-19 17:30:27'),(1,131,2.00,'2025-06-11 20:15:42'),(1,132,7.00,'2025-06-19 17:30:27'),(1,133,10.00,'2025-06-12 16:10:14'),(1,134,1.00,'2025-06-19 17:30:27'),(1,135,0.90,'2025-06-19 17:31:06'),(2,1,100.00,'2025-05-31 16:19:40'),(2,2,117.00,'2025-06-07 20:14:53'),(2,3,100.00,'2025-05-31 16:19:40'),(2,4,100.00,'2025-05-31 16:19:40'),(2,5,98.00,'2025-05-31 16:19:40'),(2,6,100.00,'2025-05-31 16:19:40'),(2,7,100.00,'2025-05-31 16:19:40'),(2,8,100.00,'2025-05-31 16:19:40'),(2,9,100.00,'2025-05-31 16:19:40'),(2,10,100.00,'2025-05-31 16:19:40'),(2,11,100.00,'2025-05-31 16:19:40'),(2,12,100.00,'2025-05-31 16:19:40'),(2,13,100.00,'2025-05-31 16:19:40'),(2,14,100.00,'2025-05-31 16:19:40'),(2,15,100.00,'2025-05-31 16:19:40'),(2,16,100.00,'2025-05-31 16:19:40'),(2,17,100.00,'2025-05-31 16:19:40'),(2,18,100.00,'2025-05-31 16:19:40'),(2,19,100.00,'2025-05-31 16:19:40'),(2,20,100.00,'2025-05-31 16:19:40'),(2,21,100.00,'2025-05-31 16:19:40'),(2,22,97.50,'2025-05-31 16:19:40'),(2,23,100.00,'2025-05-31 16:19:40'),(2,24,100.00,'2025-05-31 16:19:40'),(2,25,100.00,'2025-05-31 16:19:40'),(2,26,100.00,'2025-05-31 16:19:40'),(2,27,100.00,'2025-05-31 16:19:40'),(2,28,100.00,'2025-05-31 16:19:40'),(2,29,100.00,'2025-05-31 16:19:40'),(2,30,100.00,'2025-05-31 16:19:40'),(2,31,100.00,'2025-05-31 16:19:40'),(2,32,100.00,'2025-05-31 16:19:40'),(2,33,100.00,'2025-05-31 16:19:40'),(2,34,100.00,'2025-05-31 16:19:40'),(2,35,95.00,'2025-05-31 16:19:40'),(2,37,100.00,'2025-05-31 16:19:40'),(2,38,100.00,'2025-05-31 16:19:40'),(2,39,100.00,'2025-05-31 16:19:40'),(2,40,100.00,'2025-05-31 16:19:40'),(2,41,100.00,'2025-05-31 16:19:40'),(2,43,100.00,'2025-05-31 16:19:40'),(2,44,100.00,'2025-05-31 16:19:40'),(2,45,100.00,'2025-05-31 16:19:40'),(2,46,100.00,'2025-05-31 16:19:40'),(2,47,100.00,'2025-05-31 16:19:40'),(2,48,100.00,'2025-05-31 16:19:40'),(2,49,100.00,'2025-05-31 16:19:40'),(2,50,100.00,'2025-05-31 16:19:40'),(2,51,100.00,'2025-05-31 16:19:40'),(2,52,100.00,'2025-05-31 16:19:40'),(2,53,100.00,'2025-05-31 16:19:40'),(2,54,100.00,'2025-05-31 16:19:40'),(2,55,100.00,'2025-05-31 16:19:40'),(2,56,100.00,'2025-05-31 16:19:40'),(2,57,100.00,'2025-05-31 16:19:40'),(2,58,100.00,'2025-05-31 16:19:40'),(2,59,100.00,'2025-05-31 16:19:40'),(2,60,100.00,'2025-05-31 16:19:40'),(2,61,100.00,'2025-05-31 16:19:40'),(2,62,100.00,'2025-05-31 16:19:40'),(2,63,100.00,'2025-05-31 16:19:40'),(2,64,98.25,'2025-05-31 16:19:40'),(2,65,100.00,'2025-05-31 16:19:40'),(2,66,100.00,'2025-05-31 16:19:40'),(2,67,100.00,'2025-05-31 16:19:40'),(2,68,100.00,'2025-05-31 16:19:40'),(2,70,100.00,'2025-05-31 16:19:40'),(2,71,100.00,'2025-05-31 16:19:40'),(2,72,100.00,'2025-05-31 16:19:40'),(2,73,100.00,'2025-05-31 16:19:40'),(2,75,100.00,'2025-05-31 16:19:40'),(2,77,99.86,'2025-05-31 16:19:40'),(2,80,100.00,'2025-05-31 16:19:40'),(2,81,100.00,'2025-05-31 16:19:40'),(2,82,100.00,'2025-05-31 16:19:40'),(2,83,100.00,'2025-05-31 16:19:40'),(2,84,100.00,'2025-05-31 16:19:40'),(2,85,100.00,'2025-05-31 16:19:40'),(2,86,100.00,'2025-05-31 16:19:40'),(2,87,100.00,'2025-05-31 16:19:40'),(2,88,100.00,'2025-05-31 16:19:40'),(2,89,100.00,'2025-05-31 16:19:40'),(2,90,100.00,'2025-05-31 16:19:40'),(2,91,100.00,'2025-05-31 16:19:40'),(2,92,100.00,'2025-05-31 16:19:40'),(2,96,100.00,'2025-05-31 16:19:40'),(2,97,100.00,'2025-05-31 16:19:40'),(2,98,100.00,'2025-05-31 16:19:40'),(2,99,100.00,'2025-05-31 16:19:40'),(2,100,100.00,'2025-05-31 16:19:40'),(2,103,100.00,'2025-05-31 16:19:40'),(2,104,100.00,'2025-05-31 16:19:40'),(2,105,100.00,'2025-05-31 16:19:40'),(2,106,100.00,'2025-05-31 16:19:40'),(2,107,100.00,'2025-05-31 16:19:40'),(2,109,100.00,'2025-05-31 16:19:40'),(2,110,100.00,'2025-05-31 16:19:40'),(2,111,100.00,'2025-05-31 16:19:40'),(2,112,100.00,'2025-05-31 16:19:40'),(2,113,100.00,'2025-05-31 16:19:40'),(2,114,100.00,'2025-05-31 16:19:40'),(2,115,100.00,'2025-05-31 16:19:40'),(2,116,100.00,'2025-05-31 16:19:40'),(2,117,100.00,'2025-05-31 16:19:40'),(2,118,100.00,'2025-05-31 16:19:40'),(2,119,100.00,'2025-05-31 16:19:40'),(2,120,2.00,'2025-05-31 16:19:40'),(3,5,0.00,'2025-05-31 16:19:40'),(3,8,18.00,'2025-05-31 16:19:40'),(3,13,10.00,'2025-05-31 16:19:40'),(3,14,3275.00,'2025-05-31 16:19:40'),(3,47,3.00,'2025-05-31 16:19:40'),(3,68,5.00,'2025-05-31 16:19:40'),(3,77,45.00,'2025-05-31 16:19:40'),(3,80,83.00,'2025-05-31 16:19:40'),(3,83,9.00,'2025-05-31 16:19:40'),(3,84,2.00,'2025-05-31 16:19:40'),(3,86,672.00,'2025-05-31 16:19:40'),(3,87,20.00,'2025-05-31 16:19:40'),(3,89,156.00,'2025-05-31 16:19:40'),(3,114,184.00,'2025-05-31 16:19:40'),(3,116,216.00,'2025-05-31 16:19:40');
/*!40000 ALTER TABLE `warehouse_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse_translations`
--

DROP TABLE IF EXISTS `warehouse_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_translations` (
  `warehouse_id` int NOT NULL,
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`warehouse_id`,`language`),
  CONSTRAINT `warehouse_translations_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_translations`
--

LOCK TABLES `warehouse_translations` WRITE;
/*!40000 ALTER TABLE `warehouse_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouse_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse_warehouses`
--

DROP TABLE IF EXISTS `warehouse_warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_warehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_warehouses`
--

LOCK TABLES `warehouse_warehouses` WRITE;
/*!40000 ALTER TABLE `warehouse_warehouses` DISABLE KEYS */;
INSERT INTO `warehouse_warehouses` VALUES (1,'Main Storage',NULL,'2025-06-07 17:59:19'),(2,'Kitchen Storage',NULL,'2025-06-07 17:59:19'),(3,'Cold Storage',NULL,'2025-06-07 17:59:19');
/*!40000 ALTER TABLE `warehouse_warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'warehouse',
  `is_shop` tinyint(1) DEFAULT '0',
  `foodics_branch_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auto_sync` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `foodics_branch_id` (`foodics_branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,'Main Warehouse','Central Location','2025-05-22 21:08:20','warehouse',0,NULL,1),(2,'Kitchen Storage','Kitchen Area','2025-05-22 21:08:20','warehouse',0,NULL,1),(3,'Bakery Storage','Bakery Area','2025-05-22 21:08:20','warehouse',0,'test_branch_123',0),(4,'Garden 8','Fifth Settlement','2025-05-27 18:48:03','shop',1,'',1);
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses_enhanced`
--

DROP TABLE IF EXISTS `warehouses_enhanced`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses_enhanced` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_shop` tinyint(1) DEFAULT '0',
  `foodics_branch_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auto_sync` tinyint(1) DEFAULT '1',
  `sync_frequency` int DEFAULT '60',
  `last_sync` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_is_shop` (`is_shop`),
  KEY `idx_foodics_branch` (`foodics_branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses_enhanced`
--

LOCK TABLES `warehouses_enhanced` WRITE;
/*!40000 ALTER TABLE `warehouses_enhanced` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouses_enhanced` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waste_approvals`
--

DROP TABLE IF EXISTS `waste_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waste_approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `waste_log_id` int NOT NULL,
  `approved_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approver_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `waste_log_id` (`waste_log_id`),
  CONSTRAINT `waste_approvals_ibfk_1` FOREIGN KEY (`waste_log_id`) REFERENCES `waste_logs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waste_approvals`
--

LOCK TABLES `waste_approvals` WRITE;
/*!40000 ALTER TABLE `waste_approvals` DISABLE KEYS */;
INSERT INTO `waste_approvals` VALUES (1,1,'finn','Warehouse Manager','2025-05-24 23:43:45','test approval;'),(2,1,'cost','Cost Control','2025-05-24 23:55:07','approval 1 '),(3,2,'cost','Cost Control','2025-05-24 23:55:19','approval 2'),(4,2,'finn','Warehouse Manager','2025-05-24 23:55:55','aprroval from manager'),(5,3,'finn','Warehouse Manager','2025-05-25 14:11:57','mashi ya niho'),(6,3,'cost','Cost Control','2025-05-25 14:13:10','wasted cost by nihooo'),(7,6,'finn','Warehouse Manager','2025-05-26 11:58:36',''),(8,4,'finn','Warehouse Manager','2025-05-26 11:58:49',''),(9,5,'finn','Warehouse Manager','2025-05-26 11:59:21',''),(10,7,'cost','Cost Control','2025-05-26 12:12:22',''),(11,13,'finn','Warehouse Manager','2025-05-26 13:18:44',''),(12,14,'finn','Warehouse Manager','2025-05-26 13:18:54','');
/*!40000 ALTER TABLE `waste_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waste_logs`
--

DROP TABLE IF EXISTS `waste_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waste_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warehouse_id` int NOT NULL,
  `ingredient_id` int NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `ingredient_id` (`ingredient_id`),
  CONSTRAINT `waste_logs_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `waste_logs_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waste_logs`
--

LOCK TABLES `waste_logs` WRITE;
/*!40000 ALTER TABLE `waste_logs` DISABLE KEYS */;
INSERT INTO `waste_logs` VALUES (1,2,8,1.00,'Transfer Order #10 waste: test 2','Approved','2025-05-24 23:43:08','finn'),(2,2,8,2.00,'Transfer Order #11 waste: test approvals','Approved','2025-05-24 23:53:48','admin'),(3,2,80,1.00,'Transfer Order #12 waste: spoiled by niho','Approved','2025-05-25 14:11:02','finn'),(4,2,80,1.00,'Transfer Order #18 waste: spoiled','Pending','2025-05-26 11:57:15','finn'),(5,2,87,1.00,'Transfer Order #18 waste: spoiled','Pending','2025-05-26 11:57:49','finn'),(6,2,77,1.00,'Transfer Order #18 waste: spoiled','Pending','2025-05-26 11:57:50','finn'),(7,2,80,1.00,'Transfer Order #19 waste: testing photo\n\'','Pending','2025-05-26 12:03:32','finn'),(8,2,114,1.00,'Transfer Order #19 waste: testing photo\n\'','Pending','2025-05-26 12:03:32','finn'),(9,2,8,1.00,'Transfer Order #19 waste: testing photo\n\'','Pending','2025-05-26 12:03:32','finn'),(10,2,80,1.00,'Transfer Order #20 waste: spoiled photo check','Pending','2025-05-26 12:42:38','finn'),(11,2,114,1.00,'Transfer Order #20 waste: spoiled photo check','Pending','2025-05-26 12:42:38','finn'),(12,2,80,1.00,'Transfer Order #21 waste: spoiled photo test','Pending','2025-05-26 12:46:13','finn'),(13,2,80,1.00,'Transfer Order #22 waste: spoiled','Pending','2025-05-26 13:18:16','finn'),(14,2,89,2.00,'Transfer Order #22 waste: spoiled','Pending','2025-05-26 13:18:16','finn'),(16,2,2,1.00,'Transfer Order #26 waste: spoilage','Pending','2025-06-07 23:14:53','system');
/*!40000 ALTER TABLE `waste_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waste_photos`
--

DROP TABLE IF EXISTS `waste_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waste_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `waste_log_id` int NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `waste_log_id` (`waste_log_id`),
  CONSTRAINT `waste_photos_ibfk_1` FOREIGN KEY (`waste_log_id`) REFERENCES `waste_logs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waste_photos`
--

LOCK TABLES `waste_photos` WRITE;
/*!40000 ALTER TABLE `waste_photos` DISABLE KEYS */;
INSERT INTO `waste_photos` VALUES (1,12,'waste_photos\\waste_2_80_spoiled_ph_1748252773_1.jpg','2025-05-26 12:46:13'),(2,13,'waste_photos\\waste_2_80_spoiled_1748254696_1.jpg','2025-05-26 13:18:16'),(3,14,'waste_photos\\waste_2_89_spoiled_1748254697_1.jpg','2025-05-26 13:18:17');
/*!40000 ALTER TABLE `waste_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'bakery_react'
--

--
-- Dumping routines for database 'bakery_react'
--

--
-- Final view structure for view `current_item_costs`
--

/*!50001 DROP VIEW IF EXISTS `current_item_costs`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`bakery_user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `current_item_costs` AS select `ib`.`item_id` AS `item_id`,`ib`.`warehouse_id` AS `warehouse_id`,sum(`ib`.`quantity_remaining`) AS `total_quantity`,(case when (sum(`ib`.`quantity_remaining`) > 0) then (sum((`ib`.`quantity_remaining` * `ib`.`unit_cost`)) / sum(`ib`.`quantity_remaining`)) else `i`.`price_per_unit` end) AS `weighted_avg_cost`,min(`ib`.`unit_cost`) AS `min_cost`,max(`ib`.`unit_cost`) AS `max_cost`,count(distinct `ib`.`id`) AS `batch_count` from (`inventory_batches` `ib` join `items` `i` on((`ib`.`item_id` = `i`.`id`))) where (`ib`.`quantity_remaining` > 0) group by `ib`.`item_id`,`ib`.`warehouse_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `department_safe_cheques`
--

/*!50001 DROP VIEW IF EXISTS `department_safe_cheques`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`bakery_user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `department_safe_cheques` AS select `cheques`.`id` AS `id`,`cheques`.`cheque_number` AS `cheque_number`,`cheques`.`department` AS `department`,`cheques`.`issued_to` AS `issued_to`,`cheques`.`amount` AS `cheque_amount`,`cheques`.`issued_date` AS `issued_date`,`cheques`.`due_date` AS `due_date`,`cheques`.`status` AS `status`,`cheques`.`closing_remark` AS `closing_remark`,`cheques`.`bank_account_id` AS `bank_account_id`,`cheques`.`bank_name` AS `bank_name`,`cheques`.`account_number` AS `account_number`,`cheques`.`created_at` AS `created_at`,`cheques`.`updated_at` AS `updated_at` from `cheques` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `safe_balances`
--

/*!50001 DROP VIEW IF EXISTS `safe_balances`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`bakery_user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `safe_balances` AS select `s`.`id` AS `safe_id`,`s`.`name` AS `safe_name`,`s`.`description` AS `description`,`s`.`is_active` AS `is_active`,coalesce(sum(`ch`.`amount`),0) AS `total_cheques`,coalesce(sum(`se`.`amount`),0) AS `total_expenses`,(coalesce(sum(`ch`.`amount`),0) - coalesce(sum(`se`.`amount`),0)) AS `available_balance`,count(distinct `ch`.`id`) AS `cheque_count`,count(distinct `se`.`id`) AS `expense_count` from ((`safes` `s` left join `cheques` `ch` on(((`s`.`id` = `ch`.`safe_id`) and (`ch`.`status` not in ('cancelled','settled'))))) left join `safe_expenditures` `se` on((`ch`.`id` = `se`.`cheque_id`))) where (`s`.`is_active` = true) group by `s`.`id`,`s`.`name`,`s`.`description`,`s`.`is_active` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-01 11:06:57
