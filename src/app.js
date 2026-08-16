const express = require('express');
const cors = require('cors');

const app = express();

// CORS : en production on limite l'API aux origines du client deploye
// (variable CLIENT_ORIGIN, plusieurs valeurs separees par des virgules).
// En developpement, si la variable est absente, on autorise toutes les origines.
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOptions = allowedOrigins.length > 0 ? { origin: allowedOrigins } : {};

app.use(cors(corsOptions));
app.use(express.json());

// Route de sante : Render (et n'importe quel moniteur) l'interroge pour verifier
// que le service repond. Elle ne touche pas la base pour rester rapide.
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use(require('./routes/devices'));
app.use(require('./routes/measurements'));
app.use(require('./routes/observations'));
app.use(require('./routes/ambiance'));
app.use(require('./routes/places'));
app.use(require('./routes/users'));
app.use(require('./routes/recommendations'));

app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 404,
            message: 'Route introuvable'
        }
    });
});

module.exports = app;
