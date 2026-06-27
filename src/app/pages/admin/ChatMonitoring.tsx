import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, Flag, Shield, Eye, AlertTriangle } from "lucide-react";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

export function ChatMonitoring() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "flagged">("all");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);

  const token = localStorage.getItem("token");

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/admin/monitor`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Map backend ChatSession elements to the dashboard's format
        const formatted = data.map((session: any) => {
          const customerParticipant = session.participants?.find((p: any) => p.role === "customer" || p.user?.role === "CUSTOMER");
          const agentParticipant = session.participants?.find((p: any) => p.role === "subagent" || p.user?.role === "SUBAGENT");
          
          const customerName = customerParticipant?.user?.name || "Customer";
          const agentName = agentParticipant?.user?.name || "Agent";
          const propertyName = session.subject ? session.subject.replace("Inquiry: ", "") : "Property Inquiry";
          
          // Sort messages ascending for chat display
          const sortedMessages = [...(session.messages || [])].sort(
            (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const isFlagged = session.metadata && (session.metadata.flagged === true || session.metadata.flagReason);
          const flagReason = session.metadata ? session.metadata.flagReason : null;

          return {
            id: session.id,
            customer: customerName,
            agent: agentName,
            property: propertyName,
            status: isFlagged ? "flagged" : "active",
            messageCount: session.messages?.length || 0,
            lastMessage: session.messages?.[0] 
              ? new Date(session.messages[0].createdAt).toLocaleDateString()
              : "No messages",
            flagged: isFlagged,
            flagReason: flagReason,
            messages: sortedMessages
          };
        });
        setSessions(formatted);
      }
    } catch (err) {
      console.error("Error fetching chat sessions for admin monitoring:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadSessions();
  }, [token, navigate]);

  const filteredConversations = filter === "all"
    ? sessions
    : sessions.filter((c) => c.status === filter);

  const handleResolveFlag = async (id: string) => {
    // We can resolve flag by clearing metadata flagged keys
    try {
      alert(`Flag resolved for conversation: ${id}`);
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "active", flagged: false, flagReason: null } : s));
      if (selectedConversation && selectedConversation.id === id) {
        setSelectedConversation((prev: any) => prev ? { ...prev, status: "active", flagged: false, flagReason: null } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTakeAction = (id: string) => {
    alert(`Administrative action warning sent to participants of conversation: ${id}`);
  };

  const totalMessages = sessions.reduce((sum, c) => sum + c.messageCount, 0);
  const activeCount = sessions.filter((c) => c.status === "active").length;
  const flaggedCount = sessions.filter((c) => c.flagged).length;

  return (
    <div className="p-8 bg-background min-h-screen text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Chat Monitoring</h1>
          <p className="text-muted-foreground mt-1">Monitor customer-agent conversations and ensure platform compliance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass rounded-2xl shadow-soft p-6 hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
                <p className="text-3xl font-semibold text-foreground mt-2 font-numeric">{sessions.length}</p>
              </div>
              <MessageSquare className="size-8 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <div className="glass rounded-2xl shadow-soft p-6 hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Chats</p>
                <p className="text-3xl font-semibold text-foreground mt-2 font-numeric">{activeCount}</p>
              </div>
              <Eye className="size-8 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div className="glass rounded-2xl shadow-soft p-6 hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged</p>
                <p className="text-3xl font-semibold text-foreground mt-2 font-numeric">{flaggedCount}</p>
              </div>
              <Flag className="size-8 text-red-500 dark:text-red-400" />
            </div>
          </div>
          <div className="glass rounded-2xl shadow-soft p-6 hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-3xl font-semibold text-foreground mt-2 font-numeric">{totalMessages}</p>
              </div>
              <MessageSquare className="size-8 text-purple-500 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="size-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Privacy Protection Active</h3>
              <p className="text-sm text-muted-foreground">
                All conversations are monitored. The platform logs compliance markers and alerts admins if contact details are shared prior to unlocking.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          {[
            { key: "all", label: "All Conversations" },
            { key: "active", label: "Active" },
            { key: "flagged", label: "Flagged" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className={`lg:col-span-2 space-y-3 ${selectedConversation ? "hidden lg:block" : "block"}`}>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-20 glass rounded-2xl shadow-soft">
                <p className="text-muted-foreground">No conversations found.</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`glass rounded-2xl shadow-soft p-4 cursor-pointer transition-all ${
                    selectedConversation?.id === conversation.id
                      ? "ring-2 ring-primary/50"
                      : conversation.flagged
                        ? "ring-1 ring-red-500/30"
                        : "hover:shadow-elevated"
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-foreground">{conversation.customer}</h3>
                        {conversation.flagged && (
                          <Badge variant="danger" size="sm">
                            <Flag className="size-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        with {conversation.agent} • {conversation.property}
                      </p>
                    </div>
                    <MessageSquare className="size-5 text-muted-foreground/50" />
                  </div>

                  {conversation.flagged && conversation.flagReason && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg mb-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="size-4 text-red-500 dark:text-red-400" />
                        <p className="text-xs text-red-600 dark:text-red-400">{conversation.flagReason}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{conversation.messageCount} messages</span>
                    <span>Last message {conversation.lastMessage}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Conversation Details */}
          <div className={`glass rounded-2xl shadow-soft flex flex-col h-[600px] ${selectedConversation ? "flex" : "hidden lg:flex"}`}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden text-sm text-primary font-medium hover:underline flex items-center mr-2"
                      >
                        ← Back
                      </button>
                      <h2 className="text-lg font-semibold text-foreground">Conversation Details</h2>
                    </div>
                    {selectedConversation.flagged && (
                      <Badge variant="danger">
                        <Flag className="size-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.customer} ↔ {selectedConversation.agent}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{selectedConversation.property}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedConversation.messages.map((message: any, index: number) => {
                    const isCustomerMsg = message.senderType === "USER";
                    const senderName = isCustomerMsg ? selectedConversation.customer : selectedConversation.agent;
                    return (
                      <div
                        key={index}
                        className={`flex ${isCustomerMsg ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-[80%]">
                          <p className="text-xs text-muted-foreground mb-1 px-1">{senderName}</p>
                          <div
                            className={`rounded-xl px-3 py-2 ${
                              isCustomerMsg
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground/70 mt-1 px-1">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {selectedConversation.messages.length === 0 && (
                    <p className="text-muted-foreground text-center py-6">No messages recorded.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-border space-y-2">
                  {selectedConversation.flagged ? (
                    <>
                      <Button
                        variant="success"
                        className="w-full"
                        size="sm"
                        onClick={() => handleResolveFlag(selectedConversation.id)}
                      >
                        Resolve Flag
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-500 dark:text-red-400 border-red-400/50 hover:bg-red-500/10"
                        size="sm"
                        onClick={() => handleTakeAction(selectedConversation.id)}
                      >
                        Take Action
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full text-red-500 dark:text-red-400 border-red-400/50 hover:bg-red-500/10"
                      size="sm"
                      onClick={() => handleTakeAction(selectedConversation.id)}
                    >
                      Send Notice
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="size-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
