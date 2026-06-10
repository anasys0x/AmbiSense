import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Route de test
app.get("/", (req, res) => {
  res.json({
    message: "AmbiSense API - Phase 1",
    status: "ok",
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur AmbiSense démarré sur http://localhost:${PORT}`);
});
