import { useState, useEffect } from "react";
import { Send, Sparkles, Home, MapPin, Bed, Bath, Maximize, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Link, useLocation, useNavigate } from "react-router";
import { ConfirmationModal } from "../../components/ConfirmationModal";

interface Message {
  role: "user" | "assistant";
  content: string;
  properties?: Array<{
    id: string;
    image: string;
    price: string;
    title: string;
    location: string;
    beds: number;
    baths: number;
    sqft: number;
    matchScore: number;
  }>;
  preferences?: string[];
}

interface ChatSessionState {
  sessionId: string;
  subject: string;
  messages: Message[];
  extractedPreferences: string[];
  lastUpdated: string;
}

const initialMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Hello! I'm your AI real estate assistant. I'll help you find the perfect property by understanding your needs and preferences. Tell me, what are you looking for in your next home?",
  },
];

const suggestedQuestions = [
  "I'm looking for a 3BHK near international schools in Whitefield",
  "Show me luxury apartments under ₹1.5 Cr in Mumbai",
  "What's available in Marina Bay, Singapore?",
  "I need a villa with a garden and gated security",
];

const LOCAL_STORAGE_KEY = "ai_chat_sessions_v1";

// Converts markdown-like AI output into clean readable HTML
function renderMarkdown(text: string): string {
  return text
    // **bold**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // *italic* (single star, not part of a list)
    .replace(/(?<!\d)\*(?!\*|\s*\d)(.+?)\*/g, "<em>$1</em>")
    // Numbered list items: "1. foo" → "<li>foo</li>" wrapped in <ol>
    .replace(/(?:^|\n)(\d+\.\s+.+?)(?=\n\d+\.\s|\n[^\d]|$)/gs, (_match, item) => {
      const cleaned = item.replace(/^\d+\.\s+/, "").trim();
      return `<li>${cleaned}</li>`;
    })
    .replace(/(<li>.*<\/li>)/s, "<ol class='list-decimal pl-5 space-y-2 my-2'>$1</ol>")
    // Bullet list items: "- foo" or "• foo"
    .replace(/(?:^|\n)[-•]\s+(.+)/g, "\n<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/s, (match) => {
      if (match.includes("list-decimal")) return match;
      return `<ul class='list-disc pl-5 space-y-1 my-2'>${match}</ul>`;
    })
    // Line breaks
    .replace(/\n/g, "<br />");
}

function getStoredSessions(): ChatSessionState[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read chat history:", e);
    return [];
  }
}

