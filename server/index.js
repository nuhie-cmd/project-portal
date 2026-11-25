require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/teams", require("./routes/teams"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/users", require("./routes/users"));

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS users FROM users");
    res.json({ status: "ok", database: "connected", users: rows[0].users });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use("/api/deadlines", require("./routes/deadlines"));