const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(require('./routes/devices'));
app.use(require('./routes/measurements'));
app.use(require('./routes/observations'));
app.use(require('./routes/ambiance'));
app.use(require('./routes/places'));
app.use(require('./routes/users'));

app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 404,
            message: 'Route introuvable'
        }
    });
});

module.exports = app;
