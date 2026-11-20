import React, { useEffect, useState } from "react";
import { BoardSnapshot, Post, Comment, TacticBoard } from "../types.js";
import { MessageSquare, ThumbsUp, Plus, Send, ShieldAlert, Sparkles, Filter, Check, LayoutGrid, ChevronDown, ChevronUp } from "lucide-react";

// Display-only labels: posts store the English enum values, so translate at render.
const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  tactics: "Táctica",
  news: "Noticias",
  transfers: "Fichajes",
};

interface ForumSectorProps {
  posts: Post[];
  isLoggedIn: boolean;
  currentUser: { id: string; username: string } | null;
  token: string | null;
  onVote: (postId: string) => Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  onAddPost: (post: { title: string; content: string; type: "general" | "analysis"; category: "news" | "tactics" | "transfers" | "general"; boardSnapshot?: BoardSnapshot }) => Promise<void>;
  onOpenBoard: (snapshot: BoardSnapshot) => void;
  onOpenAuth: () => void;
}

export default function ForumSector({
  posts,
  isLoggedIn,
  currentUser,
  token,
  onVote,
  onComment,
  onAddPost,
  onOpenBoard,
  onOpenAuth,
}: ForumSectorProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "analysis" | "general">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"general" | "analysis">("general");
  const [category, setCategory] = useState<"news" | "tactics" | "transfers" | "general">("general");
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [boards, setBoards] = useState<TacticBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [expandedBoardPostId, setExpandedBoardPostId] = useState<string | null>(null);

  // Fetch the user's saved boards only when the create form is open
  useEffect(() => {
    if (!showCreateForm || !isLoggedIn || !token) return;
    fetch("/api/tactics/boards", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : { boards: [] }))
      .then((d) => setBoards(d.boards ?? []))
      .catch(() => setBoards([]));
  }, [showCreateForm, isLoggedIn, token]);

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === "analysis") return p.type === "analysis";
    if (activeFilter === "general") return p.type === "general";
    return true;
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const selectedBoard = boards.find((b) => b.id === selectedBoardId);
      const boardSnapshot: BoardSnapshot | undefined = selectedBoard
        ? {
            name: selectedBoard.name,
            formation: selectedBoard.formation,
            playersOnField: selectedBoard.playersOnField,
            notes: selectedBoard.notes,
          }
        : undefined;
      await onAddPost({ title, content, type, category, ...(boardSnapshot ? { boardSnapshot } : {}) });
      setTitle("");
      setContent("");
      setType("general");
      setCategory("general");
      setSelectedBoardId("");
      setShowCreateForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newCommentText.trim()) return;
    setSubmitting(true);
    try {
      await onComment(postId, newCommentText);
      setNewCommentText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="forum-sector">
      {/* Forum Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-5">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tighter text-white flex flex-wrap items-center gap-2.5">
            Foro de <span className="text-amber-500 italic font-normal">Aficionados al Rugby</span>
            <span className="text-amber-500 font-mono text-[11px] bg-[#151515] border border-amber-500/20 px-2 py-1 rounded-none uppercase tracking-wide">COMUNIDAD</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">
            Lee desgloses de partidos o publica tus propios análisis técnicos.
          </p>
        </div>

        {/* Action: Create thread */}
        <button
          onClick={() => {
            if (!isLoggedIn) {
              onOpenAuth();
            } else {
              setShowCreateForm(!showCreateForm);
            }
          }}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-white text-slate-950 font-bold rounded-none transition-all shadow-md self-start sm:self-auto cursor-pointer text-xs uppercase tracking-wide"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Hilo</span>
        </button>
      </div>

      {/* Write a Thread Form */}
      {showCreateForm && isLoggedIn && (
        <form
          onSubmit={handleCreatePost}
          className="p-6 bg-[#0E0E0E] border border-slate-800 rounded-none space-y-4 shadow-xl animate-slide-up"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif uppercase tracking-wider">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Redactar Análisis Personal</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-slate-400 hover:text-white text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                Título del Hilo
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="p. ej. Estrategia de breakdown contra la touche sudafricana"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-100 placeholder-slate-600 outline-none transition-all text-xs"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-200 outline-none text-xs uppercase tracking-wider font-bold"
              >
                <option value="general">General</option>
                <option value="tactics">Táctica</option>
                <option value="news">Noticias</option>
                <option value="transfers">Fichajes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              Tipo de Publicación
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 text-slate-300 text-xs uppercase tracking-wider cursor-pointer select-none">
                <input
                  type="radio"
                  name="post_type"
                  checked={type === "general"}
                  onChange={() => setType("general")}
                  className="accent-amber-500 w-4 h-4"
                />
                <span>Discusión General</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 text-xs uppercase tracking-wider cursor-pointer select-none">
                <input
                  type="radio"
                  name="post_type"
                  checked={type === "analysis"}
                  onChange={() => setType("analysis")}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  Análisis Táctico y Personal
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
              Vincular una pizarra táctica a este análisis <span className="font-normal normal-case tracking-normal text-slate-600">(opcional)</span>
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-200 outline-none text-xs uppercase tracking-wider font-bold"
            >
              <option value="">Sin pizarra adjunta</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
            {boards.length === 0 && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                Guarda un esquema en el Creador de Tácticas para poder vincularlo aquí.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
              Contenido
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tus opiniones, análisis posicional, desglose de patrones defensivos o predicciones de rugby..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-100 placeholder-slate-600 outline-none transition-all text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-amber-500 hover:bg-white text-slate-950 font-bold rounded-none transition-all text-xs uppercase tracking-wide cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Publicando..." : "Publicar Hilo"}
            </button>
          </div>
        </form>
      )}

      {/* Filter and View Tabs */}
      <div className="flex items-center justify-between p-4 bg-[#0F0F0F] border border-slate-800 rounded-none">
        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-bold">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>Filtros:</span>
        </div>

        <div className="flex gap-2">
          {(["all", "analysis", "general"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-[12px] uppercase tracking-wide font-bold rounded-none transition-all border ${
                activeFilter === filter
                  ? "bg-amber-500/10 border-amber-500 text-amber-500"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              } cursor-pointer`}
            >
              {filter === "all" ? "Todos los Hilos" : filter === "analysis" ? "Análisis" : "General"}
            </button>
          ))}
        </div>
      </div>

      {/* Threads List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="p-10 text-center bg-[#0F0F0F] border border-slate-800 rounded-none text-slate-400">
            <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm">No hay hilos con este filtro. ¡Crea uno!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const hasVoted = currentUser && post.votedUserIds?.includes(currentUser.id);
            const isAnalysis = post.type === "analysis";
            const snapshot = post.boardSnapshot;

            return (
              <div
                key={post.id}
                className={`p-5 md:p-6 bg-[#0F0F0F] border rounded-none transition-all ${
                  isAnalysis ? "border-amber-500/35" : "border-slate-800"
                }`}
              >
                {/* Post Metadata & Category Headers */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 bg-[#151515] text-amber-500 rounded-none border border-slate-800 font-mono">
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                    {isAnalysis && (
                      <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-none flex items-center gap-1 font-sans">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Análisis Táctico</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-slate-400 font-mono uppercase tracking-wider">
                    Por <strong className="text-slate-300">{post.author}</strong> · {formatDate(post.createdAt)}
                  </span>
                </div>

                {/* Title and Content */}
                <h3 className="text-lg md:text-xl font-bold text-white tracking-tight font-sans leading-snug hover:text-amber-500 transition-colors cursor-pointer">
                  {post.title}
                </h3>
                <p className="text-slate-300 text-xs mt-3 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Embedded tactical board snapshot */}
                {snapshot && (
                  <div className="mt-4 border border-slate-800 bg-slate-950/40 rounded-none">
                    <button
                      onClick={() => setExpandedBoardPostId(expandedBoardPostId === post.id ? null : post.id)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-[12px] font-bold uppercase tracking-wide text-amber-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <LayoutGrid className="w-4 h-4 shrink-0" />
                        <span className="truncate">Pizarra: <span className="text-slate-300 normal-case tracking-normal font-sans">{snapshot.name}</span></span>
                      </span>
                      {expandedBoardPostId === post.id ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                    </button>

                    {expandedBoardPostId === post.id && (
                      <div className="px-4 pb-4 space-y-3 animate-slide-up">
                        <div className="relative w-full aspect-[3/2] border border-slate-800 overflow-hidden bg-[#0E0E0E]">
                          <div className="absolute inset-0 flex flex-col">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className={`flex-1 w-full ${i % 2 === 0 ? "field-stripe-light" : "field-stripe-dark"}`} />
                            ))}
                          </div>
                          <div className="absolute top-[4%] bottom-[4%] left-[4%] right-[4%] border border-white/30 pointer-events-none" />
                          <div className="absolute top-1/2 left-[4%] right-[4%] h-px bg-white/25 pointer-events-none" />
                          {snapshot.playersOnField.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              title={`${p.roleName}: ${p.name}`}
                              className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border border-amber-500/70 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 shadow"
                              style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            >
                              {p.roleName.replace(/\D/g, "") || p.roleName.slice(0, 2).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        {snapshot.notes && (
                          <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-amber-500/40 pl-3">
                            {snapshot.notes}
                          </p>
                        )}
                        <button
                          onClick={() => onOpenBoard(snapshot)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-white text-slate-950 font-bold rounded-none text-[11px] uppercase tracking-wide transition-all cursor-pointer"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          Abrir en Pizarra Táctica
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Voting & Discussion Control Bar */}
                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-900">
                  {/* Upvote Button */}
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        onOpenAuth();
                      } else {
                        onVote(post.id);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-none text-[12px] font-bold uppercase tracking-wide transition-all border ${
                      hasVoted
                        ? "bg-amber-500 border-amber-500 text-slate-950 font-extrabold"
                        : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-[#151515]"
                    } cursor-pointer`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${hasVoted ? "fill-slate-950" : ""}`} />
                    <span>{post.votes} votos</span>
                  </button>

                  {/* Comments Toggle Button */}
                  <button
                    onClick={() => {
                      setExpandedCommentsId(expandedCommentsId === post.id ? null : post.id);
                    }}
                    className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-amber-500 transition-colors font-bold uppercase tracking-wide cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.comments.length} comentarios</span>
                  </button>
                </div>

                {/* Expandable Comments Section */}
                {expandedCommentsId === post.id && (
                  <div className="mt-5 pt-4 border-t border-slate-800 space-y-4 animate-slide-up bg-slate-950/20 p-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                      Comentarios y Respuestas
                    </h4>

                    {/* Comments List */}
                    {post.comments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Todavía no hay respuestas en este hilo. ¡Sé el primero en responder!</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="p-3.5 bg-slate-950/80 border border-slate-900 rounded-none">
                            <div className="flex items-center justify-between text-[12px] text-slate-400 font-mono mb-1.5">
                              <span className="text-slate-300 font-bold uppercase tracking-wider">{comment.author}</span>
                              <span>{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write Comment Block */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder={
                          isLoggedIn
                            ? "Añade tu respuesta o réplica táctica..."
                            : "🔒 Inicia sesión para responder en esta discusión"
                        }
                        disabled={!isLoggedIn || submitting}
                        className="flex-1 px-3.5 py-2.5 bg-[#0F0F0F] border border-slate-800 focus:border-amber-500 rounded-none text-slate-100 placeholder-slate-600 outline-none text-xs transition-all disabled:opacity-50"
                      />
                      <button
                        onClick={() => {
                          if (!isLoggedIn) {
                            onOpenAuth();
                          } else {
                            handleAddComment(post.id);
                          }
                        }}
                        disabled={submitting || (!newCommentText.trim() && isLoggedIn)}
                        className="p-3 bg-amber-500 hover:bg-white text-slate-950 font-bold rounded-none transition-all shrink-0 cursor-pointer disabled:opacity-50"
                        title="Enviar respuesta"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
