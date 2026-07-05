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

// COMBINED MAIN LINK: Loads both the entry form and live database tracking log list together
app.get('/', async (req, res) => {
    const matches = [
        "Portugal vs Spain",
        "Argentina vs France",
        "United States vs Belgium",
        "Switzerland vs Colombia"
    ];

    // Fetch entries to show at the bottom of the same page view
    const { data: allBets } = await supabase
        .from('predictions')
        .select('*')
        .order('id', { ascending: false });

    res.render('bet', { 
        matches, 
        bets: allBets || [],
        success: req.query.success,
        clearSuccess: req.query.clearSuccess,
        error: req.query.error
    });
});

// SUBMIT ENTRY ROADWAY
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

// SECURE CLEAR ALL ACTION
app.post('/admin/clear-data', async (req, res) => {
    const adminPassword = req.body.adminPassword;
    const SECRET_PASSWORD = "admin123"; 

    if (adminPassword && adminPassword === SECRET_PASSWORD) {
        await supabase.from('predictions').delete().neq('id', 0);
        return res.redirect('/?clearSuccess=true');
    }
    res.redirect('/?error=invalid_password');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
