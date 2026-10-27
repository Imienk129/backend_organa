const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const INITIAL_DATA = {
  users: [
    {
      uid: 'u101',
      nama: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@organa.id',
      password: 'password123',
      role: 'Pengurus',
      noHp: '0812-3456-7890',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'u100',
      nama: 'Muhammad Rayhan',
      email: 'rayhan.ketua@organa.id',
      password: 'password123',
      role: 'Ketua/Admin',
      noHp: '0811-9876-5432',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'u102',
      nama: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@organa.id',
      password: 'password123',
      role: 'Pengurus',
      noHp: '0813-2233-4455',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'u103',
      nama: 'Budi Santoso',
      email: 'budi.santoso@organa.id',
      password: 'password123',
      role: 'Anggota',
      noHp: '0857-1122-3344',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'u104',
      nama: 'Rian Pratama',
      email: 'rian.pratama@organa.id',
      password: 'password123',
      role: 'Anggota',
      noHp: '0878-5566-7788',
      createdAt: new Date().toISOString()
    }
  ],
  activities: [
    {
      id: 'act01',
      namaKegiatan: 'Musyawarah Kerja Anggota 2026',
      deskripsi: 'Penyusunan program kerja dan evaluasi organisasi semester ganjil.',
      lokasi: 'Auditorium Gd. Rektorat Lt. 3',
      latitude: -6.914744,
      longitude: 107.609810,
      radiusMeters: 50,
      tanggalMulai: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      tanggalSelesai: new Date(Date.now() + 3 * 24 * 3600 * 1000 + 8 * 3600 * 1000).toISOString(),
      status: 'Mendatang',
      progress: 67.0,
      penanggungJawab: 'Ahmad Fauzi'
    },
    {
      id: 'act02',
      namaKegiatan: 'Workshop Desain Grafis & Branding',
      deskripsi: 'Pelatihan pembuatan identitas visual dan konten media sosial pengurus.',
      lokasi: 'Lab Komputer Multimedia',
      latitude: -6.914800,
      longitude: 107.609900,
      radiusMeters: 40,
      tanggalMulai: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      tanggalSelesai: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      status: 'Berlangsung',
      progress: 50.0,
      penanggungJawab: 'Siti Nurhaliza'
    }
  ],
  tasks: [
    {
      id: 't01',
      activityId: 'act01',
      judul: 'Finalisasi Proposal Anggaran & Sponsorship',
      deskripsi: 'Review RAB divisi perlengkapan dan konsumsi bersama bendahara.',
      assignedTo: 'Ahmad Fauzi',
      assignedToUid: 'u101',
      deadline: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
      priority: 'High',
      weight: 3,
      status: 'In Progress'
    },
    {
      id: 't02',
      activityId: 'act01',
      judul: 'Konfirmasi Surat Izin Peminjaman Tempat',
      deskripsi: 'Serahkan surat permohonan ke biro sarana prasarana.',
      assignedTo: 'Ahmad Fauzi',
      assignedToUid: 'u101',
      deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      priority: 'Medium',
      weight: 2,
      status: 'Todo'
    },
    {
      id: 't03',
      activityId: 'act01',
      judul: 'Publikasi Rundown & Tata Tertib',
      deskripsi: 'Kirimkan pamflet agenda kegiatan di broadcast WhatsApp anggota.',
      assignedTo: 'Siti Nurhaliza',
      assignedToUid: 'u102',
      deadline: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      priority: 'Low',
      weight: 1,
      status: 'Done'
    },
    {
      id: 't04',
      activityId: 'act02',
      judul: 'Persiapan Modul Materi & Desain',
      deskripsi: 'Siapkan materi pelatihan dan software pendukung.',
      assignedTo: 'Budi Santoso',
      assignedToUid: 'u103',
      deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
      priority: 'High',
      weight: 2,
      status: 'Done'
    },
    {
      id: 't05',
      activityId: 'act02',
      judul: 'Pencetakan Sertifikat Peserta & Plakat',
      deskripsi: 'Cetak 50 sertifikat dan plakat narasumber.',
      assignedTo: 'Rian Pratama',
      assignedToUid: 'u104',
      deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      priority: 'Medium',
      weight: 2,
      status: 'Todo'
    }
  ],
  attendance: [
    {
      id: 'att01',
      activityId: 'act01',
      userId: 'u102',
      nama: 'Siti Nurhaliza',
      checkInTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: 'Present',
      distanceMeters: 12.5
    },
    {
      id: 'att02',
      activityId: 'act01',
      userId: 'u103',
      nama: 'Budi Santoso',
      checkInTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'Present',
      distanceMeters: 8.2
    }
  ],
  sessions: {}
};

class DataStore {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_FILE)) {
      this.save(INITIAL_DATA);
    }
  }

  read() {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      this.save(INITIAL_DATA);
      return INITIAL_DATA;
    }
  }

  save(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  // Recalculate Dynamic Weighted Progress for an Activity
  // Progress = SUM(weight * statusFactor) / SUM(weight) * 100
  // statusFactor: Done=1.0, In Progress=0.5, Todo=0.0
  recalculateActivityProgress(activityId) {
    const data = this.read();
    const tasks = data.tasks.filter(t => t.activityId === activityId);
    if (tasks.length === 0) return 0;

    let totalWeight = 0;
    let earnedWeight = 0;

    for (const t of tasks) {
      const w = Number(t.weight) || 1;
      totalWeight += w;

      const st = (t.status || '').toLowerCase();
      if (st === 'done') {
        earnedWeight += w * 1.0;
      } else if (st === 'in progress') {
        earnedWeight += w * 0.5;
      }
    }

    const progress = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 1000) / 10 : 0;
    const actIdx = data.activities.findIndex(a => a.id === activityId);
    if (actIdx !== -1) {
      data.activities[actIdx].progress = progress;
      if (progress === 100 && data.activities[actIdx].status !== 'Selesai') {
        data.activities[actIdx].status = 'Selesai';
      }
      this.save(data);
    }
    return progress;
  }
}

module.exports = new DataStore();
