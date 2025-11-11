
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 21943;

// Serve static files from public directory
app.use(express.static('public'));

// Middleware to parse JSON
app.use(express.json());

// Load sim data
let simData = {};
try {
    simData = JSON.parse(fs.readFileSync('sim.json', 'utf8'));
} catch (err) {
    console.error('Error loading sim.json:', err);
    simData = {};
}

// Load visitor data
let visitorData = {};
try {
    visitorData = JSON.parse(fs.readFileSync('visitors.json', 'utf8'));
} catch (err) {
    console.error('Error loading visitors.json:', err);
    visitorData = {
        total: 0,
        today: { count: 0, date: '' },
        monthly: { count: 0, month: '' },
        dailyVisits: {},
        monthlyVisits: {}
    };
}

// Helper function to save sim data
function saveSim() {
    fs.writeFileSync('sim.json', JSON.stringify(simData, null, 4));
}

// Helper function to save visitor data
function saveVisitors() {
    fs.writeFileSync('visitors.json', JSON.stringify(visitorData, null, 4));
}

// Helper function to update visitor count
function updateVisitorCount() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    // Update total visitors
    visitorData.total++;

    // Update daily visitors
    if (visitorData.today.date !== today) {
        visitorData.today.date = today;
        visitorData.today.count = 1;
    } else {
        visitorData.today.count++;
    }

    // Track daily visits history
    if (!visitorData.dailyVisits[today]) {
        visitorData.dailyVisits[today] = 0;
    }
    visitorData.dailyVisits[today]++;

    // Update monthly visitors
    if (visitorData.monthly.month !== currentMonth) {
        visitorData.monthly.month = currentMonth;
        visitorData.monthly.count = 1;
    } else {
        visitorData.monthly.count++;
    }

    // Track monthly visits history
    if (!visitorData.monthlyVisits[currentMonth]) {
        visitorData.monthlyVisits[currentMonth] = 0;
    }
    visitorData.monthlyVisits[currentMonth]++;

    saveVisitors();
}

// Get response endpoint
app.get('/sim', (req, res) => {
    const ask = req.query.ask;
    if (!ask) {
        return res.json({ respond: 'Please ask something!' });
    }

    const response = simData[ask] || ['I don\'t know how to respond to that yet.'];
    res.json({ respond: response[Math.floor(Math.random() * response.length)] });
});

// Teach endpoint
app.get('/teach', (req, res) => {
    const ask = req.query.ask;
    const ans = req.query.ans;

    if (!ask || !ans) {
        return res.json({ error: 'Both question and answer are required!' });
    }

    if (!simData[ask]) {
        simData[ask] = [];
    }
    simData[ask].push(ans);
    saveSim();

    res.json({ ask, ans });
});

// Get visitor stats endpoint
app.get('/visitor-stats', (req, res) => {
    res.json({
        total: visitorData.total,
        today: visitorData.today.count,
        monthly: visitorData.monthly.count,
        todayDate: visitorData.today.date,
        currentMonth: visitorData.monthly.month
    });
});

// Track visitor endpoint
app.post('/track-visitor', (req, res) => {
    updateVisitorCount();
    res.json({
        success: true,
        total: visitorData.total,
        today: visitorData.today.count,
        monthly: visitorData.monthly.count
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
