import { Router, Request, Response } from "express";
import { getDB, saveDB, RugbyPlayer, TacticBoard } from "../utils/db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/tactics/players
 * Fetch all available rugby players. Returns standard players, plus user's custom players if logged in.
 */
router.get("/players", optionalAuth, (req: Request, res: Response) => {
  const db = getDB();
  const user = (req as any).user;

  // Start with global standard players
  let result = db.players.filter((p) => !p.isCustom);

  // If user is logged in, also include their custom players
  if (user) {
    const customPlayers = db.players.filter(
      (p) => p.isCustom && p.userId === user.id
    );
    result = [...result, ...customPlayers];
  }

  res.json({
    players: result,
  });
});

/**
 * POST /api/tactics/players
 * Add a custom player to the database (requires authentication)
 */
router.post("/players", requireAuth, (req: Request, res: Response) => {
  const { name, position, rating, club, country } = req.body;
  const user = (req as any).user;

  if (!name || !position || !rating) {
    res.status(400).json({ error: "El nombre, la posición y la valoración (1-99) son obligatorios." });
    return;
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 99) {
    res.status(400).json({ error: "La valoración debe ser un número entre 1 y 99." });
    return;
  }

  const db = getDB();
  const newPlayer: RugbyPlayer = {
    id: `player-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: String(name).trim(),
    position: String(position).trim(),
    rating: numRating,
    club: String(club || "Custom Club").trim(),
    country: String(country || "Custom Country").trim(),
    isCustom: true,
    userId: user.id,
  };

  db.players.push(newPlayer);
  saveDB(db);

  res.status(201).json({
    message: "¡Jugador personalizado añadido!",
    player: newPlayer,
  });
});

/**
 * PUT /api/tactics/players/:id
 * Update one of the logged-in user's custom players
 */
router.put("/players/:id", requireAuth, (req: Request, res: Response) => {
  const { name, position, rating, club, country } = req.body;
  const user = (req as any).user;

  if (!name || !position || !rating) {
    res.status(400).json({ error: "El nombre, la posición y la valoración (1-99) son obligatorios." });
    return;
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 99) {
    res.status(400).json({ error: "La valoración debe ser un número entre 1 y 99." });
    return;
  }

  const db = getDB();
  const player = db.players.find(
    (p) => p.id === req.params.id && p.isCustom && p.userId === user.id
  );
  if (!player) {
    res.status(404).json({ error: "Jugador personalizado no encontrado." });
    return;
  }

  player.name = String(name).trim();
  player.position = String(position).trim();
  player.rating = numRating;
  player.club = String(club || "Sin club").trim();
  player.country = String(country || "Selección").trim();
  saveDB(db);

  res.json({
    message: "¡Jugador personalizado actualizado!",
    player,
  });
});

/**
 * GET /api/tactics/boards
 * Fetch saved tactical boards for the logged-in user
 */
router.get("/boards", requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDB();

  const userBoards = db.tactics.filter((board) => board.userId === user.id);
  res.json({
    boards: userBoards,
  });
});

/**
 * POST /api/tactics/boards
 * Save or update a tactical board (requires authentication)
 */
router.post("/boards", requireAuth, (req: Request, res: Response) => {
  const { id, name, formation, playersOnField, notes } = req.body;
  const user = (req as any).user;

  if (!name || !formation || !playersOnField || !Array.isArray(playersOnField)) {
    res.status(400).json({ error: "El nombre, la formación y la distribución de jugadores son obligatorios." });
    return;
  }

  const db = getDB();
  
  if (id) {
    // Update existing board
    const boardIndex = db.tactics.findIndex((b) => b.id === id);
    if (boardIndex !== -1) {
      const existingBoard = db.tactics[boardIndex];
      if (existingBoard.userId !== user.id) {
         res.status(403).json({ error: "No tienes permiso para editar este esquema táctico." });
         return;
      }

      db.tactics[boardIndex] = {
        ...existingBoard,
        name: String(name).trim(),
        formation,
        playersOnField,
        notes: notes ? String(notes).trim() : existingBoard.notes,
      };
      saveDB(db);
      res.json({
        message: "¡Tablero táctico actualizado!",
        board: db.tactics[boardIndex],
      });
      return;
    }
  }

  // Create new board
  const newBoard: TacticBoard = {
    id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: String(name).trim(),
    formation,
    playersOnField,
    userId: user.id,
    username: user.username,
    notes: notes ? String(notes).trim() : "",
    createdAt: new Date().toISOString(),
  };

  db.tactics.push(newBoard);
  saveDB(db);

  res.status(201).json({
    message: "¡Tablero táctico guardado!",
    board: newBoard,
  });
});

/**
 * POST /api/tactics/share
 * Mock-share tactical board screenshot or layout details to social media (requires authentication)
 */
router.post("/share", requireAuth, (req: Request, res: Response) => {
  const { boardId, platform } = req.body;
  const user = (req as any).user;

  if (!boardId || !platform) {
    res.status(400).json({ error: "Se requieren el ID del tablero y la plataforma (p. ej. 'twitter', 'facebook', 'whatsapp')." });
    return;
  }

  const db = getDB();
  const board = db.tactics.find((b) => b.id === boardId);

  if (!board) {
    res.status(404).json({ error: "Tablero táctico no encontrado." });
    return;
  }

  if (board.userId !== user.id) {
    res.status(403).json({ error: "Solo puedes compartir tus propios tableros." });
    return;
  }

  // Generate a mock shared link and tracking ID
  const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const shareUrl = `/share/board/${board.id}?ref=${shareId}`;

  res.json({
    message: `Tactical board "${board.name}" exportado correctamente a ${platform}!`,
    shareUrl,
    platform,
    user: user.username,
    timestamp: new Date().toISOString(),
  });
});

export default router;
