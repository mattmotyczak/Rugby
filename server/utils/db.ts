import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: string;
  authorId?: string;
  title: string;
  content: string;
  type: "general" | "analysis";
  category: "news" | "tactics" | "transfers" | "general";
  votes: number;
  votedUserIds?: string[]; // track who voted
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  type: "international" | "match_result" | "upcoming";
  category: string;
  imageUrl?: string;
  date: string;
  
  // Optional match details
  teamA?: string;
  teamB?: string;
  scoreA?: number;
  scoreB?: number;
  kickOff?: string;
  venue?: string;
}

export interface RugbyPlayer {
  id: string;
  name: string;
  position: string;
  rating: number;
  club: string;
  country: string;
  isCustom: boolean;
  userId?: string; // If custom player
}

export interface TacticBoard {
  id: string;
  name: string;
  formation: "15-union" | "7-sevens" | "custom";
  playersOnField: Array<{
    id: string;
    name: string;
    position: string;
    roleName: string; // tactical position on field (e.g., Fly-half, Prop, Lock)
    x: number; // percentage width 0-100
    y: number; // percentage height 0-100
  }>;
  userId: string;
  username: string;
  notes?: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  posts: Post[];
  news: NewsArticle[];
  players: RugbyPlayer[];
  tactics: TacticBoard[];
}

