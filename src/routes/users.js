const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/User');
const Observation = require('../models/Observation');
const Place = require('../models/Place');
const userAuth = require('../middlewares/userAuth');

const router = express.Router();

function getFavoriteId(favorite) {
    if (!favorite) {
        return null;
    }
    return (favorite._id || favorite).toString();
}

function serializeFavorite(place) {
    return {
        id: place._id.toString(),
        name: place.name,
        slug: place.slug,
        latitude: place.latitude,
        longitude: place.longitude
    };
}

async function getFavorites(user) {
    await user.populate('favorites');
    return user.favorites
        .filter(Boolean)
        .map(serializeFavorite)
        .sort((first, second) => first.name.localeCompare(second.name, 'fr'));
}

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

router.get('/users/me/favorites', userAuth, async (req, res) => {
    try {
        const favorites = await getFavorites(req.user);
        res.status(200).json({ favorites, count: favorites.length });
    } catch (error) {
        res.status(500).json({ error: { code: 500, message: error.message } });
    }
});

router.post('/users/me/favorites/:placeId', userAuth, async (req, res) => {
    try {
        const { placeId } = req.params;
        if (!mongoose.isValidObjectId(placeId)) {
            return res.status(404).json({
                error: { code: 404, message: 'Lieu introuvable.' }
            });
        }

        const place = await Place.findById(placeId);
        if (!place) {
            return res.status(404).json({
                error: { code: 404, message: 'Lieu introuvable.' }
            });
        }

        const alreadyFavorite = req.user.favorites.some(
            (favorite) => getFavoriteId(favorite) === place._id.toString()
        );
        if (!alreadyFavorite) {
            req.user.favorites.push(place._id);
            await req.user.save();
        }

        const favorites = await getFavorites(req.user);
        res.status(alreadyFavorite ? 200 : 201).json({
            favorite: serializeFavorite(place),
            favorites,
            count: favorites.length
        });
    } catch (error) {
        res.status(500).json({ error: { code: 500, message: error.message } });
    }
});

router.delete('/users/me/favorites/:placeId', userAuth, async (req, res) => {
    try {
        const { placeId } = req.params;
        const favorites = req.user.favorites.filter(
            (favorite) => getFavoriteId(favorite) !== placeId
        );

        if (favorites.length === req.user.favorites.length) {
            return res.status(404).json({
                error: { code: 404, message: "Ce lieu n'est pas dans vos favoris." }
            });
        }

        req.user.favorites = favorites;
        await req.user.save();
        const serializedFavorites = await getFavorites(req.user);
        res.status(200).json({
            favorites: serializedFavorites,
            count: serializedFavorites.length
        });
    } catch (error) {
        res.status(500).json({ error: { code: 500, message: error.message } });
    }
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
