import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, X, FileText, Shield, ExternalLink } from "lucide-react";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

export function SubagentApproval() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentRequest, setSelectedAgentRequest] = useState<any | null>(null);
  const [feedback, setFeedback] = useState("");
  const [actioning, setActioning] = useState(false);

  const token = localStorage.getItem("token");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/kyc`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Error fetching KYC requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadRequests();
  }, [token, navigate]);

  // Clear feedback when switching between KYC requests
  useEffect(() => {
    setFeedback("");
  }, [selectedAgentRequest?.id]);

  const handleApprove = async (requestId: string) => {
    setActioning(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/kyc/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "APPROVED",
          feedback: feedback || "Your documents look great!"
        })
      });

      if (res.ok) {
        alert("Subagent KYC Approved successfully!");
        setRequests(prev => prev.filter(r => r.id !== requestId));
        setSelectedAgentRequest(null);
        setFeedback("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to approve KYC.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong.");
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!feedback.trim()) {
      alert("Please provide feedback notes explaining the rejection reason.");
      return;
    }
    setActioning(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/kyc/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "REJECTED",
          feedback
        })
      });

      if (res.ok) {
        alert("Subagent KYC Rejected.");
        setRequests(prev => prev.filter(r => r.id !== requestId));
        setSelectedAgentRequest(null);
        setFeedback("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to reject KYC.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong.");
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="p-8 bg-background min-h-screen text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Subagent Approvals (KYC)</h1>
          <p className="text-muted-foreground mt-1">Review and approve subagent verification requests and PDF documents</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subagents List */}
          <div className={`lg:col-span-2 space-y-4 ${selectedAgentRequest ? "hidden lg:block" : "block"}`}>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20 glass rounded-2xl shadow-soft">
                <p className="text-muted-foreground">No pending KYC approvals found.</p>
              </div>
            ) : (
              requests.map((request) => {
                const subagent = request.user || {};
                const initials = (subagent.name || "Agent").split(" ").map((n: string) => n[0]).join("");
                const formattedTime = new Date(request.createdAt).toLocaleDateString();

                return (
                  <div
                    key={request.id}
                    className={`glass rounded-2xl shadow-soft p-6 cursor-pointer transition-all ${
                      selectedAgentRequest?.id === request.id
                        ? "ring-2 ring-primary/50 border-primary"
                        : "hover:shadow-elevated"
                    }`}
                    onClick={() => setSelectedAgentRequest(request)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="size-12 bg-gradient-brand rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{subagent.name || "Agent"}</h3>
                          <p className="text-sm text-muted-foreground">{subagent.email || "No Email"}</p>
                        </div>
                      </div>
                      <Badge variant={request.status === "APPROVED" ? "success" : request.status === "PENDING" ? "warning" : "danger"} size="sm">
                        {request.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm text-foreground">{subagent.phone || "No Phone"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="text-sm text-foreground">Subagent Listings Partner</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-xs text-muted-foreground">Submitted {formattedTime}</span>
                      {request.status === "PENDING" && (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setSelectedAgentRequest(request)}
                          >
                            <CheckCircle className="size-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAgentRequest(request)}
                            className="text-red-500 dark:text-red-400 border-red-400/50 hover:bg-red-500/10"
                          >
                            <X className="size-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Document Viewer */}
          <div className={`glass rounded-2xl shadow-soft p-6 ${selectedAgentRequest ? "block" : "hidden lg:block"}`}>
            {selectedAgentRequest ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-4">
                    <button
                      onClick={() => setSelectedAgentRequest(null)}
                      className="lg:hidden text-sm text-primary font-medium hover:underline flex items-center mr-2"
                    >
                      ← Back
                    </button>
                    <h2 className="text-xl font-semibold text-foreground">KYC Documents</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* PAN Card */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2 font-medium">PAN Card (PDF)</label>
                      {selectedAgentRequest.documents?.panCard ? (
                        <div className="flex items-center justify-between p-3 bg-secondary border border-border rounded-lg">
                          <div className="flex items-center space-x-3 min-w-0">
                            <FileText className="size-6 text-primary flex-shrink-0" />
                            <span className="text-sm text-foreground truncate max-w-[140px]">
                              {selectedAgentRequest.documents.panCard.name}
                            </span>
                          </div>
                          <button
                            onClick={() => window.open(selectedAgentRequest.documents.panCard.url, "_blank")}
                            className="p-1 text-primary hover:text-primary/80"
                            title="Open PDF"
                          >
                            <ExternalLink className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500 dark:text-red-400">No PAN Card uploaded</p>
                      )}
                    </div>

                    {/* Aadhaar Card */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2 font-medium">Aadhaar Card (PDF)</label>
                      {selectedAgentRequest.documents?.aadhaarCard ? (
                        <div className="flex items-center justify-between p-3 bg-secondary border border-border rounded-lg">
                          <div className="flex items-center space-x-3 min-w-0">
                            <FileText className="size-6 text-primary flex-shrink-0" />
                            <span className="text-sm text-foreground truncate max-w-[140px]">
                              {selectedAgentRequest.documents.aadhaarCard.name}
                            </span>
                          </div>
                          <button
                            onClick={() => window.open(selectedAgentRequest.documents.aadhaarCard.url, "_blank")}
                            className="p-1 text-primary hover:text-primary/80"
                            title="Open PDF"
                          >
                            <ExternalLink className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500 dark:text-red-400">No Aadhaar Card uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedAgentRequest.status === "PENDING" && (
                  <>
                    <div className="pt-4 border-t border-border">
                      <h3 className="font-semibold text-foreground mb-3">Rejection Feedback Notes</h3>
                      <textarea
                        placeholder="Add reason for rejecting this subagent's KYC request..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="success"
                        className="w-full"
                        onClick={() => handleApprove(selectedAgentRequest.id)}
                        disabled={actioning}
                      >
                        <CheckCircle className="size-4 mr-2" />
                        Approve Subagent
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-500 dark:text-red-400 border-red-400/50 hover:bg-red-500/10"
                        onClick={() => handleReject(selectedAgentRequest.id)}
                        disabled={actioning}
                      >
                        <X className="size-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="size-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Select a subagent KYC to view documents</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
