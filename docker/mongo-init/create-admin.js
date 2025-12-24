db = db.getSiblingDB('auth_db');
db.users.deleteOne({email: 'admin@healthcure.com'});
db.users.insertOne({
  email: 'admin@healthcure.com',
  password: '$2a$12$LlTmBMCEdKPrPTdHVNQLEOId9NjNbJtOuZgSKkR8z2WRsJkqHZgwa',
  name: 'Administrator',
  role: 'admin',
  patientId: null,
  createdAt: new Date()
});
print('✅ Admin created successfully!');
print('Email: admin@healthcure.com');
print('Password: admin123');
