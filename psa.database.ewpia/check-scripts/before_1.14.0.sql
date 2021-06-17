SELECT COUNT(*)
FROM compliances
GROUP BY username
HAVING COUNT(*) > 1;
-- should return empty result
-- otherwise delete all but newest entry of that user

