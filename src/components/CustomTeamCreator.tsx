import React, { useState, useEffect } from "react";
import { RugbyPlayer } from "../types.js";
import { Plus, User, Award, Shield, Globe, AlertCircle, Sparkles, RefreshCw, CheckCircle2, X } from "lucide-react";

interface CustomTeamCreatorProps {
  isLoggedIn: boolean;
  onOpenAuth: () => void;
  token: string | null;
}

const RUGBY_POSITIONS = [
  "Pilar",
  "Talonador",
  "Segunda línea",
  "Flanker",
  "Número 8",
  "Medio melé",
  "Apertura",
  "Centro",
  "Extremo",
  "Zaguero"
];

const COUNTRIES = (() => {
  const names = new Intl.DisplayNames(["es"], { type: "region" });
  return Array.from({ length: 26 * 26 }, (_, i) => {
    const code = String.fromCharCode(65 + Math.floor(i / 26), 65 + (i % 26));
    return names.of(code) || "";
  })
    .filter((name) => name.length > 2)
    .sort((a, b) => a.localeCompare(b, "es"));
})();

const POSITION_MARKS: Record<string, { top: number; left: number; label: string }[]> = {
  "Pilar": [{ top: 14, left: 38, label: "1" }, { top: 14, left: 62, label: "3" }],
  "Talonador": [{ top: 11, left: 50, label: "2" }],
  "Segunda línea": [{ top: 27, left: 42, label: "4" }, { top: 27, left: 58, label: "5" }],
  "Flanker": [{ top: 23, left: 29, label: "6" }, { top: 23, left: 71, label: "7" }],
  "Número 8": [{ top: 34, left: 50, label: "8" }],
  "Medio melé": [{ top: 52, left: 50, label: "9" }],
  "Apertura": [{ top: 61, left: 43, label: "10" }],
  "Centro": [{ top: 68, left: 38, label: "12" }, { top: 68, left: 62, label: "13" }],
  "Extremo": [{ top: 80, left: 20, label: "11" }, { top: 80, left: 80, label: "14" }],
  "Zaguero": [{ top: 90, left: 50, label: "15" }],
};

