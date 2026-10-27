const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./datastore');
const security = require('./security');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'ORGANA Backend REST API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const data = db.read();
  const user = data.users.find(
    u => u.email.toLowerCase() === (email || '').toLowerCase().trim()
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'Email tidak terdaftar.' });
  }

  // Simplified password check for development
  if (user.password && password && user.password !== password) {
    return res.status(401).json({ success: false, message: 'Kata sandi salah.' });
  }

  res.json({
    success: true,
    message: 'Login berhasil.',
    user: {
      uid: user.uid,
      nama: user.nama,
      email: user.email,
      role: user.role,
      noHp: user.noHp
    }
  });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { nama, email, password, noHp, role } = req.body;
  if (!nama || !email) {
    return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi.' });
  }

  const data = db.read();
  const exists = data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (exists) {
    return res.status(409).json({ success: false, message: 'Email sudah digunakan.' });
  }

  const newUser = {
    uid: 'u_' + uuidv4().substring(0, 8),
    nama: nama.trim(),
    email: email.trim(),
    password: password || 'password123',
    role: role || 'Anggota',
    noHp: noHp || '',
    createdAt: new Date().toISOString()
  };

  data.users.push(newUser);
  db.save(data);

  res.status(201).json({
    success: true,
    message: 'Pendaftaran berhasil.',
    user: {
      uid: newUser.uid,
      nama: newUser.nama,
      email: newUser.email,
      role: newUser.role,
      noHp: newUser.noHp
    }
  });
});

// Update Profile
app.put('/api/auth/profile', (req, res) => {
  const { uid, nama, noHp, role } = req.body;
  const data = db.read();
  const idx = data.users.findIndex(u => u.uid === uid);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  if (nama) data.users[idx].nama = nama;
  if (noHp !== undefined) data.users[idx].noHp = noHp;
  if (role) data.users[idx].role = role;

  db.save(data);
  res.json({
    success: true,
    message: 'Profil berhasil diperbarui.',
    user: data.users[idx]
  });
});

// Get Members List
app.get('/api/members', (req, res) => {
  const data = db.read();
  const members = data.users.map(u => ({
    uid: u.uid,
    nama: u.nama,
    email: u.email,
    role: u.role,
    noHp: u.noHp
  }));
  res.json({ success: true, count: members.length, data: members });
});

// Update Member Role
app.put('/api/members/:uid/role', (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;
  const data = db.read();
  const idx = data.users.findIndex(u => u.uid === uid);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  data.users[idx].role = role;
  db.save(data);
  res.json({
    success: true,
    message: `Role ${data.users[idx].nama} diubah menjadi ${role}`,
    user: data.users[idx]
  });
});

// ==========================================
// 2. ACTIVITIES (KEGIATAN)
// ==========================================

// Get All Activities
app.get('/api/activities', (req, res) => {
  const data = db.read();
  res.json({ success: true, count: data.activities.length, data: data.activities });
});

// Get Single Activity Detail
app.get('/api/activities/:id', (req, res) => {
  const data = db.read();
  const activity = data.activities.find(a => a.id === req.params.id);
  if (!activity) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
  }
  const relatedTasks = data.tasks.filter(t => t.activityId === req.params.id);
  const relatedAttendance = data.attendance.filter(a => a.activityId === req.params.id);

  res.json({
    success: true,
    data: {
      ...activity,
      tasks: relatedTasks,
      attendance: relatedAttendance
    }
  });
});

// Create Activity
app.post('/api/activities', (req, res) => {
  const {
    namaKegiatan,
    deskripsi,
    lokasi,
    latitude,
    longitude,
    radiusMeters,
    tanggalMulai,
    tanggalSelesai,
    penanggungJawab
  } = req.body;

  if (!namaKegiatan || !lokasi) {
    return res.status(400).json({ success: false, message: 'Nama kegiatan dan lokasi wajib diisi.' });
  }

  const data = db.read();
  const newActivity = {
    id: 'act_' + uuidv4().substring(0, 8),
    namaKegiatan: namaKegiatan.trim(),
    deskripsi: deskripsi || '',
    lokasi: lokasi.trim(),
    latitude: latitude || -6.914744,
    longitude: longitude || 107.609810,
    radiusMeters: radiusMeters || 50,
    tanggalMulai: tanggalMulai || new Date().toISOString(),
    tanggalSelesai: tanggalSelesai || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    status: 'Mendatang',
    progress: 0.0,
    penanggungJawab: penanggungJawab || 'Admin',
    createdAt: new Date().toISOString()
  };

  data.activities.unshift(newActivity);
  db.save(data);

  res.status(201).json({
    success: true,
    message: 'Kegiatan baru berhasil dibuat.',
    data: newActivity
  });
});

