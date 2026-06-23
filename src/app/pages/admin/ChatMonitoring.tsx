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
      const res = await fetch("/api/messages/admin/monitor", {
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
        setSelectedConversation(prev => prev ? { ...prev, status: "active", flagged: false, flagReason: null } : null);
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
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Chat Monitoring</h1>
          <p className="text-gray-400 mt-1">Monitor customer-agent conversations and ensure platform compliance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Conversations</p>
                <p className="text-3xl font-semibold text-white mt-2">{sessions.length}</p>
              </div>
              <MessageSquare className="size-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Chats</p>
                <p className="text-3xl font-semibold text-white mt-2">{activeCount}</p>
              </div>
              <Eye className="size-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Flagged</p>
                <p className="text-3xl font-semibold text-white mt-2">{flaggedCount}</p>
              </div>
              <Flag className="size-8 text-red-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Messages</p>
                <p className="text-3xl font-semibold text-white mt-2">{totalMessages}</p>
              </div>
              <MessageSquare className="size-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="size-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">Privacy Protection Active</h3>
              <p className="text-sm text-blue-200">
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
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
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
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-20 bg-gray-800 border border-gray-700 rounded-xl">
                <p className="text-gray-400">No conversations found.</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedConversation?.id === conversation.id
                      ? "border-blue-500 ring-2 ring-blue-500/50"
                      : conversation.flagged
                        ? "border-red-500/50"
                        : "border-gray-700 hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-white">{conversation.customer}</h3>
                        {conversation.flagged && (
                          <Badge variant="danger" size="sm">
                            <Flag className="size-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        with {conversation.agent} • {conversation.property}
                      </p>
                    </div>
                    <MessageSquare className="size-5 text-gray-500" />
                  </div>

                  {conversation.flagged && conversation.flagReason && (
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg mb-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="size-4 text-red-400" />
                        <p className="text-xs text-red-400">{conversation.flagReason}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{conversation.messageCount} messages</span>
                    <span>Last message {conversation.lastMessage}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Conversation Details */}
          <div className={`bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-[600px] ${selectedConversation ? "block" : "hidden lg:flex"}`}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden text-sm text-primary font-medium hover:underline flex items-center mr-2"
                      >
                        ← Back
                      </button>
                      <h2 className="text-lg font-semibold text-white">Conversation Details</h2>
                    </div>
                    {selectedConversation.flagged && (
                      <Badge variant="danger">
                        <Flag className="size-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {selectedConversation.customer} ↔ {selectedConversation.agent}
                  </p>
                  <p className="text-xs text-gray-500">{selectedConversation.property}</p>
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
                          <p className="text-xs text-gray-400 mb-1 px-1">{senderName}</p>
                          <div
                            className={`rounded-xl px-3 py-2 ${
                              isCustomerMsg
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-white"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-1">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {selectedConversation.messages.length === 0 && (
                    <p className="text-gray-500 text-center py-6">No messages recorded.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-700 space-y-2">
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
                        className="w-full text-red-400 border-red-400 hover:bg-red-400/10"
                        size="sm"
                        onClick={() => handleTakeAction(selectedConversation.id)}
                      >
                        Take Action
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full text-red-400 border-red-400 hover:bg-red-400/10"
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
                  <MessageSquare className="size-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
