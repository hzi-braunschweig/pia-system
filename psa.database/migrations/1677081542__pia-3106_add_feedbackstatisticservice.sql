CREATE ROLE feedbackstatisticservice_role;

--
-- Name: feedbackstatisticservice; Type: SCHEMA; Schema: -
--
CREATE SCHEMA feedbackstatisticservice;


--
-- Name: SCHEMA feedbackstatisticservice; Type: ACL; Schema: -
--

GRANT ALL ON SCHEMA feedbackstatisticservice TO feedbackstatisticservice_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: feedbackstatisticservice
--

ALTER DEFAULT PRIVILEGES IN SCHEMA feedbackstatisticservice GRANT SELECT,USAGE ON SEQUENCES  TO feedbackstatisticservice_role;

--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: feedbackstatisticservice
--

ALTER DEFAULT PRIVILEGES IN SCHEMA feedbackstatisticservice GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO feedbackstatisticservice_role;

