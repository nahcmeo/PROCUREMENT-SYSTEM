-- ============================================================
-- DATABASE SCHEMA: PROCUREMENT & VENDOR EVALUATION SYSTEM
-- System: Procurement Management (Dự án DACN)
-- Target DB: MySQL 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS `dacn_procurement` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dacn_procurement`;

-- 1. Phòng ban & Hạn mức ngân sách
CREATE TABLE IF NOT EXISTS `departments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `budget_limit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Hạn mức ngân sách tháng/quý',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Người dùng & Phân quyền
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `role` ENUM('ADMIN', 'APPROVER', 'PURCHASER', 'REQUESTER') NOT NULL,
    `department_id` BIGINT NULL,
    `status` ENUM('ACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Hồ sơ Nhà cung cấp
CREATE TABLE IF NOT EXISTS `vendors` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `tax_code` VARCHAR(50) UNIQUE,
    `contact_person` VARCHAR(100),
    `email` VARCHAR(100),
    `phone` VARCHAR(20),
    `address` TEXT,
    `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    `rating_avg` DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Điểm xếp hạng trung bình (1.00 - 5.00)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Phiếu Đề nghị Mua sắm (PR - Purchase Requisition)
CREATE TABLE IF NOT EXISTS `purchase_requests` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `pr_code` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `requester_id` BIGINT NOT NULL,
    `department_id` BIGINT NOT NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING_APPROVAL',
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pr_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
    CONSTRAINT `fk_pr_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Chi tiết mặt hàng trong PR
CREATE TABLE IF NOT EXISTS `pr_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `pr_id` BIGINT NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `specification` TEXT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `unit` VARCHAR(50) NOT NULL,
    `estimated_unit_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `estimated_total_price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT `fk_pr_items_pr` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Yêu cầu Báo giá (RFQ - Request For Quotation)
CREATE TABLE IF NOT EXISTS `rfqs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `rfq_code` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `pr_id` BIGINT NULL,
    `created_by_id` BIGINT NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'CLOSED') DEFAULT 'DRAFT',
    `note` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rfq_pr` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requests` (`id`),
    CONSTRAINT `fk_rfq_creator` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Báo giá từ Nhà cung cấp (Quotation)
CREATE TABLE IF NOT EXISTS `quotations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `rfq_id` BIGINT NOT NULL,
    `vendor_id` BIGINT NOT NULL,
    `quotation_code` VARCHAR(50) NOT NULL UNIQUE,
    `valid_until` DATE NULL,
    `delivery_days` INT DEFAULT 7 COMMENT 'Thời gian cam kết giao hàng (ngày)',
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('SUBMITTED', 'SELECTED', 'REJECTED') DEFAULT 'SUBMITTED',
    `note` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_quotation_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`),
    CONSTRAINT `fk_quotation_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Chi tiết báo giá từng mặt hàng
CREATE TABLE IF NOT EXISTS `quotation_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `quotation_id` BIGINT NOT NULL,
    `pr_item_id` BIGINT NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `total_price` DECIMAL(15, 2) NOT NULL,
    CONSTRAINT `fk_quotation_items_q` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quotation_items_pr_item` FOREIGN KEY (`pr_item_id`) REFERENCES `pr_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Đơn Đặt hàng (PO - Purchase Order)
CREATE TABLE IF NOT EXISTS `purchase_orders` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `po_code` VARCHAR(50) NOT NULL UNIQUE,
    `quotation_id` BIGINT NOT NULL,
    `vendor_id` BIGINT NOT NULL,
    `purchaser_id` BIGINT NOT NULL,
    `department_id` BIGINT NOT NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('CREATED', 'SENT_TO_VENDOR', 'DELIVERING', 'RECEIVED', 'CANCELLED') DEFAULT 'CREATED',
    `expected_delivery_date` DATE NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_po_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`),
    CONSTRAINT `fk_po_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
    CONSTRAINT `fk_po_purchaser` FOREIGN KEY (`purchaser_id`) REFERENCES `users` (`id`),
    CONSTRAINT `fk_po_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Chi tiết mặt hàng trong PO
CREATE TABLE IF NOT EXISTS `po_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `po_id` BIGINT NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `ordered_quantity` INT NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `total_price` DECIMAL(15, 2) NOT NULL,
    CONSTRAINT `fk_po_items_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Biên bản Nghiệm thu & Nhận hàng (Goods Receipt)
