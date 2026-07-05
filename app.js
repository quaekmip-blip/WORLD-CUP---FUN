const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Securely read keys from Render environment settings
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MAIN APP ROUTE: Fetches and displays everything on a single combined screen
app.get('/', async (req, res) => {
    const matches = [
        "Portugal vs Spain",
        "Argentina vs Egypt",
        "United States vs Belgium",
        "Switzerland vs Colombia"
    ];

    try {
        const { data: allBets } = await supabase
            .from('predictions')
            .select('*')
            .order('id', { ascending: false });

        res.render('bet', { 
            matches, 
            bets: allBets || [],
            success: req.query.success || null,
            clearSuccess: req.query.clearSuccess || null,
            error: req.query.error || null
        });
    } catch (err) {
        // Fallback safety to ensure page renders even if database is sleeping
        res.render('bet', { 
            matches, 
            bets: [],
            success: req.query.success || null,
            clearSuccess: req.query.clearSuccess || null,
            error: req.query.error || null
        });
    }
});

// SUBMIT OUTCOME ACTION: Pushes predictions directly to Supabase cloud
app.post('/submit-bet', async (req, res) => {
    const { username, match, scoreA, scoreB } = req.body;
    
    if (username && match && scoreA !== undefined && scoreB !== undefined) {
        try {
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
        } catch (e) {
            return res.redirect('/');
        }
    }
    res.redirect('/');
});

// SECURE DATA ERASE GATEWAY: Safely verified using POST password parameters
app.post('/admin/clear-data', async (req, res) => {
    const adminPassword = req.body.adminPassword;
    const SECRET_PASSWORD = "admin123"; 

    if (adminPassword && adminPassword.trim() === SECRET_PASSWORD) {
        try {
            await supabase.from('predictions').delete().neq('id', 0);
            return res.redirect('/?clearSuccess=true');
        } catch (e) {
            return res.redirect('/');
        }
    }
    res.redirect('/?error=invalid_password');
});

// CATCH-ALL ROUTE: Seamlessly redirects accidental manual link entries back home without crashing
app.get('/admin-dashboard', (req, res) => res.redirect('/'));
app.get('/admin/clear-data', (req, res) => res.redirect('/'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server successfully initialized on port ${PORT}`);
});
