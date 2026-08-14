import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RouteLoading from './components/RouteLoading';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

const AccountPage = lazy(() => import('./pages/AccountPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const ObservationFormPage = lazy(() => import('./pages/ObservationFormPage'));
const PlacePage = lazy(() => import('./pages/PlacePage'));
const RecommendationPage = lazy(() => import('./pages/RecommendationPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<RouteLoading />}>
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
      </Suspense>
    </Layout>
  );
}
