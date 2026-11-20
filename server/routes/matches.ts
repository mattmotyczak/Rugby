import { Router, Request, Response } from "express";

const router = Router();

const FIXTURES_URL = "https://api.rugbyapi.com/v1/fixtures?days=14";
const FALLBACK_URL = "https://sporting-events.org/data/rugby-union.json";
const CACHE_TTL_MS = 30 * 60 * 1000;

interface UpcomingMatch {
  id: string;
  title: string;
  content: string;
  summary: string;
  type: "upcoming";
  category: string;
  imageUrl: string;
  date: string;
  teamA: string;
  teamB: string;
  kickOff: string;
  venue: string;
}

interface FixturesResponse {
  matches: UpcomingMatch[];
  source: "rugbyapi" | "sporting-events";
  attribution?: string;
  attributionUrl?: string;
  fetchedAt: string;
}

let cache: FixturesResponse | null = null;

const formatKickoff = (value: string): string => {
  if (!value) return value;
  // Fechas sin hora se interpretan en hora local para no desplazar el día
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  if (dateOnly) return `${day} - Hora por confirmar`;
  const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${day} - ${time}`;
};

const mapRugbyApi = (data: any): UpcomingMatch[] =>
  (Array.isArray(data?.data) ? data.data : []).map((match: any) => {
    const teamA = match?.home?.name || "Equipo A";
    const teamB = match?.away?.name || "Equipo B";
    const competition = match?.competition?.name || "Rugby";
    const date = match?.kickoff_utc || match?.date || "";

    return {
      id: String(match?.id ?? date + teamA + teamB),
      title: `${teamA} vs ${teamB}`,
      content: "",
      summary: competition,
      type: "upcoming",
      category: competition,
      imageUrl: "",
      date,
      teamA,
      teamB,
      kickOff: formatKickoff(date),
      venue: competition,
    };
  });

const mapFallback = (data: any): UpcomingMatch[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (Array.isArray(data?.events) ? data.events : [])
    .filter((event: any) =>
      event?.status === "scheduled" &&
      event?.date_utc &&
      String(event?.fixture ?? "").includes(" vs ") &&
      new Date(event.date_utc) >= today
    )
    .map((event: any, index: number) => {
      const [competition = "Rugby", teams = ""] = String(event.fixture ?? "").split(":");
      const names = teams.split(" vs ").map((name: string) => name.trim());

      return {
        id: `fallback-${index}-${event.date_utc}`,
        title: String(event.fixture ?? ""),
        content: "",
        summary: competition.trim(),
        type: "upcoming",
        category: competition.trim(),
        imageUrl: "",
        date: event.date_utc,
        teamA: names[0] || "Equipo A",
        teamB: names[1] || "Equipo B",
        kickOff: formatKickoff(event.date_utc),
        venue: event.city || competition.trim(),
      };
    });
};

const fetchRugbyApi = async (): Promise<FixturesResponse> => {
  const apiKey = process.env.RUGBYAPI_KEY;
  if (!apiKey) throw new Error("NOT_CONFIGURED");

  const response = await fetch(FIXTURES_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`rugbyAPI ${response.status}`);

  return {
    matches: mapRugbyApi(await response.json()),
    source: "rugbyapi",
    fetchedAt: new Date().toISOString(),
  };
};

const fetchFallback = async (): Promise<FixturesResponse> => {
  const response = await fetch(FALLBACK_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`sporting-events ${response.status}`);

  return {
    matches: mapFallback(await response.json()),
    source: "sporting-events",
    attribution: "Rugby Union fixtures from Sporting Events",
    attributionUrl: FALLBACK_URL,
    fetchedAt: new Date().toISOString(),
  };
};

router.get("/upcoming", async (_req: Request, res: Response) => {
  if (cache && Date.now() - new Date(cache.fetchedAt).getTime() < CACHE_TTL_MS) {
    res.json(cache);
    return;
  }

  try {
    cache = await fetchRugbyApi();
  } catch (err) {
    console.warn("rugbyAPI unavailable:", err instanceof Error ? err.message : err);
    if (cache) {
      res.json(cache); // sirve la última respuesta válida aunque esté caducada
      return;
    }
    try {
      cache = await fetchFallback();
    } catch (fallbackErr) {
      console.error("Fixtures fallback failed:", fallbackErr instanceof Error ? fallbackErr.message : fallbackErr);
      res.status(502).json({ error: "No se pudieron cargar los próximos partidos." });
      return;
    }
  }

  res.json(cache);
});

export default router;
