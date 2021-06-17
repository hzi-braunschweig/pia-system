DELETE
FROM users
WHERE username IN (
    'DoNotDeleteUser1',
    'DoNotDeleteUser2',
    'DoNotDeleteUser3',
    'DoNotDeleteUser4',
    'DoNotDeleteUser5',
    'DoDeleteUser1',
    'DoDeleteUser2',
    'DoDeleteUser3',
    'DoDeleteUser4'
);

DELETE FROM studies WHERE name = 'SORMAS Teststudie';
