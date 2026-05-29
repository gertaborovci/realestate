-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 29, 2026 at 05:15 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `findhome_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `agent_ratings`
--

CREATE TABLE `agent_ratings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `agent_name` varchar(100) NOT NULL,
  `rating` decimal(2,1) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `agent_ratings`
--

INSERT INTO `agent_ratings` (`id`, `user_id`, `agent_id`, `agent_name`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Genc Berisha', 2.5, 'dfghjkl', '2026-05-28 15:23:06', '2026-05-28 15:23:06'),
(3, 1, 4, 'Luan Gashi', 3.5, 'SZdfghn ', '2026-05-28 21:59:46', '2026-05-28 21:59:46'),
(4, 1, 3, 'Dafina Hoxha', 2.5, 'aSDFTGH', '2026-05-28 22:21:31', '2026-05-28 22:21:51');

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `property_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`property_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `property_id`, `property_data`, `created_at`) VALUES
(9, 1, 6, '{\"id\":6,\"title\":\"testttt3\",\"price\":50020,\"location\":\"prishtina\",\"rooms\":3,\"bathrooms\":1,\"area\":\"90\",\"status\":\"E Lirë\",\"image\":\"\",\"created_at\":\"2026-05-24T22:47:48.000Z\",\"type\":\"Shitje\"}', '2026-05-28 22:21:58'),
(11, 1, 5, '{\"id\":5,\"title\":\"Testtt2\",\"price\":22000,\"location\":\"Prishtina\",\"rooms\":2,\"bathrooms\":2,\"area\":\"222\",\"status\":\"E Lirë\",\"image\":\"\",\"created_at\":\"2026-05-24T21:56:42.000Z\",\"type\":\"Shitje\"}', '2026-05-28 22:22:00');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `location` varchar(255) NOT NULL,
  `rooms` int(11) NOT NULL,
  `bathrooms` int(11) NOT NULL,
  `area` varchar(50) NOT NULL,
  `status` varchar(50) DEFAULT 'Available',
  `image` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` varchar(50) DEFAULT 'BUY'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `title`, `price`, `location`, `rooms`, `bathrooms`, `area`, `status`, `image`, `created_at`, `type`) VALUES
(1, 'Modern Glass Villa', 1250000, 'Dubai, UAE', 5, 6, '850', 'Available', '', '2026-04-18 15:46:21', 'BUY'),
(2, 'Classic Brick House', 450000, 'London, UK', 4, 3, '220', 'Sold', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1000', '2026-04-18 15:46:21', 'BUY'),
(3, 'City Center Apartment', 180000, 'Pristina, KS', 2, 1, '95', 'Available', 'https://images.unsplash.com/photo-1581012733671-add375751324?q=80&w=1000', '2026-04-18 15:46:21', 'BUY'),
(4, 'Test villa', 200000, 'Prishtine, Bregu i hanes', 4, 1, '160', 'E Lirë', '', '2026-05-24 17:33:15', 'Shitje'),
(5, 'Testtt2', 22000, 'Prishtina', 2, 2, '222', 'E Lirë', '', '2026-05-24 21:56:42', 'Shitje'),
(6, 'testttt3', 50020, 'prishtina', 3, 1, '90', 'E Lirë', '', '2026-05-24 22:47:48', 'Shitje'),
(7, 'rrrrrrr', 22200, 'Prishtina', 2, 2, '22', 'E Lirë', '', '2026-05-24 23:10:23', 'Shitje');

-- --------------------------------------------------------

--
-- Table structure for table `propertyfeatures`
--

CREATE TABLE `propertyfeatures` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `emertimi` varchar(100) NOT NULL,
  `vlera` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `propertyfeatures`
--

INSERT INTO `propertyfeatures` (`id`, `property_id`, `emertimi`, `vlera`) VALUES
(1, 4, 'Ashensor', 'po'),
(2, 4, 'Shkalle emergjemte', 'PO'),
(3, 4, 'Pishine', 'Po'),
(4, 1, 'Elevator', 'Yes'),
(5, 7, '1', 'yes');

-- --------------------------------------------------------

--
-- Table structure for table `propertyimages`
--

CREATE TABLE `propertyimages` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `eshte_kryesore` tinyint(1) DEFAULT 0,
  `renditja` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `propertyimages`
--

INSERT INTO `propertyimages` (`id`, `property_id`, `image_url`, `eshte_kryesore`, `renditja`) VALUES
(1, 1, '/uploads/1779632762471.jpg', 0, 0),
(2, 1, '/uploads/1779632762484.jpg', 1, 0),
(3, 4, '/uploads/1779643995194.jpg', 1, 0),
(4, 4, '/uploads/1779643995233.jpg', 0, 0),
(5, 1, '/uploads/1779663276921.jpg', 1, 0),
(6, 1, '/uploads/1779663276939.jpg', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `testimonials`
--

CREATE TABLE `testimonials` (
  `id` int(11) NOT NULL,
  `klienti_emri` varchar(100) NOT NULL DEFAULT 'Anonymous',
  `teksti` text NOT NULL,
  `data_publikimit` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `license_id` varchar(100) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','agent','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `phone`, `bio`, `license_id`, `specialization`, `photo_url`, `password`, `role`, `created_at`) VALUES
(1, 'Art Rudari', 'a21564756@gmail.com', NULL, NULL, NULL, NULL, NULL, '$2b$10$n5.vUgTrKswO0jeL0jEXJO..Qn4ANm7c9XbWyJCvyULeYQycCJ9am', 'agent', '2026-05-28 11:34:52'),
(2, 'Olt Rudari', 'Olti@user.com', NULL, NULL, NULL, NULL, '', '$2b$10$teeYeVySWF/J26RItCDhRO9hKHZCfYF0UMcuKUKLVNcK8h7b1Qzrq', 'user', '2026-05-28 11:40:39'),
(3, 'Alba', 'alba@ubt-uni.net', NULL, NULL, NULL, NULL, '/uploads/profiles/profile_3_1780009701901.png', '$2b$10$0eXsk6Kq1JS1Tmi84Enx0OrbLje8RNwfIDffZrrraaLXC7SGIVKiy', 'admin', '2026-05-28 13:52:32'),
(4, 'eli by', 'eb74413@ubt-uni.net', NULL, NULL, NULL, NULL, NULL, '$2b$10$Dmel0xA5pV7VpC3JO4c5vuPMjaxRKwVlqMFcwh34ag2Js6.ohc9Ie', 'agent', '2026-05-28 22:53:25'),
(5, 'elii', 'elii@gmail.com', NULL, NULL, NULL, NULL, NULL, '$2b$10$eVRId4ZCQhRRETWSgh8JkOWXwZNXKqBmoocY4HNuQsl4iuVmJzq1O', 'user', '2026-05-28 23:22:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `agent_ratings`
--
ALTER TABLE `agent_ratings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_agent` (`user_id`,`agent_id`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_property` (`user_id`,`property_id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `propertyfeatures`
--
ALTER TABLE `propertyfeatures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `propertyimages`
--
ALTER TABLE `propertyimages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `testimonials`
--
ALTER TABLE `testimonials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `agent_ratings`
--
ALTER TABLE `agent_ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `propertyfeatures`
--
ALTER TABLE `propertyfeatures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `propertyimages`
--
ALTER TABLE `propertyimages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `testimonials`
--
ALTER TABLE `testimonials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `agent_ratings`
--
ALTER TABLE `agent_ratings`
  ADD CONSTRAINT `agent_ratings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `propertyfeatures`
--
ALTER TABLE `propertyfeatures`
  ADD CONSTRAINT `propertyfeatures_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `propertyimages`
--
ALTER TABLE `propertyimages`
  ADD CONSTRAINT `propertyimages_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
