const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/scanner', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scanner.html'));
});

app.get('/generator', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'generator.html'));
});

app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', message: 'Frontend server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Frontend server running on http://localhost:${PORT}`);
    console.log(`Available routes:`);
    console.log(`  - Home: http://localhost:${PORT}/`);
    console.log(`  - Scanner: http://localhost:${PORT}/scanner`);
    console.log(`  - Generator: http://localhost:${PORT}/generator`);
    console.log(`  - History: http://localhost:${PORT}/history`);
});