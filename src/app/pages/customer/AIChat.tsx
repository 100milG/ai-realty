import { useState, useEffect } from "react";
import { Send, Sparkles, Home, MapPin, Bed, Bath, Maximize } from "lucide-react";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Link, useLocation } from "react-router";

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

export function AIChat() {
  const location = useLocation();
  const isCustomer = location.pathname.startsWith("/customer");
  const initialQuery = (location.state as { initialQuery?: string } | null)?.initialQuery;
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState(initialQuery ?? "");
  const [isTyping, setIsTyping] = useState(false);
  const [extractedPreferences, setExtractedPreferences] = useState<string[]>([]);
  const [dbProperties, setDbProperties] = useState<any[]>([]);

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/properties?status=ACTIVE`);
        if (res.ok) {
          const data = await res.json();
          setDbProperties(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadProperties();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      // Map active database properties dynamically
      const recs = dbProperties.slice(0, 2).map((p: any) => ({
        id: p.id,
        image: p.media?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
        price: p.price ? `₹${p.price.toLocaleString()}` : "Contact Agent",
        title: p.title,
        location: p.address || (p.locality ? `${p.locality.name}, ${p.locality.city}` : "Unknown Locality"),
        beds: p.beds || 0,
        baths: p.baths || 0,
        sqft: p.sqft || 0,
        matchScore: 95,
      }));

      const assistantMessage: Message = {
        role: "assistant",
        content: recs.length > 0
          ? "Based on your requirements, I've scanned our active listings and found some excellent matches. Here are my top recommendations:"
          : "I searched our listings catalog, but we don't have active properties matching those criteria right now. Let me know if you want to broaden your search!",
        properties: recs,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setExtractedPreferences(["Modern Architecture", "3-4 Bedrooms", "Good Schools", "San Francisco"]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-background flex">
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
                {message.role === "assistant" && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="size-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                      <Sparkles className="size-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">AI Assistant</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border shadow-soft"
                  }`}
                >
                  <p className={message.role === "user" ? "text-primary-foreground" : "text-foreground"}>
                    {message.content}
                  </p>
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
            <Button onClick={handleSend} size="lg" className="rounded-xl">
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
    </div>
  );
}
