// Seed admin user
db = db.getSiblingDB('auth_db');

// Delete existing admin if any
db.users.deleteOne({email: "admin@healthcure.com"});

// Insert new admin user
// Password: admin123 (bcrypt hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G9fqZFrAYPVJWe)
db.users.insertOne({
  _id: ObjectId(),
  email: "admin@healthcure.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G9fqZFrAYPVJWe",
  name: "Administrator",
  role: "admin",
  patientId: null,
  createdAt: new Date()
});

print("✅ Admin user created successfully!");
print("Email: admin@healthcure.com");
print("Password: admin123");

