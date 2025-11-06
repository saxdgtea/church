const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");

// ✅ Load environment variables
dotenv.config();

// ✅ Connect to database
connectDB();

const app = express();

// ✅ CORS — only allow your Vercel frontend
app.use(
  cors({
    origin: "https://church-front-nine.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ensure upload directories exist
const uploadDirs = [
  "sermons",
  "events",
  "ministries",
  "gallery",
  "about",
  "about/leaders",
];

uploadDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, "uploads", dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/sermons", require("./routes/sermons"));
app.use("/api/events", require("./routes/events"));
app.use("/api/ministries", require("./routes/ministries"));
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/homepage", require("./routes/homepage"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/about", require("./routes/about"));

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Church Website API is running" });
});

// ✅ Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message,
  });
});

// ✅ Render-required port
const PORT = process.env.PORT || 5000;

// ✅ Server start
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ API: http://localhost:${PORT}/api`);
});
