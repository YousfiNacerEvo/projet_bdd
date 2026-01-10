import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin.js';
import doyenRoutes from './routes/doyen.js';
import planningRoutes from './routes/planning.js';
import kpiRoutes from './routes/kpis.js';

dotenv.config();

const app = express();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes utilisateur
app.use('/api', meRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/doyen', doyenRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/kpis', kpiRoutes);

app.post("/", async (req, res) => {
    const { name } = req.body || {};
    
    if (!name) {
        return res.status(400).json({ error: "Le champ 'name' est requis" });
    }
    
    try {
        // Insérer le nom dans la table user
        const { data, error } = await supabase
            .from('user')
            .insert([{ name: name }])
            .select();
        
        if (error) {
            console.error('Erreur Supabase:', error);
            return res.status(500).json({ error: "Erreur lors de l'insertion en base de données", details: error.message });
        }
        
        res.json({ 
            message: `Hello ${name}`,
            data: data 
        });
    } catch (err) {
        console.error('Erreur:', err);
        res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
});
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});