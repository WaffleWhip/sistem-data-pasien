// Switch to the 'authdb' database
db = db.getSiblingDB('authdb');

// Create a user for the auth-service to connect with.
db.createUser({
  user: 'authuser',
  pwd: 'authpassword',
  roles: [{ role: 'readWrite', db: 'authdb' }]
});

// Create only the superadmin account
db.getCollection('users').insertMany([
  {
    username: 'superadmin',
    email: 'superadmin@example.com',
    // Hash for: superpassword
    password: '$2b$12$7nce6EkscZXVZWE9Q/iWueUc74phCbGd68x53qmj/87DX.xnUMQg.',
    role: 'superadmin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);