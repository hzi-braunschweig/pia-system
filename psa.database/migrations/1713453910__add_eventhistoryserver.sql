CREATE ROLE eventhistoryserver_role;

--
-- Name: eventhistoryserver; Type: SCHEMA; Schema: -
--
CREATE SCHEMA eventhistoryserver;

--
-- Name: SCHEMA eventhistoryserver; Type: ACL; Schema: -
--

GRANT ALL ON SCHEMA eventhistoryserver TO eventhistoryserver_role;

--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: eventhistoryserver
--

ALTER DEFAULT PRIVILEGES IN SCHEMA eventhistoryserver GRANT SELECT,USAGE ON SEQUENCES  TO eventhistoryserver_role;

--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: eventhistoryserver
--

ALTER DEFAULT PRIVILEGES IN SCHEMA eventhistoryserver GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO eventhistoryserver_role;

