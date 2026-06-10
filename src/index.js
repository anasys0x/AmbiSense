require('dotenv').config();
const express = require('express');
const connectDB = require('./services/mongoose');


const app = express();
const PORT = process.env.PORT || 3000;
// Connection Mongo
connectDB().catch((err) => {
    console.error('[AmbiSense] Échec connexion MongoDB: ', err.message);
    process.exit(1);
});

// Mes uses
app.use(express.json());
app.use(require('./routes/devices'));




app.listen(PORT, () => {
    console.log(`[AmbiSense] Serveur démarré sur http://localhost:${PORT}`);
});