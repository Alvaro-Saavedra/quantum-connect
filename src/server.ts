import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { quantumFAQ } from "./lib/quantumFAQ";
import { catalogoQuantum } from "./lib/datosCatalogo";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

// Supabase client for server use
function createSupabaseServerClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseServerClientWithKey(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function createSupabaseServerClientWithKey(url: string, anonKey: string) {
  return createClient(url, anonKey, {
    auth: {
      storage: undefined, // No localStorage on server
      persistSession: false, // We'll handle session manually via token
      autoRefreshToken: false,
    }
  });
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhanded"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhanded === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhanded":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// Function to find relevant FAQ entries for context
function findRelevantFAQ(message: string): { question: string; answer: string }[] {
  const lowerMessage = message.toLowerCase().trim();
  const relevantFAQ: { question: string; answer: string }[] = [];

  // Check for exact matches first (highest priority)
  for (const faq of quantumFAQ) {
    if (faq.question.toLowerCase() === lowerMessage) {
      return [{ question: faq.question, answer: faq.answer }]; // Return exact match alone
    }
  }

  // Check for partial matches (if the question contains key terms from FAQ)
  for (const faq of quantumFAQ) {
    const lowerQuestion = faq.question.toLowerCase();
    // Simple similarity check: if 50% of words in FAQ question (length > 3) are in the message
    const questionWords = lowerQuestion.split(/\s+/);
    const messageWords = lowerMessage.split(/\s+/);

    // Filter words with length > 3 for comparison
    const significantQuestionWords = questionWords.filter(word => word.length > 3);
    const significantMessageWords = messageWords.filter(word => word.length > 3);

    let matches = 0;
    for (const qWord of significantQuestionWords) {
      if (significantMessageWords.includes(qWord)) {
        matches++;
      }
    }

    const similarity = significantQuestionWords.length > 0 ? matches / significantQuestionWords.length : 0;
    if (similarity >= 0.3) { // Lower threshold for inclusion as context (30%)
      relevantFAQ.push({ question: faq.question, answer: faq.answer });
    }
  }

  return relevantFAQ;
}

// Function to handle chatbot questions with Gemini and catalog context
async function handleChatbotQuestion(message: string): Promise<string> {
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Detect which vehicle the user is talking about (basic keyword search)
  let contextoVehiculo = "Información general: Quantum Motors fabrica vehículos 100% eléctricos en Latinoamérica.";

  const preguntaMinuscula = message.toLowerCase();
  if (preguntaMinuscula.includes("nexus")) {
    contextoVehiculo = JSON.stringify(catalogoQuantum.nexus, null, 2);
  } else if (preguntaMinuscula.includes("montañero") || preguntaMinuscula.includes("e4")) {
    contextoVehiculo = JSON.stringify(catalogoQuantum.e4_montanero, null, 2);
  } else if (preguntaMinuscula.includes("camion") || preguntaMinuscula.includes("ion")) {
    contextoVehiculo = JSON.stringify(catalogoQuantum.camion_ion, null, 2);
  } else if (preguntaMinuscula.includes("moto") || preguntaMinuscula.includes("motocicleta") ||
    preguntaMinuscula.includes("street hunter") || preguntaMinuscula.includes("wanderer") ||
    preguntaMinuscula.includes("ts ") || preguntaMinuscula.includes("tc ")) {
    // Filter only motorcycle data
    const motocicletas = {
      ts_street_hunter_pro: catalogoQuantum.ts_street_hunter_pro,
      tc_wanderer_pro: catalogoQuantum.tc_wanderer_pro,
      ts_street_hunter: catalogoQuantum.ts_street_hunter
    };
    contextoVehiculo = JSON.stringify(motocicletas, null, 2);
  } else {
    // If none mentioned, pass the entire catalog summarized
    contextoVehiculo = JSON.stringify(catalogoQuantum, null, 2);
  }

  // Get relevant FAQ entries for context
  const relevantFAQ = findRelevantFAQ(message);
  const faqContext = relevantFAQ.length > 0
    ? `\n\nPREGUNTAS FRECUENTES RELACIONADAS:\n${relevantFAQ.map(faq => `P: ${faq.question}\nR: ${faq.answer}`).join('\n\n')}`
    : "";

  // Build the SUPER PROMPT (Context Injection) - More human and structured, less repetitive greeting
  const promptEstructurado = `
Eres un asistente experto y amable de Quantum Motors. Tu objetivo es ayudar al cliente proporcionando información precisa y útil basada en la información oficial disponible.

INSTRUCCIONES:
1. Responde en español, de manera profesional, útil y natural
2. Si el usuario pregunta por especificaciones técnicas (precio, autonomía, velocidad, etc.), usa EXACTAMENTE los datos del contexto proporcionado
3. Si la información específica no está en el contexto, indica amablemente que no tienes ese dato específico y sugiere consultar fuentes oficiales
4. Sé claro, conciso y estructurado en tu respuesta
5. Evita saludos repetitivos innecesarios; ve directo al punto pero manteniendo amabilidad
6. Utiliza la información de las preguntas frecuentes y el catálogo proporcionados para informar tus respuestas

--- INFORMACIÓN OFICIAL DE CONTEXTO ---
Catálogo de vehículos:
${contextoVehiculo}
${faqContext}
------------------------------------

PREGUNTA DEL USUARIO:
"${message}"

RESPUESTA:
`;

  // Send the structured prompt to Gemini
  try {
    const result = await model.generateContent(promptEstructurado);
    return await result.response.text();
  } catch (error) {
    console.error("Error en el chatbot:", error);
    return "Disculpa, tuve un problema técnico al procesar tu consulta. Por favor, intenta nuevamente en unos momentos o contacta directamente con nuestro equipo de soporte.";
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Handle chatbot API route
    if (request.method === "POST" && request.url.endsWith("/api/chatbot")) {
      try {
        // Get the Supabase server client
        const supabase = createSupabaseServerClient();

        // Get the user from the session token (optional — allows public catalog access)
        const authHeader = request.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user) {
            userId = user.id;
          }
        }

        // Parse request body
        const { message, clientId } = await request.json();

        if (!message) {
          return new Response(JSON.stringify({ error: "Message is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Get response from Gemini with enhanced context (both FAQ and catalog)
        const botResponse = await handleChatbotQuestion(message);

        // Log the interaction as a client_interaction (type: nota) only if user is authenticated and clientId is provided
        if (userId && clientId) {
          // Update last_contact_at
          await supabase
            .from("clients")
            .update({ last_contact_at: new Date().toISOString() })
            .eq("id", clientId);

          // Insert interaction
          await supabase
            .from("client_interactions")
            .insert({
              client_id: clientId,
              user_id: userId,
              type: "nota",
              content: `User message: ${message}\nBot response: ${botResponse}`
            });
        }

        // Return the bot's response
        return new Response(JSON.stringify({ response: botResponse }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Chatbot error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Otherwise, delegate to the default handler
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
