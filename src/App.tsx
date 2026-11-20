import { useState, useEffect } from "react";
import { NewsArticle, Post, User } from "./types.js";
import Navbar from "./components/Navbar.js";
import AuthModal from "./components/AuthModal.js";
import NewsSector from "./components/NewsSector.js";
import ForumSector from "./components/ForumSector.js";
import TacticsBoard from "./components/TacticsBoard.js";
import CustomTeamCreator from "./components/CustomTeamCreator.js";
import ChatBot from "./components/ChatBot.js";
import { 
  Flame, 
  TrendingUp, 
  MessageSquare
} from "lucide-react";

const TAB_IDS = ["news", "tactics", "forum", "squad"] as const;
type TabId = (typeof TAB_IDS)[number];

export default function App() {
  // Global Auth states
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Layout states — restored from the URL hash so a page reload keeps the current tab
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const hash = window.location.hash.replace("#", "");
    return (TAB_IDS as readonly string[]).includes(hash) ? (hash as TabId) : "news";
  });

  // Keep the URL hash in sync with the active tab
  useEffect(() => {
    history.replaceState(null, "", `#${activeTab}`);
  }, [activeTab]);
  const [preloadedTeams, setPreloadedTeams] = useState<{ teamA: string; teamB: string } | null>(null);

  // Data states
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Verify token & restore user profile
  const fetchUserProfile = async (savedToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        // Clear stale session
        handleSignOut();
      }
    } catch (err) {
      console.error("Session verification failed:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    }
  }, [token]);

  // Load rugby news data
  const loadNewsData = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch("/api/forum/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data.news);
      }
    } catch (err) {
      console.error("Failed to load news center:", err);
    } finally {
      setLoadingNews(false);
    }
  };

  // Load supporters forum posts
  const loadPostsData = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/forum/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to load forum feed:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadNewsData();
    loadPostsData();
  }, []);

  const handleAuthSuccess = (newToken: string, user: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
  };

  // Switch to tactics creator with upcoming match team names preloaded
  const handlePrepTactics = (teamA: string, teamB: string) => {
    setPreloadedTeams({ teamA, teamB });
    setActiveTab("tactics");
  };

  // Upvote forum post API handler
  const handleVotePost = async (postId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/forum/posts/${postId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        loadPostsData(); // Reload threads to reflect vote toggles
      }
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  // Submit reply on post API handler
  const handleCommentPost = async (postId: string, content: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        loadPostsData(); // Reload threads to update comments list
      }
    } catch (err) {
      console.error("Failed to reply:", err);
    }
  };

  // Create new discussion thread API handler
  const handleAddPost = async (newPost: {
    title: string;
    content: string;
    type: "general" | "analysis";
    category: "news" | "tactics" | "transfers" | "general";
  }) => {
    if (!token) return;
    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        loadPostsData(); // Reload threads list
      }
    } catch (err) {
      console.error("Post draft submission failed:", err);
    }
  };

  // Find hot discussion counts (highly active or highly upvoted threads)
  const trendingThreads = posts.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Visual background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Global Navbar */}
      <Navbar
        isLoggedIn={!!currentUser}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "tactics") {
            setPreloadedTeams(null); // Clear preloaded team if navigating away from tactics
          }
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Hero Sector Banner (Only shown on News & Matches main landing state) */}
      {activeTab === "news" && (
        <section className="relative w-full border-b border-slate-900 bg-[#0C0C0C] py-12 md:py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Hero Left Content */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-none text-[12px] font-bold tracking-wide uppercase font-mono">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 animate-pulse" />
                  <span>Estrategia de Rugby y Arena de Aficionados</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black tracking-tighter text-white leading-tight">
                  Planifica formaciones estándar. <br />
                  <span className="text-amber-500 italic font-normal tracking-wide gold-glow">
                    Desata tu dominio táctico.
                  </span>
                </h1>

                <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
                  Únete a una red global de aficionados al rugby. Crea playbooks interactivos de Sevens o Union, arma tus plantillas personalizadas y analiza la estrategia de cada partido.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => setActiveTab("tactics")}
                    className="px-6 py-3 bg-amber-500 hover:bg-white text-slate-950 font-bold rounded-none text-xs uppercase tracking-wide transition-all cursor-pointer shadow-md"
                  >
                    Abrir Tablero de Juegos
                  </button>
                  <button
                    onClick={() => setActiveTab("forum")}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 font-bold rounded-none text-xs uppercase tracking-wide transition-colors cursor-pointer"
                  >
                    Entrar al Foro de Aficionados
                  </button>
                </div>
              </div>

              {/* Hero Right: Trending Discussions Sidebar Widgets */}
              <div className="lg:col-span-5 p-5 md:p-6 bg-[#0E0E0E] border border-slate-800 rounded-none space-y-4 shadow-xl backdrop-blur-sm self-start lg:self-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                    <TrendingUp className="w-4 h-4" />
                    <span>Discusiones en Tendencia</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 uppercase">En vivo</span>
                </div>

                <div className="space-y-3">
                  {loadingPosts ? (
                    <div className="py-6 text-center text-slate-400 text-xs">Conectando con los hilos...</div>
                  ) : trendingThreads.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">No hay discusiones activas. ¡Comparte tu análisis!</div>
                  ) : (
                    trendingThreads.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveTab("forum");
                        }}
                        className="p-3 bg-slate-950 hover:bg-[#151515] border border-slate-800/80 hover:border-amber-500/30 rounded-none cursor-pointer transition-all group"
                      >
                        <h5 className="text-xs font-semibold text-slate-200 group-hover:text-amber-500 transition-colors line-clamp-1 leading-snug">
                          {item.title}
                        </h5>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                          <span>Por {item.author}</span>
                          <span className="flex items-center gap-2.5">
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-500" /> {item.votes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {item.comments.length}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        
        {/* News & Match Center Tab */}
        {activeTab === "news" && (
          <NewsSector
            news={news}
            onPrepTactics={handlePrepTactics}
            isLoading={loadingNews}
          />
        )}

        {/* Tactics Creator Tab */}
        {activeTab === "tactics" && (
          <TacticsBoard
            isLoggedIn={!!currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            token={token}
            currentUser={currentUser}
            preloadedTeams={preloadedTeams}
          />
        )}

        {/* Supporters Forum Tab */}
        {activeTab === "forum" && (
          <ForumSector
            posts={posts}
            isLoggedIn={!!currentUser}
            currentUser={currentUser}
            onVote={handleVotePost}
            onComment={handleCommentPost}
            onAddPost={handleAddPost}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* Squad Draft Tab */}
        {activeTab === "squad" && (
          <CustomTeamCreator
            isLoggedIn={!!currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            token={token}
          />
        )}

      </main>

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Floating rugby assistant, available on every tab */}
      <ChatBot />
    </div>
  );
}