export default function CustomTeamCreator({ isLoggedIn, onOpenAuth, token }: CustomTeamCreatorProps) {
  const [customPlayers, setCustomPlayers] = useState<RugbyPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [position, setPosition] = useState("Apertura");
  const [rating, setRating] = useState("85");
  const [club, setClub] = useState("");
  const [country, setCountry] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);

  const countryOptions = Array.from(
    new Set([...COUNTRIES, ...customPlayers.map((p) => p.country).filter(Boolean)])
  ).sort((a, b) => a.localeCompare(b, "es"));

  const resetForm = () => {
    setName("");
    setPosition("Apertura");
    setRating("85");
    setClub("");
    setCountry("");
    setEditingId(null);
  };

  const startEdit = (player: RugbyPlayer) => {
    setName(player.name);
    setPosition(player.position);
    setRating(String(player.rating));
    setClub(player.club);
    setCountry(player.country);
    setEditingId(player.id);
    setError(null);
    setSuccess(null);
    document.getElementById("player-form")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const loadCustomPlayers = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const response = await fetch("/api/tactics/players", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to only user's custom players
        const userCustom = data.players.filter((p: RugbyPlayer) => p.isCustom);
        setCustomPlayers(userCustom);
      }
    } catch (err) {
      console.error("Failed to load custom players roster:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomPlayers();
  }, [isLoggedIn, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }

    if (!name.trim()) {
      setError("Indica el nombre del jugador.");
      return;
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 99) {
      setError("La valoración debe ser un número entero entre 1 y 99.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        editingId ? `/api/tactics/players/${editingId}` : "/api/tactics/players",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: name.trim(),
            position,
            rating: numRating,
            club: club.trim() || "Sin club",
            country: country || "Selección"
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || (editingId ? "No se pudo actualizar el jugador." : "No se pudo crear el jugador."));
      }

      setSuccess(editingId
        ? `¡Jugador "${data.player.name}" actualizado!`
        : `¡Jugador "${data.player.name}" añadido a la plantilla!`);
      resetForm();
      loadCustomPlayers(); // Reload custom roster
    } catch (err: any) {
      setError(err.message || "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="custom-team-sector">
      {/* Sector Header */}
      <div className="border-b border-slate-700 pb-5">
        <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tighter text-white flex flex-wrap items-center gap-2.5">
          Plantilla <span className="text-amber-500 italic font-normal">Personal y Base de Datos</span>
          <span className="text-amber-500 font-mono text-[11px] uppercase tracking-wide bg-[#151515] border border-amber-500/20 px-2 py-1 rounded-none">BASE DE DATOS</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">
          Crea jugadores amateur o profesionales, define sus estadísticas y gestiona las plantillas de tus esquemas tácticos.
        </p>
      </div>

      {!isLoggedIn ? (
        <div className="p-10 text-center border border-slate-800 bg-[#0F0F0F] rounded-none max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="p-4 bg-amber-500/10 rounded-none w-14 h-14 mx-auto flex items-center justify-center border border-amber-500/20">
            <Plus className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider font-serif">Altas Bloqueadas</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Necesitas iniciar sesión para acceder a la base de datos de jugadores y crear fichas. Con tu cuenta podrás dar de alta jugadores privados que se sincronizan con tus playbooks interactivos.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-3 bg-amber-500 hover:bg-white text-slate-950 font-bold text-xs uppercase tracking-wide rounded-none transition-all cursor-pointer shadow"
          >
            Iniciar sesión / Crear cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side (5 columns) */}
          <form
            id="player-form"
            onSubmit={handleSubmit}
            className="lg:col-span-5 p-6 bg-[#0F0F0F] border border-slate-800 rounded-none space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-serif">
                {editingId ? "Editar Ficha" : "Ficha de Alta"}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  title="Cancelar edición"
                  aria-label="Cancelar edición"
                  className="ml-auto p-1 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {success && (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-none text-xs uppercase tracking-wider font-bold">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-none text-xs uppercase tracking-wider font-bold">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                Nombre del Jugador
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="p. ej. Jonah Lomu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-100 placeholder-slate-600 outline-none transition-all text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                  Posición Principal
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-200 outline-none text-xs uppercase tracking-wider font-bold"
                >
                  {RUGBY_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                  Valoración Global (1-99)
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-100 placeholder-slate-600 outline-none transition-all text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                  Club
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                    placeholder="p. ej. Leinster"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-100 placeholder-slate-600 outline-none transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                  Selección
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 appearance-none bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-none text-slate-200 outline-none text-xs cursor-pointer"
                  >
                    <option value="">Selección</option>
                    {countryOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-white text-slate-950 font-bold rounded-none transition-all text-xs uppercase tracking-wide shadow cursor-pointer disabled:opacity-50"
            >
              {loading
                ? (editingId ? "Guardando..." : "Dando de alta...")
                : (editingId ? "Guardar cambios" : "Dar de Alta Jugador")}
            </button>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
                Mapa de posiciones <span className="text-slate-600 font-normal normal-case tracking-normal">— pasa el cursor para resaltar</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RUGBY_POSITIONS.map((pos) => (
                  <button
                    type="button"
                    key={pos}
                    onMouseEnter={() => setHoveredPosition(pos)}
                    onMouseLeave={() => setHoveredPosition(null)}
                    onFocus={() => setHoveredPosition(pos)}
                    onBlur={() => setHoveredPosition(null)}
                    onClick={() => setPosition(pos)}
                    className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wide border cursor-pointer transition-colors ${
                      pos === position
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-500"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/40"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              <div className="relative h-52 w-full max-w-[260px] mx-auto border border-slate-700 bg-[#0B1510] rounded-none overflow-hidden">
                <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-slate-700/60" />
                <div className="absolute inset-x-0 top-1/2 border-t border-slate-700" />
                <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-slate-700/60" />
                {RUGBY_POSITIONS.flatMap((pos) =>
                  (POSITION_MARKS[pos] || []).map((mark) => {
                    const active = hoveredPosition === pos || (!hoveredPosition && position === pos);
                    return (
                      <div
                        key={`${pos}-${mark.label}`}
                        title={pos}
                        style={{ top: `${mark.top}%`, left: `${mark.left}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full border font-mono text-[11px] font-bold transition-all ${
                          active
                            ? "bg-amber-500 border-amber-200 text-slate-950 scale-110 z-10 shadow-lg shadow-amber-500/30"
                            : "bg-slate-900 border-slate-600 text-slate-400"
                        }`}
                      >
                        {mark.label}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </form>

          {/* Roster View Side (7 columns) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5 font-serif">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Mi Plantilla ({customPlayers.length} jugadores)</span>
              </h3>
              <button
                onClick={loadCustomPlayers}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Actualizar plantilla"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading && customPlayers.length === 0 ? (
              <div className="p-10 text-center bg-[#0F0F0F] border border-slate-800 rounded-none">
                <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-amber-500 mx-auto" />
                <p className="text-[12px] text-slate-400 uppercase tracking-wider mt-2">Cargando la plantilla...</p>
              </div>
            ) : customPlayers.length === 0 ? (
              <div className="p-10 text-center bg-[#0F0F0F] border border-slate-800 rounded-none text-slate-400 text-xs">
                <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-bold uppercase tracking-wider text-slate-400">Todavía no has creado jugadores.</p>
                <p className="text-[12px] text-slate-400 uppercase tracking-wide mt-1">Usa la ficha de la izquierda para montar tu plantilla privada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[440px] overflow-y-auto pr-2">
                {customPlayers.map((player) => (
                  <div
                    key={player.id}
                    onMouseEnter={() => setHoveredPosition(player.position)}
                    onMouseLeave={() => setHoveredPosition(null)}
                    className={`p-4 bg-[#0F0F0F] border rounded-none flex items-center justify-between hover:border-amber-500/30 transition-all shadow-sm ${
                      editingId === player.id ? "border-amber-500/60" : "border-slate-800"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <button
                        type="button"
                        onClick={() => startEdit(player)}
                        title="Editar jugador"
                        className={`block w-full text-left text-xs font-bold uppercase tracking-wider truncate cursor-pointer hover:text-amber-500 transition-colors ${
                          editingId === player.id ? "text-amber-500" : "text-white"
                        }`}
                      >
                        {player.name}
                      </button>
                      <div className="text-[12px] font-bold text-amber-500 font-mono mt-0.5 uppercase tracking-wide">{player.position}</div>
                      
                      <div className="flex gap-2 text-[11px] uppercase tracking-wider text-slate-400 mt-2 font-mono truncate">
                        <span>Club: <strong className="text-slate-300">{player.club}</strong></span>
                        <span>&bull;</span>
                        <span>Selección: <strong className="text-slate-300">{player.country}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-none bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-bold text-amber-500 font-mono leading-none">{player.rating}</span>
                        <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wide leading-none mt-0.5">OVR</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
