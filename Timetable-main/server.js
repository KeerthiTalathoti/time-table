const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// ---------------- Mock Database ----------------
const users = {
  'student1': { password: 'studentpass', role: 'student' },
  'teacher1': { password: 'teacherpass', role: 'teacher' },
  'admin1': { password: 'adminpass', role: 'admin' },
};

let timetable = {
  'Monday': 'Maths, Physics, Chemistry',
  'Tuesday': 'History, Geography, Biology',
  'Wednesday': 'English, Computer Science, Economics',
};

let changeRequests = [
  { id: 1, sender: 'teacher1', date: '2025-09-20', status: 'pending', text: 'Request to swap Monday Physics class with Friday English class.' },
];

let drafts = {};

// ---------------- API Routes ----------------

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && user.password === password) {
    res.json({ success: true, role: user.role });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Get timetable
app.get('/api/timetable', (req, res) => {
  res.json(timetable);
});

// Admin: create timetable
app.post('/api/create-timetable', (req, res) => {
  timetable = req.body;
  res.json({ success: true, message: 'New timetable created successfully.' });
});

// Admin: drafts
app.post('/api/save-draft', (req, res) => {
  const draftId = `draft-${Date.now()}`;
  drafts[draftId] = req.body;
  res.json({ success: true, message: 'Draft saved successfully.', draftId });
});

app.get('/api/drafts', (req, res) => {
  res.json(drafts);
});

app.post('/api/approve-draft/:id', (req, res) => {
  const { id } = req.params;
  if (drafts[id]) {
    timetable = drafts[id];
    delete drafts[id];
    res.json({ success: true, message: 'Draft approved and timetable updated.' });
  } else {
    res.status(404).json({ success: false, message: 'Draft not found.' });
  }
});

app.post('/api/discard-draft/:id', (req, res) => {
  const { id } = req.params;
  if (drafts[id]) {
    delete drafts[id];
    res.json({ success: true, message: 'Draft discarded.' });
  } else {
    res.status(404).json({ success: false, message: 'Draft not found.' });
  }
});

// Requests
app.get('/api/requests', (req, res) => {
  res.json(changeRequests);
});

app.post('/api/submit-request', (req, res) => {
  const newRequest = {
    id: changeRequests.length + 1,
    sender: req.body.username,
    date: new Date().toISOString().slice(0, 10),
    status: 'pending',
    text: req.body.text,
  };
  changeRequests.unshift(newRequest);
  res.json({ success: true, message: 'Request submitted successfully.' });
});

app.post('/api/update-request-status', (req, res) => {
  const { id, status } = req.body;
  const request = changeRequests.find(r => r.id === parseInt(id));
  if (request) {
    request.status = status;
    res.json({ success: true, message: 'Request status updated.' });
  } else {
    res.status(404).json({ success: false, message: 'Request not found.' });
  }
});

// ---------------- Frontend Serving ----------------
app.use(express.static(path.join(__dirname, 'public')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------- Start Server ----------------
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
