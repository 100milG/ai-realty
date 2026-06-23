import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router";
import { Send, Shield, MapPin, Bed, Bath, Maximize, Info, X, MessageSquare } from "lucide-react";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";

export function CustomerChat() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCustomerPortal = location.pathname.startsWith('/customer');
  const [session, setSession] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem("token");
  let currentUserId = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.id;
    } catch (e) {
      console.error(e);
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!token) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    async function loadChatDetails() {
      setLoading(true);
      try {
        // Fetch all leads
        const leadsRes = await fetch("/api/leads", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setLeads(leadsData);
        }

        if (!leadId) {
          setSession(null);
          setLead(null);
          setLoading(false);
          return;
        }

        const sessionRes = await fetch(`/api/messages/lead/${leadId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSession(sessionData.session);
          setLead(sessionData.lead);

          const messagesRes = await fetch(`/api/messages/${sessionData.session.id}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            setMessages(messagesData);
          }
        } else {
          console.error("Failed to load session details");
        }
      } catch (err) {
        console.error("Failed to load chat details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadChatDetails();
  }, [leadId, token]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${session.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Error polling messages:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [session, token]);

  const handleSend = async () => {
    if (!input.trim() || !session) return;

    const tempInput = input;
    setInput("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          content: tempInput
        })
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
      } else {
        alert("Failed to send message.");
        setInput(tempInput);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message.");
      setInput(tempInput);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (leadId && (!session || !lead)) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-500 mb-4">Chat conversation not found.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Determine chat partner
  const isCustomer = lead ? lead.customerId === currentUserId : false;
  const chatPartnerName = lead
    ? isCustomer
      ? (lead.subagent?.name || "Verified Agent")
      : (lead.customer?.name || "Customer")
    : "";
  const chatPartnerRole = lead ? (isCustomer ? "Verified Agent" : "Lead Customer") : "";
  const chatPartnerInitials = chatPartnerName
    ? chatPartnerName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
    : "";

  const property = lead?.property;
  const propertyImage = property?.media?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400";
  const propertyPrice = property?.price ? `$${property.price.toLocaleString()}` : "Contact Agent";
  const propertyLocation = property?.address || (property?.locality ? `${property.locality.name}, ${property.locality.city}` : "Unknown Locality");

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden w-full relative min-h-screen">
      {/* Sidebar Backdrop for Mobile */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Chat List Sidebar (Left pane) */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-screen hidden md:flex">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-lg">Active Chats</h3>
          <p className="text-xs text-gray-500 mt-1">Talk with agents/clients about active properties</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {leads.map((l) => {
            const prop = l.property;
            const subagentName = l.subagent?.name || "Verified Agent";
            const customerName = l.customer?.name || "Customer";
            const partnerName = isCustomerPortal ? subagentName : customerName;
            
            const propImg = prop?.media?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200";
            const isActive = l.id === leadId;
            const chatLink = isCustomerPortal ? `/customer/chat/${l.id}` : `/subagent/chat/${l.id}`;

            return (
              <Link key={l.id} to={chatLink}>
                <div
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-50 border-l-4 border-primary"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={propImg}
                    alt={prop?.title}
                    className="size-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {prop?.title || "Property"}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{partnerName}</p>
                  </div>
                  <Badge variant={l.status === "NEW" ? "info" : "default"} size="sm">
                    {l.status}
                  </Badge>
                </div>
              </Link>
            );
          })}
          {leads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No active chats.</p>
            </div>
          )}
        </div>
      </aside>

      {!lead ? (
        /* Placeholder Chat Area */
        <div className="flex-1 flex flex-col h-screen overflow-hidden justify-center items-center bg-gray-50 p-8">
          <div className="text-center max-w-sm space-y-4">
            <div className="size-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Your Messages</h3>
            <p className="text-sm text-gray-600">
              Select a conversation from the sidebar list to start chatting with verified agents or clients about listed properties.
            </p>
          </div>
        </div>
      ) : (
        /* Chat Area */
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="size-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {chatPartnerInitials}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{chatPartnerName}</h2>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">{chatPartnerRole}</p>
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="size-4 text-accent" />
                  <span>Platform Monitored</span>
                </div>
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none"
                  title="View Property Details"
                >
                  <Info className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <Shield className="size-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure Conversation</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Your contact details are protected. Messages are logged to maintain quality and safety.
                    {!lead.isUnlocked && !isCustomer && " Unlock contact details to view the customer's phone/email."}
                    {!lead.isUnlocked && isCustomer && " The agent cannot see your contact info until unlocked."}
                  </p>
                </div>
              </div>
            </div>

            {messages.map((message, index) => {
              const isMe = message.senderId === currentUserId;
              const msgSenderName = isMe ? "You" : (message.sender?.name || "Partner");
              return (
                <div
                  key={index}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-md ${isMe ? "ml-12" : "mr-12"}`}>
                    {!isMe && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-gray-600">{msgSenderName}</span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isMe
                          ? "bg-primary text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <p className={isMe ? "text-white" : "text-gray-700 whitespace-pre-wrap"}>
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl outline-none"
              />
              <Button onClick={handleSend} size="lg">
                <Send className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Property Sidebar */}
      {lead && property && (
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out
            lg:relative lg:inset-auto lg:z-auto lg:transform-none lg:block h-screen
            ${showSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
        >
          <div className="flex items-center justify-between lg:hidden mb-4">
            <h3 className="font-semibold text-gray-900">Property Details</h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <Link to={isCustomerPortal ? `/customer/property/${property.id}` : `/property/${property.id}`}>
            <Card padding={false} hover>
              <img
                src={propertyImage}
                alt={property.title}
                className="w-full h-40 object-cover rounded-t-xl"
              />
              <div className="p-4">
                <p className="text-xl font-semibold text-gray-900">{propertyPrice}</p>
                <h4 className="font-medium text-gray-900 mt-2">{property.title}</h4>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPin className="size-4 mr-1" />
                  {propertyLocation}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                  <span className="flex items-center">
                    <Bed className="size-4 mr-1" />
                    {property.beds || 0}
                  </span>
                  <span className="flex items-center">
                    <Bath className="size-4 mr-1" />
                    {property.baths || 0}
                  </span>
                  <span className="flex items-center">
                    <Maximize className="size-4 mr-1" />
                    {property.sqft || 0}
                  </span>
                </div>
              </div>
            </Card>
          </Link>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Schedule Viewing
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Request Documents
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Make an Offer
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Lead Status</h4>
            <Badge variant="success" size="sm">{lead.status}</Badge>
            <p className="text-xs text-gray-600 mt-2">
              This lead status determines current follow-up progress. It is synchronized live on both agent and customer dashboards.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
