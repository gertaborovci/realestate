SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


CREATE TABLE `agencyexpenses` (
  `id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `contracts` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `contract_type` enum('BUY','RENT') NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `contracts` (`id`, `property_id`, `user_id`, `contract_type`, `total_amount`, `start_date`, `created_at`) VALUES
(1, 1, 1, 'BUY', 540000.00, '2026-04-15', '2026-05-22 21:38:20');

CREATE TABLE `maintenancetickets` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Resolved') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `contract_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` varchar(50) DEFAULT 'Credit Card',
  `status` enum('PAID','PENDING','FAILED') DEFAULT 'PAID',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `payments` (`id`, `contract_id`, `amount`, `payment_date`, `payment_method`, `status`, `created_at`) VALUES
(1, 1, 45000.00, '2026-01-10', 'Credit Card', 'PAID', '2026-05-22 21:38:20'),
(2, 1, 95000.00, '2026-02-12', 'Bank Transfer', 'PAID', '2026-05-22 21:38:20'),
(3, 1, 60000.00, '2026-03-05', 'Credit Card', 'PAID', '2026-05-22 21:38:20'),
(4, 1, 140000.00, '2026-04-20', 'Credit Card', 'PAID', '2026-05-22 21:38:20'),
(5, 1, 110000.00, '2026-05-18', 'Bank Transfer', 'PAID', '2026-05-22 21:38:20');


CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` varchar(50) DEFAULT 'BUY'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `properties` (`id`, `title`, `location`, `price`, `created_at`, `type`) VALUES
(1, 'Modern Glass Villa', 'Dubai', 540000.00, '2026-05-22 21:38:20', 'BUY');


CREATE TABLE `propertyimages` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `eshte_kryesore` tinyint(1) DEFAULT 0,
  `renditja` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `visits` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `visit_date` date NOT NULL,
  `visit_time` time NOT NULL,
  `status` enum('PENDING','APPROVED','CANCELLED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `visits` (`id`, `property_id`, `user_id`, `visit_date`, `visit_time`, `status`, `created_at`) VALUES
(1, 1, 1, '2026-06-08', '17:00:00', 'PENDING', '2026-05-23 18:45:58'),
(2, 1, 1, '2026-06-13', '20:00:00', 'PENDING', '2026-05-23 19:48:21');

ALTER TABLE `agencyexpenses`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `contracts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

ALTER TABLE `maintenancetickets`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contract_id` (`contract_id`);

ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `propertyimages`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `visits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

ALTER TABLE `agencyexpenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `contracts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `maintenancetickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `propertyimages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `visits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE;

ALTER TABLE `visits`
  ADD CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;
COMMIT;

