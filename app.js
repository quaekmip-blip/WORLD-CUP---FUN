const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    const matches = [
        "Portugal vs Spain",
        "Argentina vs France",
        "United States vs Belgium",
        "Switzerland vs Colombia"
    ];
    res.render('bet', { matches, success: req.query.success });
});

app.post('/submit-bet', async (req, res) => {
    const { username, match, scoreA, scoreB } = req.body;
    
    if (username && match && scoreA !== undefined && scoreB !== undefined) {
        await supabase
          .from('predictions')
          .insert([
            { 
              name: username.trim(), 
              game: match, 
              score: `${scoreA} - ${scoreB}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        return res.redirect('/?success=true');
    }
    res.redirect('/');
});

// ADMIN VIEW DASHBOARD
app.get('/admin-dashboard', async (req, res) => {
    const { data: allBets } = await supabase
        .from('predictions')
        .select('*')
        .order('id', { ascending: false });

    res.render('admin', { bets: allBets || [] });
});

// 🔒 SECURE MASTER WIPE PATHWAY: Checked safely via POST
app.post('/admin/clear-data', async (req, res) => {
    const adminPassword = req.body.adminPassword;
    const SECRET_PASSWORD = "admin123"; // 👈 YOUR PASSWORD

    if (adminPassword && adminPassword === SECRET_PASSWORD) {
        await supabase.from('predictions').delete().neq('id', 0);
        return res.redirect('/admin-dashboard?clearSuccess=true');
    }
    res.redirect('/admin-dashboard?error=invalid_password');
});

// HELPER REDIRECT: Bounces users back safely if they mistakenly visit the path manually
app.get('/admin/clear-data', (req, res) => {
    res.redirect('/admin-dashboard');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
