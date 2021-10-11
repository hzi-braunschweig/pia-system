-- creates a default admin user that can be used for tests

\connect pia_database;

COPY users (username, password, role, first_logged_in_at, notification_time, logged_in_with, compliance_labresults, compliance_samples, needs_material, pw_change_needed, number_of_wrong_attempts, third_wrong_password_at, study_center, examination_wave, compliance_bloodsamples, is_test_proband, account_status, study_status, ids, logging_active, salt) FROM stdin;
Administrator	1881afc6614abb3d600db62aebc4fdca433a9fa931e6f58acae797111deb41dd11b0cffc29c1cbd36392f9120ed4d5746acaa213f3b9883cf58f8e5ca46ab4ac5a0bc6b7bf61a285c676299bcb6143fe70acd17372f8bff91d014e4edd34b7fe7521590a0a46fb361f058a324d79be9eb08be7b129f17b9e4091362b1f39798a	SysAdmin	2020-07-22	\N	web	t	t	f	f	0	\N	\N	1	t	f	active	active	\N	t	207da6658074436e
\.
