const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[AmbiSense] Connecté à MongoDB');
    } catch (err) {
        console.error('[AmbiSense] Erreur de connexion à MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
