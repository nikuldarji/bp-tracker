const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./bp.db");

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS bp_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      systolic INTEGER,
      diastolic INTEGER,
      pulse INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;