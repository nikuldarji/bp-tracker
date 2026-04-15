const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Add record
app.post("/bp", (req, res) => {
    try {
        const { systolic, diastolic, pulse, created_at } = req.body;

        const stmt = db.prepare(`
      INSERT INTO bp_records (systolic, diastolic, pulse, created_at)
      VALUES (?, ?, ?, ?)
    `);

        const result = stmt.run(
            systolic,
            diastolic,
            pulse,
            created_at || new Date().toISOString()
        );

        res.send({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).send(err);
    }
});


// Get records (with filter)
app.get("/bp", (req, res) => {
    try {
        const { from, to } = req.query;

        let query = "SELECT * FROM bp_records WHERE 1=1";
        let params = [];

        if (from) {
            query += " AND date(created_at) >= date(?)";
            params.push(from);
        }

        if (to) {
            query += " AND date(created_at) <= date(?)";
            params.push(to);
        }

        const rows = db.prepare(query).all(...params);

        let avgSys = 0, avgDia = 0;

        if (rows.length > 0) {
            avgSys = rows.reduce((sum, r) => sum + r.systolic, 0) / rows.length;
            avgDia = rows.reduce((sum, r) => sum + r.diastolic, 0) / rows.length;
        }

        res.send({
            data: rows,
            average: {
                systolic: avgSys.toFixed(1),
                diastolic: avgDia.toFixed(1)
            }
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Export CSV
app.get("/export", (req, res) => {
    db.all("SELECT * FROM bp_records", [], (err, rows) => {
        if (err) return res.status(500).send(err);

        let csv = "Date,Systolic,Diastolic,Pulse\n";

        rows.forEach(r => {
            csv += `${r.created_at},${r.systolic},${r.diastolic},${r.pulse}\n`;
        });

        res.header("Content-Type", "text/csv");
        res.attachment("bp_records.csv");
        res.send(csv);
    });
});

app.delete("/bp/:id", (req, res) => {
    try {
        const result = db
            .prepare("DELETE FROM bp_records WHERE id = ?")
            .run(req.params.id);

        res.send({ deleted: result.changes });
    } catch (err) {
        res.status(500).send(err);
    }
});
app.listen(3001, () => console.log("Server running on port 3001"));