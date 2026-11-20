import { Router, Request, Response } from "express";
import { getDB, saveDB, Post, Comment } from "../utils/db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/forum/news
 * Fetch rugby news, match results, and upcoming fixtures
 */
router.get("/news", (req: Request, res: Response) => {
  const db = getDB();
  res.json({
    news: db.news,
  });
});

/**
 * GET /api/forum/posts
 * Fetch forum posts (general discussions and personal analyses)
 */
router.get("/posts", (req: Request, res: Response) => {
  const db = getDB();
  // Sort posts by newest or most votes
  const sortedPosts = [...db.posts].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json({
    posts: sortedPosts,
  });
});

/**
 * POST /api/forum/posts
 * Create a new forum post or tactical analysis (requires authentication)
 */
router.post("/posts", requireAuth, (req: Request, res: Response) => {
  const { title, content, type, category, boardSnapshot } = req.body;
  const user = (req as any).user;

  if (!title || !content || !type || !category) {
    res.status(400).json({ error: "El título, el contenido, el tipo y la categoría son obligatorios." });
    return;
  }

  if (type !== "general" && type !== "analysis") {
    res.status(400).json({ error: "El tipo debe ser 'general' o 'analysis'." });
    return;
  }

  let snapshot;
  if (boardSnapshot != null) {
    const s = boardSnapshot;
    if (
      typeof s.name !== "string" || !s.name.trim() || s.name.length > 200 ||
      (s.formation !== "15-union" && s.formation !== "7-sevens" && s.formation !== "custom") ||
      !Array.isArray(s.playersOnField) || s.playersOnField.length > 30 ||
      s.playersOnField.some((p: any) =>
        !p || typeof p.name !== "string" || p.name.length > 100 ||
        typeof p.position !== "string" || p.position.length > 100 ||
        typeof p.roleName !== "string" || p.roleName.length > 100 ||
        typeof p.x !== "number" || !Number.isFinite(p.x) || p.x < 0 || p.x > 100 ||
        typeof p.y !== "number" || !Number.isFinite(p.y) || p.y < 0 || p.y > 100
      ) ||
      (s.notes != null && (typeof s.notes !== "string" || s.notes.length > 1000))
    ) {
      res.status(400).json({ error: "La pizarra adjunta no es válida." });
      return;
    }
    snapshot = {
      name: s.name.trim(),
      formation: s.formation,
      playersOnField: s.playersOnField.map((p: any) => ({
        id: String(p.id ?? "").slice(0, 100),
        name: p.name.trim(),
        position: p.position.trim(),
        roleName: p.roleName.trim(),
        x: p.x,
        y: p.y,
      })),
      notes: typeof s.notes === "string" ? s.notes.trim() : undefined,
    };
  }

  const db = getDB();
  const newPost: Post = {
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    author: user.username,
    authorId: user.id,
    title: String(title).trim(),
    content: String(content).trim(),
    type,
    category,
    votes: 0,
    votedUserIds: [],
    comments: [],
    createdAt: new Date().toISOString(),
    ...(snapshot ? { boardSnapshot: snapshot } : {}),
  };

  db.posts.push(newPost);
  saveDB(db);

  res.status(201).json({
    message: "¡Publicación creada!",
    post: newPost,
  });
});

/**
 * POST /api/forum/posts/:id/vote
 * Upvote / toggle vote on a post (requires authentication)
 */
router.post("/posts/:id/vote", requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const db = getDB();
  const post = db.posts.find((p) => p.id === id);

  if (!post) {
    res.status(404).json({ error: "Publicación no encontrada." });
    return;
  }

  if (!post.votedUserIds) {
    post.votedUserIds = [];
  }

  const voteIndex = post.votedUserIds.indexOf(user.id);
  if (voteIndex === -1) {
    // Add vote
    post.votedUserIds.push(user.id);
    post.votes += 1;
  } else {
    // Revoke vote (toggle behavior)
    post.votedUserIds.splice(voteIndex, 1);
    post.votes -= 1;
  }

  saveDB(db);

  res.json({
    message: "¡Voto actualizado!",
    votes: post.votes,
    voted: voteIndex === -1,
  });
});

/**
 * POST /api/forum/posts/:id/comments
 * Add a comment to a forum post (requires authentication)
 */
router.post("/posts/:id/comments", requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const user = (req as any).user;

  if (!content || String(content).trim().length === 0) {
    res.status(400).json({ error: "El comentario no puede estar vacío." });
    return;
  }

  const db = getDB();
  const post = db.posts.find((p) => p.id === id);

  if (!post) {
    res.status(404).json({ error: "Publicación no encontrada." });
    return;
  }

  const newComment: Comment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    author: user.username,
    content: String(content).trim(),
    createdAt: new Date().toISOString(),
  };

  post.comments.push(newComment);
  saveDB(db);

  res.status(201).json({
    message: "¡Comentario añadido!",
    comment: newComment,
  });
});

export default router;
