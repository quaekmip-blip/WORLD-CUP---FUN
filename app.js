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

app.get('/', (req, res) => {
    const matches = [
        "Portugal vs Spain",
        "United States vs Belgium",
        "Argentina vs Egypt",
        "Switzerland vs Colombia"
    ];
    res.render('bet', { matches, success: req.query.success });
});

app.post('/submit-bet', (req, res) => {
    const { username, match, scoreA, scoreB } = req.body;
    
    if (username && match && scoreA !== undefined && scoreB !== undefined) {
        db.get('predictions')
          .push({ 
              name: username.trim(), 
              game: match, 
              score: `${scoreA} - ${scoreB}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })
          .write();
        return res.redirect('/?success=true');
    }
    res.redirect('/');
});

app.get('/admin-dashboard', (req, res) => {
    const allBets = db.get('predictions').value();
    res.render('admin', { bets: allBets });
});

app.post('/admin/clear-data', (req, res) => {
    db.set('predictions', []).write();
    res.redirect('/admin-dashboard');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
