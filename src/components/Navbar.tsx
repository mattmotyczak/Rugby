import { User } from "../types.js";
import { 
  Newspaper, 
  Swords, 
  MessageSquare, 
  UserPlus, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck 
} from "lucide-react";

interface NavbarProps {
  isLoggedIn: boolean;
  currentUser: User | null;
  activeTab: "news" | "tactics" | "forum" | "squad";
  setActiveTab: (tab: "news" | "tactics" | "forum" | "squad") => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export default function Navbar({
  isLoggedIn,
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onSignOut,
}: NavbarProps) {
  
  const navLinks = [
    { id: "news", label: "Noticias y Resultados", icon: Newspaper },
    { id: "tactics", label: "Cancha Táctica", icon: Swords },
    { id: "forum", label: "Foro de Aficionados", icon: MessageSquare },
    { id: "squad", label: "Plantilla", icon: UserPlus },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo / Brand */}
          <div 
            onClick={() => setActiveTab("news")}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            {/* Styled Crest */}
            <div className="relative w-7 h-7 rounded-sm bg-amber-500 flex items-center justify-center shadow-md">
              <span className="font-serif font-black text-slate-950 text-sm leading-none">O</span>
            </div>
            <span className="text-xl font-serif font-black tracking-tighter text-white group-hover:text-amber-500 transition-colors">
              ON<span className="text-amber-500 italic font-medium font-serif">RUGBY</span>
            </span>
          </div>

          {/* Navigation Links (Flexible layout, auto-scales) */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border-b-2 ${
                    isActive
                      ? "border-amber-500 text-amber-500 bg-slate-900/40"
                      : "border-transparent text-slate-400 hover:text-slate-150 hover:border-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section / Session Authentication Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {isLoggedIn && currentUser ? (
              <div className="flex items-center gap-2">
                {/* User Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151515] border border-amber-500/20 text-amber-500 rounded-none text-[12px] font-bold tracking-wider uppercase font-mono">
                  <UserIcon className="w-3 h-3 text-amber-500" />
                  <span className="truncate max-w-[100px]">{currentUser.username}</span>
                </div>

                {/* Secure Seal */}
                <div className="hidden sm:flex items-center p-1.5 bg-slate-900 border border-slate-800 text-amber-500 rounded-none" title="Sesión protegida">
                  <ShieldCheck className="w-4 h-4" />
                </div>

                {/* Sign Out Trigger */}
                <button
                  onClick={onSignOut}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-red-400 rounded-none transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-white text-slate-950 font-bold text-xs uppercase tracking-wide rounded-none transition-all cursor-pointer shadow font-sans"
              >
                <UserIcon className="w-3.5 h-3.5 fill-slate-950" />
                <span>Iniciar sesión</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Bar (Always visible on mobile bottom/top) */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-900 py-2.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`flex flex-col items-center gap-1 text-[12px] font-semibold transition-all cursor-pointer ${
                  isActive ? "text-amber-500" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