// Update Activity
app.put('/api/activities/:id', (req, res) => {
  const data = db.read();
  const idx = data.activities.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
  }

  data.activities[idx] = {
    ...data.activities[idx],
    ...req.body,
    id: req.params.id // prevent id change
  };

  db.save(data);
  res.json({ success: true, message: 'Kegiatan berhasil diperbarui.', data: data.activities[idx] });
});

// ==========================================
// 3. TASKS & DYNAMIC WEIGHTED PROGRESS
// ==========================================

// Get All Tasks
app.get('/api/tasks', (req, res) => {
  const { activityId, assignedToUid } = req.query;
  const data = db.read();
  let tasks = data.tasks;

  if (activityId) {
    tasks = tasks.filter(t => t.activityId === activityId);
  }
  if (assignedToUid) {
    tasks = tasks.filter(t => t.assignedToUid === assignedToUid);
  }

  res.json({ success: true, count: tasks.length, data: tasks });
});

// Create Task
app.post('/api/tasks', (req, res) => {
  const { activityId, judul, deskripsi, assignedTo, assignedToUid, deadline, priority, weight } = req.body;
  if (!activityId || !judul) {
    return res.status(400).json({ success: false, message: 'Activity ID dan judul tugas wajib diisi.' });
  }

  const data = db.read();
  const newTask = {
    id: 't_' + uuidv4().substring(0, 8),
    activityId,
    judul: judul.trim(),
    deskripsi: deskripsi || '',
    assignedTo: assignedTo || 'Belum ditugaskan',
    assignedToUid: assignedToUid || null,
    deadline: deadline || new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    priority: priority || 'Medium',
    weight: Number(weight) || 1,
    status: 'Todo',
    createdAt: new Date().toISOString()
  };

  data.tasks.unshift(newTask);
  db.save(data);

  // Auto recalculate activity progress
  const updatedProgress = db.recalculateActivityProgress(activityId);

  res.status(201).json({
    success: true,
    message: 'Tugas berhasil ditambahkan.',
    data: newTask,
    activityProgress: updatedProgress
  });
});

// Update Task Status
app.put('/api/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  const data = db.read();
  const idx = data.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
  }

  data.tasks[idx].status = status;
  db.save(data);

  // Recalculate progress for its activity
  const updatedProgress = db.recalculateActivityProgress(data.tasks[idx].activityId);

  res.json({
    success: true,
    message: `Status tugas diubah menjadi ${status}`,
    data: data.tasks[idx],
    activityProgress: updatedProgress
  });
});

// Update Task Details
app.put('/api/tasks/:id', (req, res) => {
  const data = db.read();
  const idx = data.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
  }

  data.tasks[idx] = {
    ...data.tasks[idx],
    ...req.body,
    id: req.params.id
  };
  db.save(data);

  const updatedProgress = db.recalculateActivityProgress(data.tasks[idx].activityId);

  res.json({
    success: true,
    message: 'Tugas berhasil diperbarui.',
    data: data.tasks[idx],
    activityProgress: updatedProgress
  });
});

// ==========================================
// 4. ATTENDANCE & DYNAMIC TOTP + GEOFENCING
// ==========================================

// Get Current Live Session QR Token for an Activity
app.get('/api/attendance/session/:activityId', (req, res) => {
  const { activityId } = req.params;
  const data = db.read();
  const activity = data.activities.find(a => a.id === activityId);
  if (!activity) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
  }

  // Generate or retrieve session
  let session = data.sessions[activityId];
  if (!session || !session.isActive) {
    session = {
      activityId,
      isActive: true,
      secret: 'SECRET_' + activityId + '_ORGANA_KEY',
      createdAt: new Date().toISOString()
    };
    data.sessions[activityId] = session;
    db.save(data);
  }

  // Generate dynamic 6-digit TOTP (changes every 30 seconds)
  const totpCode = security.generateTOTP(session.secret, 30);
  const remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);

  const qrPayload = JSON.stringify({
    activity_id: activityId,
    activity_name: activity.namaKegiatan,
    token: `TOTP-${totpCode}`,
    timestamp: Date.now()
  });

  res.json({
    success: true,
    sessionActive: session.isActive,
    totpCode,
    remainingSeconds,
    qrPayload,
    serverTime: new Date().toISOString()
  });
});

