require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const { router: teamRoutes } = require("./routes/teams");
const proposalRoutes = require("./routes/proposals");
const guideRoutes = require("./routes/guide");
const coordinatorRoutes = require("./routes/coordinator");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS users FROM users");
    res.json({ status: "ok", database: "connected", users: rows[0].users });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/guide", guideRoutes);
app.use("/api/coordinator", coordinatorRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON request body." });
  }
  console.error("Unhandled server error:", err);
  return res.status(500).json({ message: "Internal server error." });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
