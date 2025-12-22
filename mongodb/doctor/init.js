db = db.getSiblingDB('doctordb');

db.createUser({
  user: 'doctoruser',
  pwd: 'doctorpassword',
  roles: [{ role: 'readWrite', db: 'doctordb' }]
});

db.getCollection('doctors').insertMany([
  {
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    phone: '0812-3456-7890',
    email: 'sarah.j@healthcure.com',
    isActive: true,
    createdBy: 'system_init',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Pediatrician',
    phone: '0812-9876-5432',
    email: 'm.chen@healthcure.com',
    isActive: true,
    createdBy: 'system_init',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Dr. Anita Wijaya',
    specialty: 'Dermatologist',
    phone: '0813-1122-3344',
    email: 'anita.w@healthcure.com',
    isActive: true,
    createdBy: 'system_init',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);