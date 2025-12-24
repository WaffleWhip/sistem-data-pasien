const Doctor = require('./models/Doctor');

const seedDoctors = async () => {
  try {
    // Check if doctors already exist
    const count = await Doctor.countDocuments();
    if (count > 0) {
      console.log('⏭️  Dokter sudah ada, skip seeding.');
      return;
    }

    const doctors = [
      {
        nip: 'NIP001',
        name: 'Dr. Andi Pratama',
        specialization: 'Dokter Umum',
        email: 'andi.pratama@healthcure.com',
        phone: '081234567001',
        schedule: 'Senin - Jumat: 08:00 - 15:00',
        room: 'Ruang 101',
        isActive: true
      },
      {
        nip: 'NIP002',
        name: 'Dr. Siti Rahayu',
        specialization: 'Dokter Gigi',
        email: 'siti.rahayu@healthcure.com',
        phone: '081234567002',
        schedule: 'Senin - Kamis: 09:00 - 16:00',
        room: 'Ruang 102',
        isActive: true
      },
      {
        nip: 'NIP003',
        name: 'Dr. Budi Santoso',
        specialization: 'Dokter Anak',
        email: 'budi.santoso@healthcure.com',
        phone: '081234567003',
        schedule: 'Selasa - Sabtu: 10:00 - 17:00',
        room: 'Ruang 103',
        isActive: true
      }
    ];

    await Doctor.insertMany(doctors);
    console.log('✅ 3 Dokter template berhasil ditambahkan!');
  } catch (error) {
    console.error('❌ Error seeding doctors:', error.message);
  }
};

module.exports = seedDoctors;