function saveStoredSessions(sessions: ChatSessionState[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
}

const generateUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

function formatIndianPrice(amount: number): string {
  const LAKH = 100_000;
  const CRORE = 10_000_000;

  if (amount >= CRORE) {
    const cr = amount / CRORE;
    return `${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Crore`;
  }
  const lk = amount / LAKH;
  return `${lk % 1 === 0 ? lk.toFixed(0) : lk.toFixed(1)} Lakhs`;
}

export function AIChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const isCustomer = location.pathname.startsWith("/customer");
  const initialQuery = (location.state as { initialQuery?: string } | null)?.initialQuery;
  const token = localStorage.getItem("token");
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState(initialQuery ?? "");
  const [isTyping, setIsTyping] = useState(false);
  const [extractedPreferences, setExtractedPreferences] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionsList, setSessionsList] = useState<ChatSessionState[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // On Mount: Load sessions list and restore most recent session if no initialQuery
  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { redirectAfterLogin: location.pathname, initialQuery } });
      return;
    }

    const stored = getStoredSessions();
    setSessionsList(stored);

    if (initialQuery) {
      setSessionId(null);
      setMessages(initialMessages);
      setExtractedPreferences([]);
      handleSend(initialQuery);
    } else if (stored.length > 0) {
      const mostRecent = [...stored].sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )[0]!;
      setSessionId(mostRecent.sessionId);
      setMessages(mostRecent.messages);
      setExtractedPreferences(mostRecent.extractedPreferences);
    }
  }, []);

  const handleNewChat = () => {
    setSessionId(null);
    setMessages(initialMessages);
    setExtractedPreferences([]);
  };

  const handleSelectSession = (sess: ChatSessionState) => {
    setSessionId(sess.sessionId);
    setMessages(sess.messages);
    setExtractedPreferences(sess.extractedPreferences);
  };

  const handleDeleteSession = (sessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete) return;
    const stored = getStoredSessions();
    const filtered = stored.filter(s => s.sessionId !== sessionToDelete);
    saveStoredSessions(filtered);
    setSessionsList(filtered);

    if (sessionId === sessionToDelete) {
      handleNewChat();
    }
    setIsDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  const handleSend = async (customMessage?: string) => {
    const messageText = customMessage || input;
    if (!messageText.trim()) return;

    const userMessage: Message = { role: "user", content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    if (!customMessage) {
      setInput("");
    }
    setIsTyping(true);

    const token = localStorage.getItem("token");
    const activeSessionId = sessionId || generateUUID();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText,
          sessionId: sessionId || undefined
        })
      });

      if (!res.ok) {
        throw new Error("Failed to send message to AI");
      }

      const data = await res.json();

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      // Map dynamic recommended properties matching the card UI format
      const recs = (data.properties || []).map((p: any) => ({
        id: p.id,
        image: p.media?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
        price: p.price ? `₹${formatIndianPrice(p.price)}` : "Contact Agent",
        title: p.title,
        location: p.address || (p.localityName ? `${p.localityName}, Mumbai` : "Unknown Locality"),
        beds: p.beds || 0,
        baths: p.baths || 0,
        sqft: p.sqft || 0,
        matchScore: p.score || 95,
      }));

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        properties: recs.length > 0 ? recs : undefined,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Format current preferences for the sidebar
      let newPrefList: string[] = [];
      if (data.preferences) {
        const prefs = data.preferences;
        if (prefs.localities?.length) newPrefList.push(`Locality: ${prefs.localities.join(", ")}`);
        if (prefs.bedroomsMin !== undefined) newPrefList.push(`${prefs.bedroomsMin} BHK`);
        if (prefs.budgetMax !== undefined) newPrefList.push(`Max Budget: ${formatIndianPrice(prefs.budgetMax)}`);
        if (prefs.propertyType) newPrefList.push(`Type: ${prefs.propertyType}`);
        if (prefs.furnishedStatus) newPrefList.push(`Furnished: ${prefs.furnishedStatus}`);
        if (prefs.listingType) newPrefList.push(`Listing: ${prefs.listingType}`);
        setExtractedPreferences(newPrefList);
      }

      // Update localStorage sessions list
      const stored = getStoredSessions();
      const existingSessionIdx = stored.findIndex(s => s.sessionId === activeSessionId);
      
      const sessionSubject = existingSessionIdx >= 0 
        ? stored[existingSessionIdx]!.subject 
        : (messageText.length > 30 ? messageText.substring(0, 27) + "..." : messageText);

      const updatedSession: ChatSessionState = {
        sessionId: activeSessionId,
        subject: sessionSubject,
        messages: finalMessages,
        extractedPreferences: newPrefList,
        lastUpdated: new Date().toISOString(),
      };

      if (existingSessionIdx >= 0) {
        stored[existingSessionIdx] = updatedSession;
      } else {
        stored.push(updatedSession);
      }

      saveStoredSessions(stored);
      setSessionsList(stored);

    } catch (e) {
      console.error(e);
      const errorMessage: Message = {
        role: "assistant",
        content: "I apologize, I'm having a brief technical issue. Please try again in a moment.",
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-background flex">
      {/* Left Chat History Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex flex-shrink-0">
        {/* New Chat Button */}
        <div className="p-4 border-b border-border">
          <Button
            onClick={handleNewChat}
            className="w-full justify-center rounded-xl bg-gradient-brand text-white shadow-soft"
          >
            <Plus className="size-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase tracking-wider">
            Chat History
          </p>
          {sessionsList.length > 0 ? (
            [...sessionsList]
              .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
              .map((sess) => {
                const isActive = sess.sessionId === sessionId;
                return (
                  <div
                    key={sess.sessionId}
                    onClick={() => handleSelectSession(sess)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground hover:bg-secondary border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <MessageSquare className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="truncate font-medium">{sess.subject}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(sess.sessionId, e)}
                      className="p-1 rounded-lg hover:bg-red-600/10 text-muted-foreground hover:text-red-600 active:bg-red-600/20 active:text-red-700 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground px-3">
              No recent conversations
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center space-x-3">
            <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
              P
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-foreground truncate">Priya Sharma</p>
              <p className="text-[10px] text-muted-foreground truncate">priya@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="size-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-soft">
                <Sparkles className="size-5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">AI Real Estate Assistant</h2>
                <p className="text-sm text-muted-foreground">Always here to help you find your dream home</p>
              </div>
            </div>
            <Badge variant="success" size="sm">Online</Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl ${message.role === "user" ? "ml-12" : "mr-12"}`}>

                <div
                  className={`rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border shadow-soft"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-primary-foreground">{message.content}</p>
                  ) : (
                    <div
                      className="text-foreground text-sm leading-relaxed prose-sm"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                    />
                  )}
                </div>

                {/* Property Cards in Chat */}
                {message.properties && message.properties.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {message.properties.map((property) => (
                      <Link key={property.id} to={isCustomer ? `/customer/property/${property.id}` : `/property/${property.id}`}>
                        <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated transition-all hover:-translate-y-0.5">
                          <div className="relative h-32">
                            <img src={property.image} alt={property.title} className="size-full object-cover" />
                            <div className="absolute top-2 right-2">
                              <Badge variant="ai" size="sm">
                                {property.matchScore}% Match
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="text-lg font-semibold text-foreground font-numeric">{property.price}</p>
                            <p className="text-sm font-medium text-foreground mt-1">{property.title}</p>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <MapPin className="size-3 mr-1" />
                              {property.location}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center">
                                <Bed className="size-3 mr-1" />
                                {property.beds}
                              </span>
                              <span className="flex items-center">
                                <Bath className="size-3 mr-1" />
                                {property.baths}
                              </span>
                              <span className="flex items-center">
                                <Maximize className="size-3 mr-1" />
                                {property.sqft}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {message.role === "user" && (
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-muted-foreground">You</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <div className="size-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <Sparkles className="size-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-soft">
                  <div className="flex space-x-1">
                    <div className="size-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                    <div className="size-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="size-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Or try one of these:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(question)}
                    className="p-3.5 bg-card border border-border rounded-xl text-left text-sm text-foreground hover:bg-secondary hover:border-primary/30 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-card border-t border-border p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 flex items-center bg-input-background rounded-xl px-4 py-3 border border-border focus-within:ring-2 focus-within:ring-ring/30">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Describe your ideal property..."
                className="flex-1 bg-transparent outline-none"
              />
            </div>
            <Button onClick={() => handleSend()} size="lg" className="rounded-xl">
              <Send className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences Sidebar */}
      <aside className="w-80 bg-card border-l border-border p-6 hidden lg:block">
        <h3 className="font-display font-semibold text-foreground mb-4">Extracted Preferences</h3>
        {extractedPreferences.length > 0 ? (
          <div className="space-y-2">
            {extractedPreferences.map((pref, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                <span className="text-sm text-foreground">{pref}</span>
                <Badge variant="ai" size="sm">AI</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Start chatting and I'll learn your preferences automatically
          </p>
        )}

        <div className="mt-8">
          <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to={isCustomer ? "/customer/search" : "/search"}>
              <Button variant="outline" className="w-full justify-start">
                <Home className="size-4 mr-2" />
                Browse All Properties
              </Button>
            </Link>
            <Link to={isCustomer ? "/customer/saved" : "/login"}>
              <Button variant="outline" className="w-full justify-start">
                <Sparkles className="size-4 mr-2" />
                View Saved Properties
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Chat Session"
        message="Are you sure you want to delete this chat session? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDeleteSession}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSessionToDelete(null);
        }}
      />
    </div>
  );
}