// Initial/default database values
const DEFAULT_DB: DatabaseSchema = {
  users: [],
  posts: [
    {
      id: "post-1",
      author: "RugbyTactician99",
      title: "¿Es superior el banquillo 5-3 de Francia al 'Bomb Squad' 7-1 de los Springboks?",
      content: "Con la llegada de los partidos test de alta intensidad y mucho contacto, organizar el banquillo se ha vuelto tan crítico como el XV titular. Los Springboks popularizaron el 7-1, que da una renovación del pack delantero sin precedentes pero deja muy expuesta a la línea de tres cuartos. Francia, con Galthié, ha perfeccionado un 5-3 flexible con backs polivalentes como Ramos y Barré. Analicemos los pros y los contras de ambos estilos bajo las leyes modernas del rugby.",
      type: "analysis",
      category: "tactics",
      votes: 42,
      votedUserIds: [],
      comments: [
        {
          id: "c1",
          author: "BokFanatic",
          content: "El 7-1 solo funciona si tienes forwards versátiles que aguanten el ritmo y backs resistentes. Si cae la apertura, el 7-1 se convierte en un gran riesgo. Aun así, no hay nada como ver entrar 7 forwards frescos y enormes al minuto 50.",
          createdAt: "2026-06-23T18:30:00Z"
        },
        {
          id: "c2",
          author: "DublinPivot",
          content: "Creo que el 6-2 de Irlanda es el punto ideal: te da profundidad en segunda línea y en tercera, cobertura de medio melé y un back polivalente. El 7-1 es pura brutalidad, pero con mucho riesgo.",
          createdAt: "2026-06-23T19:15:00Z"
        }
      ],
      createdAt: "2026-06-23T14:22:00Z"
    },
    {
      id: "post-2",
      author: "SixNationsWatcher",
      title: "¿El salto de Antoine Dupont al Rugby Sevens: la gran clase táctica definitiva?",
      content: "Ver a Antoine Dupont pasar sin sobresaltos del rugby a 15 al Sevens olímpico ha sido un placer absoluto. Su lectura del juego, su fuerza impresionante a baja altura y sus pases precisos han redefinido cómo se juega el sevens. Se plantea una gran pregunta: ¿intentarán cruzar más jugadores élite del rugby a 15, o Dupont es un caso excepcional de los que solo aparece una vez en generaciones?",
      type: "analysis",
      category: "news",
      votes: 56,
      votedUserIds: [],
      comments: [
        {
          id: "c3",
          author: "AllBlacksCore",
          content: "Dupont es un fenómeno de la naturaleza. La mayoría de los jugadores de 15 no tienen la capacidad aeróbica pura para correr los canales habituales de Sevens durante 14 minutos seguidos. Su motor es increíble.",
          createdAt: "2026-06-24T02:10:00Z"
        }
      ],
      createdAt: "2026-06-23T22:10:00Z"
    },
    {
      id: "post-3",
      author: "RugbyAnalyst26",
      title: "Predicciones Rugby Championship 2026: ¿Puede remontar Australia con Schmidt?",
      content: "Tras una fase de reconstrucción, Australia parece más ordenada, pero encarar a los All Blacks y a los campeones del mundo Springboks seguidos sigue siendo la prueba más dura del deporte. ¿Cuáles son tus predicciones tácticas sobre la eficiencia de Australia en el breakdown?",
      type: "general",
      category: "news",
      votes: 19,
      votedUserIds: [],
      comments: [],
      createdAt: "2026-06-24T05:40:00Z"
    }
  ],
  news: [
    {
      id: "news-1",
      title: "Irlanda se corona campeona del Seis Naciones en un final dramático en Dublín",
      content: "Con una exhibición de rugby clínico que quitaba el aliento, Irlanda defendió su título del Seis Naciones en el Aviva Stadium, aguantando el feroz empuje de una Francia renaciente. Un ensayo tardío de Dan Sheehan seló la victoria y una campaña notable marcada por la precisión en el juego a pie y una defensa sólida en el breakdown.",
      summary: "Irlanda vence a Francia y se lleva el Seis Naciones en el Aviva Stadium con una clase táctica.",
      type: "international",
      category: "Seis Naciones",
      imageUrl: "",
      date: "2026-06-22T17:00:00Z"
    },
    {
      id: "news-2",
      title: "Los All Blacks anuncian la convocatoria para la próxima gira por el hemisferio sur",
      content: "La New Zealand Rugby Union ha presentado oficialmente la lista de 36 jugadores para el próximo Rugby Championship. El seleccionador Scott Robertson ha optado por mezclar veteranos experimentados con cuatro jóvenes sin debutar, con la idea de revitalizar el ataque. La convocatoria incluye un grupo de tercera línea muy competitivo.",
      summary: "Scott Robertson convoca a 36 jugadores de los All Blacks e incorpora a jóvenes talentos prometedores.",
      type: "international",
      category: "Convocatorias",
      imageUrl: "",
      date: "2026-06-23T09:30:00Z"
    },
    {
      id: "news-3",
      title: "Resultado: Sudáfrica vs Irlanda (Ciudad del Cabo)",
      content: "Un choque de titanes terminó en Ciudad del Cabo con los campeones del mundo Sudáfrica derrotando a Irlanda en un partido de mucha física. El mejor del partido, Pieter-Steph du Toit, firmó 24 placajes y un ensayo decisivo tras un bloqueo. La remontada tardía de Irlanda se quedó corta ante la presión de la melé sudafricana.",
      summary: "Los Springboks aguantan el empuje tardío de Irlanda y se llevan una victoria trepidante en Ciudad del Cabo.",
      type: "match_result",
      category: "Partidos Test",
      date: "2026-06-20T19:00:00Z",
      teamA: "Sudáfrica",
      teamB: "Irlanda",
      scoreA: 27,
      scoreB: 20,
      venue: "Estadio DHL, Ciudad del Cabo"
    },
    {
      id: "news-4",
      title: "Resultado: Nueva Zelanda vs Inglaterra (Auckland)",
      content: "Los All Blacks defendieron con éxito la histórica invicta de Eden Park, superando a Inglaterra en un segundo test de altísima exigencia. El golpeo táctico preciso de Damian McKenzie y un ensayo tardío de Caleb Clarke selaron la victoria, pese a la excelente defensa de maul de Inglaterra.",
      summary: "Los All Blacks mantienen su fortaleza en Eden Park y aprietan a Inglaterra en un partidazo.",
      type: "match_result",
      category: "Partidos Test",
      date: "2026-06-13T08:00:00Z",
      teamA: "Nueva Zelanda",
      teamB: "Inglaterra",
      scoreA: 24,
      scoreB: 17,
      venue: "Eden Park, Auckland"
    },
    {
      id: "news-5",
      title: "Próximo: Nueva Zelanda vs Sudáfrica (Johannesburgo)",
      content: "La gran rivalidad del rugby union vuelve al legendario Ellis Park. Ambos equipos lideran la clasificación del Rugby Championship. Los planes tácticos girarán en torno a los balones altos disputados de Sudáfrica frente a la fluidez de contraataque de Nueva Zelanda. El saque inicial está previsto para el sábado por la noche.",
      summary: "Los All Blacks se miden a los Springboks en Ellis Park en la decisiva del Rugby Championship.",
      type: "upcoming",
      category: "Rugby Championship",
      date: "2026-06-27T15:00:00Z",
      teamA: "Sudáfrica",
      teamB: "Nueva Zelanda",
      kickOff: "sábado 27 de junio - 17:00 local",
      venue: "Ellis Park, Johannesburgo"
    },
    {
      id: "news-6",
      title: "Próximo: Australia vs Argentina (Sídney)",
      content: "Australia busca puntos clave del torneo al recibir a Los Pumas en Sídney. El entrenador australiano ha trabajado mucho en reducir las pérdidas de balón, mientras Argentina planea desplegar su peligroso y abierto juego de backs.",
      summary: "Australia busca puntos vitales ante Los Pumas en un duelo abierto en Sídney.",
      type: "upcoming",
      category: "Rugby Championship",
      date: "2026-07-04T10:00:00Z",
      teamA: "Australia",
      teamB: "Argentina",
      kickOff: "sábado 4 de julio - 20:00 local",
      venue: "Accor Stadium, Sídney"
    }
  ],
  players: [
    // World Class pre-populated players
    { id: "p1", name: "Antoine Dupont", position: "Medio melé", rating: 98, club: "Toulouse", country: "Francia", isCustom: false },
    { id: "p2", name: "Ardie Savea", position: "Número 8", rating: 96, club: "Kobe Steelers", country: "Nueva Zelanda", isCustom: false },
    { id: "p3", name: "Pieter-Steph du Toit", position: "Flanker", rating: 95, club: "Toyota Verblitz", country: "Sudáfrica", isCustom: false },
    { id: "p4", name: "Cheslin Kolbe", position: "Extremo", rating: 94, club: "Suntory Sungoliath", country: "Sudáfrica", isCustom: false },
    { id: "p5", name: "Eben Etzebeth", position: "Segunda línea", rating: 96, club: "Sharks", country: "Sudáfrica", isCustom: false },
    { id: "p6", name: "Hugo Keenan", position: "Zaguero", rating: 92, club: "Leinster", country: "Irlanda", isCustom: false },
    { id: "p7", name: "Bundee Aki", position: "Centro", rating: 93, club: "Connacht", country: "Irlanda", isCustom: false },
    { id: "p8", name: "Caelan Doris", position: "Número 8", rating: 94, club: "Leinster", country: "Irlanda", isCustom: false },
    { id: "p9", name: "Dan Sheehan", position: "Talonador", rating: 93, club: "Leinster", country: "Irlanda", isCustom: false },
    { id: "p10", name: "Maro Itoje", position: "Segunda línea", rating: 92, club: "Saracens", country: "Inglaterra", isCustom: false },
    { id: "p11", name: "Marcus Smith", position: "Apertura", rating: 91, club: "Harlequins", country: "Inglaterra", isCustom: false },
    { id: "p12", name: "Ben Earl", position: "Número 8", rating: 93, club: "Saracens", country: "Inglaterra", isCustom: false },
    { id: "p13", name: "Gregory Alldritt", position: "Número 8", rating: 94, club: "La Rochelle", country: "Francia", isCustom: false },
    { id: "p14", name: "Damian McKenzie", position: "Apertura", rating: 92, club: "Chiefs", country: "Nueva Zelanda", isCustom: false },
    { id: "p15", name: "Will Jordan", position: "Extremo", rating: 93, club: "Crusaders", country: "Nueva Zelanda", isCustom: false },
    { id: "p16", name: "Ox Nche", position: "Pilar", rating: 94, club: "Sharks", country: "Sudáfrica", isCustom: false },
    { id: "p17", name: "Tadhg Furlong", position: "Pilar", rating: 91, club: "Leinster", country: "Irlanda", isCustom: false },
    { id: "p18", name: "Frans Malherbe", position: "Pilar", rating: 93, club: "Stormers", country: "Sudáfrica", isCustom: false }
  ],
  tactics: []
};

let dbCache: DatabaseSchema | null = null;

/**
 * Initialize and load database
 */
export function getDB(): DatabaseSchema {
  if (dbCache) {
    return dbCache;
  }

  try {
    if (!fs.existsSync(DB_PATH)) {
      // Create directories if missing
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
      dbCache = JSON.parse(JSON.stringify(DEFAULT_DB));
      return dbCache!;
    }

    const data = fs.readFileSync(DB_PATH, "utf8");
    dbCache = JSON.parse(data);
    
    // Safety check: ensure all core arrays exist
    if (!dbCache!.users) dbCache!.users = [];
    if (!dbCache!.posts) dbCache!.posts = [];
    if (!dbCache!.news) dbCache!.news = [];
    if (!dbCache!.players) dbCache!.players = [];
    if (!dbCache!.tactics) dbCache!.tactics = [];

    return dbCache!;
  } catch (error) {
    console.error("Failed to read database file, using default in-memory fallback", error);
    dbCache = JSON.parse(JSON.stringify(DEFAULT_DB));
    return dbCache!;
  }
}

/**
 * Persist database to disk
 */
export function saveDB(data: DatabaseSchema): void {
  dbCache = data;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write to database file", error);
  }
}
