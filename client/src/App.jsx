import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AccountPage from './pages/AccountPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MapPage from './pages/MapPage';
import NotFoundPage from './pages/NotFoundPage';
import ObservationFormPage from './pages/ObservationFormPage';
import PlacePage from './pages/PlacePage';
import RecommendationPage from './pages/RecommendationPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/carte" element={<MapPage />} />
        <Route path="/recommandations" element={<RecommendationPage />} />
        <Route path="/lieux/:slug" element={<PlacePage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/compte" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/observations/nouvelle" element={<ProtectedRoute><ObservationFormPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