// Toggle Session Open/Close
app.post('/api/attendance/session/:activityId/toggle', (req, res) => {
  const { activityId } = req.params;
  const data = db.read();
  if (!data.sessions[activityId]) {
    data.sessions[activityId] = {
      activityId,
      isActive: true,
      secret: 'SECRET_' + activityId + '_ORGANA_KEY',
      createdAt: new Date().toISOString()
    };
  } else {
    data.sessions[activityId].isActive = !data.sessions[activityId].isActive;
  }
  db.save(data);

  res.json({
    success: true,
    isActive: data.sessions[activityId].isActive,
    message: data.sessions[activityId].isActive ? 'Sesi presensi dibuka.' : 'Sesi presensi ditutup.'
  });
});

// Verify & Check-In Attendance (Dual-Factor: TOTP + Haversine)
app.post('/api/attendance/check-in', (req, res) => {
  const { activityId, userId, token, latitude, longitude } = req.body;

  if (!activityId || !userId) {
    return res.status(400).json({ success: false, message: 'Data presensi tidak lengkap.' });
  }

  const data = db.read();
  const activity = data.activities.find(a => a.id === activityId);
  const user = data.users.find(u => u.uid === userId);

  if (!activity || !user) {
    return res.status(404).json({ success: false, message: 'Kegiatan atau User tidak valid.' });
  }

  // Check if session is active
  const session = data.sessions[activityId];
  if (session && !session.isActive) {
    return res.status(403).json({ success: false, message: 'Sesi presensi untuk kegiatan ini telah ditutup panitia.' });
  }

  // 1. Validate TOTP if provided
  if (token) {
    const rawCode = token.replace('TOTP-', '').trim();
    const secret = session ? session.secret : 'SECRET_' + activityId + '_ORGANA_KEY';
    const isTotpValid = security.validateTOTP(rawCode, secret, 30);
    if (!isTotpValid) {
      return res.status(400).json({
        success: false,
        message: 'Kode QR Presensi telah kadaluarsa atau tidak valid. Silakan scan ulang kode terbaru.'
      });
    }
  }

  // 2. Validate Geofence (Haversine)
  let distanceMeters = 0;
  if (latitude && longitude && activity.latitude && activity.longitude) {
    distanceMeters = security.calculateHaversineDistance(
      latitude,
      longitude,
      activity.latitude,
      activity.longitude
    );
    const maxRadius = activity.radiusMeters || 50;
    if (distanceMeters > maxRadius) {
      return res.status(403).json({
        success: false,
        distanceMeters,
        maxRadius,
        message: `Presensi ditolak. Anda berada di luar radius lokasi (${distanceMeters}m dari batas ${maxRadius}m).`
      });
    }
  }

  // Check if already checked in
  const alreadyCheckedIn = data.attendance.find(
    a => a.activityId === activityId && a.userId === userId
  );
  if (alreadyCheckedIn) {
    return res.json({
      success: true,
      alreadyCheckedIn: true,
      message: `Anda sudah tercatat hadir pada pukul ${new Date(alreadyCheckedIn.checkInTime).toLocaleTimeString('id-ID')}.`,
      data: alreadyCheckedIn
    });
  }

  // Record Attendance
  const newAttendance = {
    id: 'att_' + uuidv4().substring(0, 8),
    activityId,
    userId,
    nama: user.nama,
    checkInTime: new Date().toISOString(),
    status: 'Present',
    distanceMeters
  };

  data.attendance.unshift(newAttendance);
  db.save(data);

  res.status(201).json({
    success: true,
    message: `Presensi berhasil dicatat untuk ${user.nama}.`,
    data: newAttendance
  });
});

// Get Attendance for Activity
app.get('/api/attendance/activity/:activityId', (req, res) => {
  const data = db.read();
  const list = data.attendance.filter(a => a.activityId === req.params.activityId);
  res.json({ success: true, count: list.length, data: list });
});

// Start Server only if run directly
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`  ORGANA REST API SERVER RUNNING ON PORT ${PORT} `);
    console.log(`  Local URL:   http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/`);
    console.log(`===============================================`);
  });
}

module.exports = app;
