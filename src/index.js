require('dotenv').config();

const app = require('./app');
const connectDB = require('./services/mongoose');

const PORT = process.env.PORT || 3000;

connectDB().catch((error) => {
    console.error('[AmbiSense] Échec de la connexion MongoDB :', error.message);
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`[AmbiSense] Serveur démarré sur http://localhost:${PORT}`);
});
