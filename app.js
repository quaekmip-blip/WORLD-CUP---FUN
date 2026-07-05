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
        "United States vs Belgium",
        "Argentina vs Egypt",
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

// UPGRADED VIEW: Intercepts secret link triggers immediately without passwords
app.get('/admin-dashboard', async (req, res) => {
    // 🔑 THE SECRET URL PARAMETER TRICK
    // If you visit /admin-dashboard?clear=yes, it clears the DB instantly
    if (req.query.clear === 'yes') {
        await supabase.from('predictions').delete().neq('id', 0);
        return res.redirect('/admin-dashboard?clearSuccess=true');
    }

    const { data: allBets } = await supabase
        .from('predictions')
        .select('*')
        .order('id', { ascending: false });

    res.render('admin', { bets: allBets || [] });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
