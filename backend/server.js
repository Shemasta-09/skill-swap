require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/messages', require('./routes/messages'));

// Serve static frontend assets
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// SPA fallback for frontend routes
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
