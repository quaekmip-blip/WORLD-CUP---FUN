const express = require('express');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const adapter = new FileSync('database.json');
const db = low(adapter);

db.defaults({ predictions: [] }).write();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. User Betting Submission Page
app.get('/', (req, res) => {
       const matches = [
        "Portugal vs Spain",
        "Argentina vs Egypt",
        "United States vs Belgium",
        "Switzerland vs Colombia"
    ];

    res.render('bet', { matches, success: req.query.success });
});

// 2. Receives data from users and saves it
app.post('/submit-bet', (req, res) => {
    const { username, match, scoreA, scoreB } = req.body;
    
    if (username && match && scoreA !== undefined && scoreB !== undefined) {
        db.get('predictions')
          .push({ 
              name: username.trim(), 
              game: match, 
              score: `${scoreA} - ${scoreB}`,
              timestamp: new Date().toLocaleTimeString()
          })
          .write();
        return res.redirect('/?success=true');
    }
    res.redirect('/');
});

// 3. Admin View Panel
app.get('/admin-dashboard', (req, res) => {
    const allBets = db.get('predictions').value();
    res.render('admin', { bets: allBets });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 YOUR WEBPAGE IS LIVE ONLINE LOCALLY!`);
    console.log(`👉 User Betting Link: http://localhost:${PORT}`);
    console.log(`👉 Your Private Admin Panel: http://localhost:${PORT}/admin-dashboard`);
    console.log(`==================================================\n`);
});
