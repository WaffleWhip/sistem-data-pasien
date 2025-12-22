db = db.getSiblingDB('patientdb');

db.createUser({
  user: 'admin',
  pwd: 'admin123',
  roles: [{ role: 'readWrite', db: 'patientdb' }]
});

db.getCollection('patients').insertMany([
  {
    name: 'Budi Santoso',
    age: 45,
    gender: 'Male',
    address: 'Jl. Melati No. 12, Jakarta',
    phone: '0811-2222-3333',
    diagnosis: 'Hipertensi',
    doctorNotes: 'Perlu kontrol rutin setiap bulan.',
    status: 'Active',
    createdBy: 'system_init',
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Siti Aminah',
    age: 28,
    gender: 'Female',
    address: 'Apartemen Green Bay L-10, Pluit',
    phone: '0812-4444-5555',
    diagnosis: 'Asma Bronkial',
    doctorNotes: 'Hindari pemicu alergi debu.',
    status: 'Recovered',
    createdBy: 'system_init',
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Agus Prayogo',
    age: 60,
    gender: 'Male',
    address: 'Perumahan Fajar Indah Blok C-4, Solo',
    phone: '0813-6666-7777',
    diagnosis: 'Diabetes Melitus Tipe 2',
    doctorNotes: 'Diet rendah gula dan olahraga teratur.',
    status: 'Active',
    createdBy: 'system_init',
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);