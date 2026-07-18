const express = require('express');

const User = require('../models/User');
const Observation = require('../models/Observation');
const userAuth = require('../middlewares/userAuth');

const router = express.Router();

router.post('/users', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                error: { code: 400, message: 'Les champs name, email et password sont requis.' }
            });
        }

        const user = new User({ name, email, password });
        const authToken = await user.generateAuthTokenAndSaveUser();
        res.status(201).json({ user, authToken });
    } catch (error) {
        res.status(400).json({ error: { code: 400, message: error.message } });
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email || '', req.body.password || '');
        const authToken = await user.generateAuthTokenAndSaveUser();
        res.status(200).json({ user, authToken });
    } catch (error) {
        res.status(400).json({
            error: { code: 400, message: 'Courriel ou mot de passe invalide.' }
        });
    }
});

router.get('/users/me', userAuth, (req, res) => {
    res.status(200).json({ user: req.user });
});

router.post('/users/logout', userAuth, async (req, res) => {
    try {
        req.user.authTokens = req.user.authTokens.filter(
            ({ authToken }) => authToken !== req.authToken
        );
        await req.user.save();
        res.status(200).json({ message: 'Déconnexion effectuée.' });
    } catch (error) {
        res.status(500).json({ error: { code: 500, message: error.message } });
    }
});

router.get('/users/me/observations', userAuth, async (req, res) => {
    try {
        const observations = await Observation.find({ author: req.user._id }).sort({ receivedAt: -1 });
        res.status(200).json({ observations, count: observations.length });
    } catch (error) {
        res.status(500).json({ error: { code: 500, message: error.message } });
    }
});

module.exports = router;
