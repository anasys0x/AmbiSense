require('dotenv').config();
const express = require('express');
const connectDB = require('./services/mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Serveur AmbiSense opérationnel');
});

app.listen(PORT, () => {
    console.log(`[AmbiSense] Serveur démarré sur http://localhost:${PORT}`);
});


connectDB().catch((err) => {
    console.error('[AmbiSense] Échec connexion MongoDB: ', err.message);
    process.exit(1);
});