import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card-header";
import { CardTitle } from "@/components/ui/card-title";
import { CardContent } from "@/components/ui/card-content";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chatbot")({
  component: ChatbotPage,
});

function ChatbotPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);

  // Fetch client info if we have a client ID in URL params (for future enhancement)
  // For now, we'll allow manual client selection or use context from current page

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add auth header if session exists
      if (session) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Call the chatbot API
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          message: userMessage,
          clientId: clientId // Optional: if we're viewing a specific client
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Add bot response to chat
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        // Add error message
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error || 'Failed to get response'}` }]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Failed to connect to chatbot service" }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Asistente de IA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tu asistente inteligente para gestionar clientes y obtener informes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {clientName && (
            <div className="text-sm text-muted-foreground">
              Cliente: <span className="font-medium">{clientName}</span>
            </div>
          )}
          <Button variant="outline" onClick={clearChat}>
            Limpiar chat
          </Button>
        </div>
      </div>

      {/* Chat messages container */}
      <div className="flex h-[600px] flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user" ? "bg-brand-primary text-canvas" : "bg-secondary/50 text-foreground"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && messages.length === 0 && (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Pensando...</div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex items-center space-x-3 p-4 bg-secondary/50 rounded-t-lg">
          <Separator orientation="vertical" className="h-6" />
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje aquí... (Shift+Enter para nueva línea, Enter para enviar)"
            className="flex-1 resize-none"
            rows={2}
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            className="px-4"
          >
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      {/* Example suggestions */}
      <div className="text-sm text-muted-foreground">
        <p>Ejemplos de lo que puedes preguntar:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>¿Cuántos clientes tenemos en estado "negociación"?</li>
          <li>Dame un resumen de las oportunidades de este mes</li>
          <li>¿Qué vehículos están interesando más a nuestros clientes?</li>
          <li>Programar una llamada de seguimiento para Juan Pérez</li>
          <li>Crear una tarea para revisar el presupuesto del cliente María García</li>
        </ul>
      </div>
    </div>
  );
}