CREATE TABLE IF NOT EXISTS `goods_receipts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `gr_code` VARCHAR(50) NOT NULL UNIQUE,
    `po_id` BIGINT NOT NULL,
    `received_by_id` BIGINT NOT NULL,
    `receipt_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('COMPLETED', 'DISCREPANCY') DEFAULT 'COMPLETED' COMMENT 'Nghiệm thu đủ hay Lệch số lượng',
    `note` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_gr_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`),
    CONSTRAINT `fk_gr_receiver` FOREIGN KEY (`received_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Chi tiết số lượng nghiệm thu
CREATE TABLE IF NOT EXISTS `gr_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `gr_id` BIGINT NOT NULL,
    `po_item_id` BIGINT NOT NULL,
    `ordered_quantity` INT NOT NULL,
    `received_quantity` INT NOT NULL,
    `accepted_quantity` INT NOT NULL,
    `rejected_quantity` INT NOT NULL DEFAULT 0,
    `note` VARCHAR(255) NULL,
    CONSTRAINT `fk_gr_items_gr` FOREIGN KEY (`gr_id`) REFERENCES `goods_receipts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gr_items_po_item` FOREIGN KEY (`po_item_id`) REFERENCES `po_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Đánh giá Nhà cung cấp theo Đơn hàng
CREATE TABLE IF NOT EXISTS `vendor_evaluations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `vendor_id` BIGINT NOT NULL,
    `po_id` BIGINT NOT NULL,
    `evaluator_id` BIGINT NOT NULL,
    `price_score` INT NOT NULL CHECK (`price_score` BETWEEN 1 AND 5),
    `quality_score` INT NOT NULL CHECK (`quality_score` BETWEEN 1 AND 5),
    `delivery_score` INT NOT NULL CHECK (`delivery_score` BETWEEN 1 AND 5),
    `average_score` DECIMAL(3, 2) NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_eval_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
    CONSTRAINT `fk_eval_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`),
    CONSTRAINT `fk_eval_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SAMPLE DATA (DỮ LIỆU MẪU BAN ĐẦU)
-- Mật khẩu mặc định cho tất cả user: 123456 (BCrypt encoded: $2a$10$e8W/h3FwPZ... ví dụ)
-- ============================================================

INSERT INTO `departments` (`id`, `name`, `budget_limit`) VALUES
(1, 'Phòng Công nghệ thông tin', 500000000.00),
(2, 'Phòng Hành chính Nhân sự', 200000000.00),
(3, 'Phòng Kế toán Tài chính', 300000000.00);

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `email`, `role`, `department_id`, `status`) VALUES
(1, 'admin', '123456', 'Đinh Mạnh Toàn (Admin)', 'admin@company.com', 'ADMIN', 1, 'ACTIVE'),
(2, 'approver1', '123456', 'Hà Quang Đức Anh (TP Duyệt)', 'ducanh@company.com', 'APPROVER', 1, 'ACTIVE'),
(3, 'purchaser1', '123456', 'Phùng Bảo Trường (Mua hàng)', 'truong@company.com', 'PURCHASER', 1, 'ACTIVE'),
(4, 'purchaser2', '123456', 'Hoàng Xuân Hưng (Mua hàng)', 'hung@company.com', 'PURCHASER', 1, 'ACTIVE'),
(5, 'requester1', '123456', 'Trần Hồng Lịch (Nhân viên)', 'lich@company.com', 'REQUESTER', 1, 'ACTIVE');

INSERT INTO `vendors` (`id`, `name`, `tax_code`, `contact_person`, `email`, `phone`, `address`, `rating_avg`) VALUES
(1, 'Công ty TNHH Thiết bị Văn phòng Phong Vũ', '0301234567', 'Nguyễn Văn A', 'contact@phongvu.vn', '0901234567', 'Tầng 5, Tòa nhà Lotte, Hà Nội', 4.80),
(2, 'Công ty Cổ phần Máy tính FPT', '0101234568', 'Trần Thị B', 'sales@fpt.com.vn', '0912345678', 'Số 10 Phạm Văn Đồng, Hà Nội', 4.50),
(3, 'Nhà cung cấp Giấy & Văn phòng phẩm Hồng Hà', '0100987654', 'Lê Văn C', 'hongha@vpp.vn', '0987654321', 'Số 25 Lý Thường Kiệt, Hà Nội', 4.20);
