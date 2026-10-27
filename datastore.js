const isVercel = Boolean(process.env.VERCEL);
const DATA_FILE = isVercel 
  ? path.join('/tmp', 'data.json')
  : path.join(__dirname, 'data.json');

const INITIAL_DATA = require('./data.json');

class DataStore {
  constructor() {
    this.memoryData = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.memoryData, null, 2), 'utf8');
      }
    } catch (e) {
      // In read-only serverless, memory fallback is used
    }
  }

  read() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content);
      }
    } catch (e) {}
    return this.memoryData;
  }

  save(data) {
    this.memoryData = data;
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
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
