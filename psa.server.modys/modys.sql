/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

CREATE TABLE IF NOT EXISTS `t_address` (
  `pk_address` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `fk_pid` varchar(32) DEFAULT NULL,
  `street` varchar(200) DEFAULT NULL,
  `street_id` varchar(20) DEFAULT NULL,
  `number` varchar(100) DEFAULT NULL COMMENT 'number in street',
  `adr_addon` varchar(100) DEFAULT NULL COMMENT 'adressAddon',
  `zip` varchar(10) DEFAULT NULL COMMENT 'postalCode',
  `city` varchar(100) DEFAULT NULL,
  `city_id` varchar(20) DEFAULT NULL COMMENT 'GKZ',
  `city_quarter` varchar(40) DEFAULT NULL COMMENT 'urbanDistrict',
  `country` varchar(30) DEFAULT NULL COMMENT 'region',
  `county_fk_lang` varchar(255) DEFAULT NULL,
  `state_fk_lang` varchar(255) DEFAULT NULL COMMENT 'key of state',
  `country_fk_lang` varchar(255) DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `valid_from` datetime DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL COMMENT 'notes, e.g. main appartement',
  PRIMARY KEY (`pk_address`),
  KEY `fk_pid_addr` (`fk_pid`),
  KEY `create_user` (`create_user`),
  CONSTRAINT `create_user_t_address` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `fk_pid_addr` FOREIGN KEY (`fk_pid`) REFERENCES `t_person` (`pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_contact_descr` (
  `cont_descr_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `fk_cont_type_id` int(11) NOT NULL,
  `name_fk_lang` varchar(255) NOT NULL,
  `list_element` tinyint(1) NOT NULL,
  `cd_order` int(11) NOT NULL,
  `fk_project_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`cont_descr_id`),
  KEY `create_user` (`create_user`),
  KEY `contact_descr_2_contact_type` (`fk_cont_type_id`),
  KEY `contact_descr_2_project` (`fk_project_id`),
  CONSTRAINT `contact_descr_2_contact_type` FOREIGN KEY (`fk_cont_type_id`) REFERENCES `t_contact_type` (`cont_type_id`),
  CONSTRAINT `contact_descr_2_project` FOREIGN KEY (`fk_project_id`) REFERENCES `t_project` (`project_id`),
  CONSTRAINT `create_user_t_contact_descr` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`)
) ENGINE=InnoDB AUTO_INCREMENT=22801 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_contact_details` (
  `cd_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `fk_pid` varchar(32) NOT NULL,
  `fk_cd_type_id` int(11) NOT NULL,
  `cd_value` varchar(255) NOT NULL,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `remark` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`cd_id`),
  KEY `create_user_t_contact_details` (`create_user`),
  KEY `contact_details_2_person` (`fk_pid`),
  KEY `contact_details_2_cd_type` (`fk_cd_type_id`),
  CONSTRAINT `contact_details_2_cd_type` FOREIGN KEY (`fk_cd_type_id`) REFERENCES `t_cd_type` (`cd_type_id`),
  CONSTRAINT `contact_details_2_person` FOREIGN KEY (`fk_pid`) REFERENCES `t_person` (`pid`),
  CONSTRAINT `create_user_t_contact_details` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*!40000 ALTER TABLE `t_contact_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_contact_details` ENABLE KEYS */;

CREATE TABLE IF NOT EXISTS `t_contact_person` (
  `cont_pers_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `cont_pers_descr_fk_lang` varchar(255) NOT NULL,
  `ordinal` int(11) NOT NULL DEFAULT '99',
  PRIMARY KEY (`cont_pers_id`),
  KEY `create_user` (`create_user`),
  CONSTRAINT `create_user_t_contact_person` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_contact_result` (
  `cont_res_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `fk_form_id` int(11) DEFAULT NULL,
  `name_fk_lang` varchar(255) NOT NULL,
  `list_element` tinyint(1) DEFAULT NULL,
  `cr_order` int(11) DEFAULT NULL,
  `fk_cont_type_id` int(11) NOT NULL,
  `drop_appointment` tinyint(1) NOT NULL,
  `warning_fk_lang` varchar(255) DEFAULT NULL,
  `fk_crg_id` int(11) DEFAULT NULL,
  `fk_drop_out_grp` int(11) DEFAULT NULL,
  `fk_project_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`cont_res_id`),
  KEY `create_user` (`create_user`),
  KEY `contact_result_2_form` (`fk_form_id`),
  KEY `contact_result_2_contact_type` (`fk_cont_type_id`),
  KEY `contact_result_2_contact_res_grp` (`fk_crg_id`),
  KEY `contact_result_2_drop_out_grp` (`fk_drop_out_grp`),
  KEY `contact_result_2_project` (`fk_project_id`),
  CONSTRAINT `contact_result_2_contact_res_grp` FOREIGN KEY (`fk_crg_id`) REFERENCES `t_contact_res_grp` (`crg_id`),
  CONSTRAINT `contact_result_2_contact_type` FOREIGN KEY (`fk_cont_type_id`) REFERENCES `t_contact_type` (`cont_type_id`),
  CONSTRAINT `contact_result_2_drop_out_grp` FOREIGN KEY (`fk_drop_out_grp`) REFERENCES `t_drop_out_grp` (`dog_id`),
  CONSTRAINT `contact_result_2_form` FOREIGN KEY (`fk_form_id`) REFERENCES `t_form` (`form_id`),
  CONSTRAINT `contact_result_2_project` FOREIGN KEY (`fk_project_id`) REFERENCES `t_project` (`project_id`),
  CONSTRAINT `create_user_t_contact_result` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`)
) ENGINE=InnoDB AUTO_INCREMENT=3301 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_contact_type` (
  `cont_type_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `cont_type_name_fk_lang` varchar(255) NOT NULL,
  PRIMARY KEY (`cont_type_id`),
  KEY `create_user` (`create_user`),
  CONSTRAINT `create_user_t_contact_type` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_drop_out_code` (
  `doc_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `fk_dog_id` int(11) NOT NULL,
  `name_fk_lang` varchar(255) NOT NULL,
  `doc_order` int(11) NOT NULL,
  PRIMARY KEY (`doc_id`),
  KEY `create_user` (`create_user`),
  KEY `drop_out_code_2_drop_out_grp` (`fk_dog_id`),
  CONSTRAINT `create_user_t_drop_out_code` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `drop_out_code_2_drop_out_grp` FOREIGN KEY (`fk_dog_id`) REFERENCES `t_drop_out_grp` (`dog_id`)
) ENGINE=InnoDB AUTO_INCREMENT=521 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_drop_out_grp` (
  `dog_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `dog_name_fk_lang` varchar(255) NOT NULL,
  PRIMARY KEY (`dog_id`),
  KEY `create_user` (`create_user`),
  CONSTRAINT `create_user_t_drop_out_grp` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_language` (
  `pk_language` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `lang_key` varchar(255) NOT NULL COMMENT 'languageKey',
  `lang_code` varchar(7) NOT NULL COMMENT 'isoCode 639',
  `lang_value` varchar(255) DEFAULT NULL COMMENT 'value of translation',
  `lang_value_short` varchar(255) DEFAULT NULL COMMENT 'shortValue of translation',
  PRIMARY KEY (`pk_language`),
  KEY `fk_lang_key` (`lang_key`),
  KEY `create_user` (`create_user`),
  CONSTRAINT `create_user_t_language` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `fk_lang_key` FOREIGN KEY (`lang_key`) REFERENCES `t_languagedef` (`lang_key`)
) ENGINE=InnoDB AUTO_INCREMENT=1454 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_nationality` (
  `nation_id` int(11) NOT NULL COMMENT 'primaryKey, id of nationality',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `nation_numcode` int(3) NOT NULL COMMENT 'numeric nationality code',
  `nation_fk_lang` varchar(255) NOT NULL COMMENT 'languageKey of nationality',
  `outdated` tinyint(1) DEFAULT '0' COMMENT 'validity of entry',
  PRIMARY KEY (`nation_id`),
  UNIQUE KEY `nation_numcode` (`nation_numcode`),
  KEY `nation_fk_lang` (`nation_fk_lang`),
  KEY `create_user_t_nationality` (`create_user`),
  CONSTRAINT `create_user_t_nationality` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `nation_fk_lang` FOREIGN KEY (`nation_fk_lang`) REFERENCES `t_language` (`lang_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_person` (
  `pk_person` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `pid` varchar(32) NOT NULL COMMENT 'personal identifier',
  `salutation` varchar(10) DEFAULT NULL,
  `title` varchar(50) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL COMMENT 'family name',
  `firstname` varchar(100) DEFAULT NULL COMMENT 'given name',
  `firstname_addon` varchar(200) DEFAULT NULL,
  `initials` varchar(4) DEFAULT NULL,
  `sex_fk_lang` varchar(255) DEFAULT NULL COMMENT 'see t_language',
  `fk_nation_id` int(11) DEFAULT '999',
  `dob_day` int(2) DEFAULT NULL COMMENT 'day of birth - day',
  `dob_month` int(2) DEFAULT NULL COMMENT 'day of birth - month',
  `dob_year` int(4) DEFAULT NULL COMMENT 'day of birth - year (yyyy)',
  `dob_place` varchar(100) DEFAULT NULL COMMENT 'place of birth',
  `prim_addr_fk_address` int(11) DEFAULT NULL COMMENT 'primaryAddressID',
  PRIMARY KEY (`pk_person`),
  UNIQUE KEY `pid` (`pid`),
  KEY `sex_fk_lang` (`sex_fk_lang`),
  KEY `fk_nation_id` (`fk_nation_id`),
  KEY `create_user` (`create_user`),
  KEY `prim_addr_fk_address` (`prim_addr_fk_address`),
  CONSTRAINT `create_user_t_person` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `fk_nation_id` FOREIGN KEY (`fk_nation_id`) REFERENCES `t_nationality` (`nation_id`),
  CONSTRAINT `prim_addr_fk_address` FOREIGN KEY (`prim_addr_fk_address`) REFERENCES `t_address` (`pk_address`),
  CONSTRAINT `sex_fk_lang` FOREIGN KEY (`sex_fk_lang`) REFERENCES `t_language` (`lang_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_person_identifier` (
  `person_identifier_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `fk_pid` varchar(32) NOT NULL,
  `fk_identifier_id` int(11) NOT NULL,
  `value` varchar(32) NOT NULL,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  PRIMARY KEY (`person_identifier_id`),
  KEY `create_user_t_person_identifier` (`create_user`),
  KEY `t_person_identifier_fk_pid_2_pid` (`fk_pid`),
  KEY `t_person_identifier_fk_identifier_id_2_identifier_id` (`fk_identifier_id`),
  CONSTRAINT `create_user_t_person_identifier` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `t_person_identifier_fk_identifier_id_2_identifier_id` FOREIGN KEY (`fk_identifier_id`) REFERENCES `t_identifier` (`identifier_id`),
  CONSTRAINT `t_person_identifier_fk_pid_2_pid` FOREIGN KEY (`fk_pid`) REFERENCES `t_person` (`pid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_protocol` (
  `prot_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `parent_protocol_id` int(11) DEFAULT NULL,
  `commit_user` int(11) DEFAULT NULL,
  `commit_date` datetime DEFAULT NULL,
  `fk_pid` varchar(32) NOT NULL,
  `contact_date` datetime NOT NULL,
  `fk_doc_id` int(11) DEFAULT NULL,
  `fk_project_id` int(11) DEFAULT NULL,
  `fk_contdescr_id` int(11) DEFAULT NULL,
  `fk_contres_id` int(11) DEFAULT NULL,
  `remark` text,
  `fk_station_from` int(11) DEFAULT NULL,
  `fk_station_to` int(11) DEFAULT NULL,
  `fk_cont_pers_id` int(11) NOT NULL,
  `ordinal` int(11) DEFAULT NULL,
  `delete_flag` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`prot_id`),
  KEY `create_user` (`create_user`),
  KEY `commit_user_t_protocol` (`commit_user`),
  KEY `protocol_2_protocol` (`parent_protocol_id`),
  KEY `protocol_2_person` (`fk_pid`),
  KEY `protocol_2_drop_out_code` (`fk_doc_id`),
  KEY `protocol_2_contact_descr` (`fk_contdescr_id`),
  KEY `protocol_2_contact_result` (`fk_contres_id`),
  KEY `protocol_2_station_s_station_from` (`fk_station_from`),
  KEY `protocol_2_station_s_station_to` (`fk_station_to`),
  KEY `protocol_2_contact_person` (`fk_cont_pers_id`),
  KEY `protocol_2_project` (`fk_project_id`),
  CONSTRAINT `commit_user_t_protocol` FOREIGN KEY (`commit_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `create_user_t_protocol` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `protocol_2_contact_descr` FOREIGN KEY (`fk_contdescr_id`) REFERENCES `t_contact_descr` (`cont_descr_id`),
  CONSTRAINT `protocol_2_contact_person` FOREIGN KEY (`fk_cont_pers_id`) REFERENCES `t_contact_person` (`cont_pers_id`),
  CONSTRAINT `protocol_2_contact_result` FOREIGN KEY (`fk_contres_id`) REFERENCES `t_contact_result` (`cont_res_id`),
  CONSTRAINT `protocol_2_drop_out_code` FOREIGN KEY (`fk_doc_id`) REFERENCES `t_drop_out_code` (`doc_id`),
  CONSTRAINT `protocol_2_person` FOREIGN KEY (`fk_pid`) REFERENCES `t_person` (`pid`),
  CONSTRAINT `protocol_2_project` FOREIGN KEY (`fk_project_id`) REFERENCES `t_project` (`project_id`),
  CONSTRAINT `protocol_2_protocol` FOREIGN KEY (`parent_protocol_id`) REFERENCES `t_protocol` (`prot_id`),
  CONSTRAINT `protocol_2_station_s_station_from` FOREIGN KEY (`fk_station_from`) REFERENCES `t_station` (`sid`),
  CONSTRAINT `protocol_2_station_s_station_to` FOREIGN KEY (`fk_station_to`) REFERENCES `t_station` (`sid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `t_station` (
  `sid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'primaryKey',
  `create_user` int(11) NOT NULL COMMENT 'the create user of this dataset, foreign key constraint to t_app_user.pk_app_user',
  `lastchange` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'timestamp this dataset was created or updated last time',
  `name_fk_lang` varchar(255) NOT NULL,
  `fk_stype_id` int(11) NOT NULL,
  `fk_project_id` int(11) NOT NULL,
  `is_std` tinyint(1) NOT NULL DEFAULT '0',
  `lock_person` tinyint(1) NOT NULL DEFAULT '0',
  `remark_fk_lang` varchar(255) NOT NULL,
  `visible` tinyint(1) NOT NULL DEFAULT '0',
  `pos_x` int(4) DEFAULT NULL,
  `pos_y` int(4) DEFAULT NULL,
  `ordinal` int(11) NOT NULL DEFAULT '0',
  `description_fk_lang` varchar(255) DEFAULT NULL,
  `fk_membership_type_id` int(7) DEFAULT NULL,
  `fk_email_id` mediumint(7) DEFAULT NULL,
  PRIMARY KEY (`sid`),
  KEY `create_user` (`create_user`),
  KEY `station_type` (`fk_stype_id`),
  KEY `project` (`fk_project_id`),
  KEY `membership_type_id` (`fk_membership_type_id`),
  KEY `station_2_email` (`fk_email_id`),
  CONSTRAINT `create_user_t_station` FOREIGN KEY (`create_user`) REFERENCES `t_app_user` (`pk_app_user`),
  CONSTRAINT `membership_type_id` FOREIGN KEY (`fk_membership_type_id`) REFERENCES `t_membership_type` (`membership_type_id`),
  CONSTRAINT `station_2_email` FOREIGN KEY (`fk_email_id`) REFERENCES `t_email` (`id`),
  CONSTRAINT `station_2_project` FOREIGN KEY (`fk_project_id`) REFERENCES `t_project` (`project_id`),
  CONSTRAINT `station_2_station_type` FOREIGN KEY (`fk_stype_id`) REFERENCES `t_station_type` (`stype_id`)
) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;