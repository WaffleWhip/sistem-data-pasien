db = db.getSiblingDB('authdb');

db.createUser({
  user: 'authuser',
  pwd: 'authpassword',
  roles: [
    { role: 'readWrite', db: 'authdb' },
    { role: 'dbAdmin', db: 'authdb' }
  ]
});

db.createCollection('users');
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

print(' Auth database initialized');
