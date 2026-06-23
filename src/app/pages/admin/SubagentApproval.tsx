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
      const res = await fetch("/api/kyc", {
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

  const handleApprove = async (requestId: string) => {
    setActioning(true);
    try {
      const res = await fetch(`/api/kyc/${requestId}/status`, {
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
      const res = await fetch(`/api/kyc/${requestId}/status`, {
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
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Subagent Approvals (KYC)</h1>
          <p className="text-gray-400 mt-1">Review and approve subagent verification requests and PDF documents</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subagents List */}
          <div className={`lg:col-span-2 space-y-4 ${selectedAgentRequest ? "hidden lg:block" : "block"}`}>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20 bg-gray-800 border border-gray-700 rounded-xl">
                <p className="text-gray-400">No pending KYC approvals found.</p>
              </div>
            ) : (
              requests.map((request) => {
                const subagent = request.user || {};
                const initials = (subagent.name || "Agent").split(" ").map((n: string) => n[0]).join("");
                const formattedTime = new Date(request.createdAt).toLocaleDateString();

                return (
                  <div
                    key={request.id}
                    className={`bg-gray-800 rounded-xl border p-6 cursor-pointer transition-all ${
                      selectedAgentRequest?.id === request.id
                        ? "border-blue-500 ring-2 ring-blue-500/50"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedAgentRequest(request)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="size-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{subagent.name || "Agent"}</h3>
                          <p className="text-sm text-gray-400">{subagent.email || "No Email"}</p>
                        </div>
                      </div>
                      <Badge variant={request.status === "APPROVED" ? "success" : request.status === "PENDING" ? "warning" : "danger"} size="sm">
                        {request.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm text-white">{subagent.phone || "No Phone"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Role</p>
                        <p className="text-sm text-white">Subagent Listings Partner</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="text-xs text-gray-400">Submitted {formattedTime}</span>
                      {request.status === "PENDING" && (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={actioning}
                          >
                            <CheckCircle className="size-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              alert("Please enter rejection feedback notes on the sidebar and click Reject Listing.");
                            }}
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
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
          <div className={`bg-gray-800 rounded-xl border border-gray-700 p-6 ${selectedAgentRequest ? "block" : "hidden lg:block"}`}>
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
                    <h2 className="text-xl font-semibold text-white">KYC Documents</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* PAN Card */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2 font-medium">PAN Card (PDF)</label>
                      {selectedAgentRequest.documents?.panCard ? (
                        <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-lg">
                          <div className="flex items-center space-x-3 min-w-0">
                            <FileText className="size-6 text-blue-400 flex-shrink-0" />
                            <span className="text-sm text-white truncate max-w-[140px]">
                              {selectedAgentRequest.documents.panCard.name}
                            </span>
                          </div>
                          <button
                            onClick={() => window.open(selectedAgentRequest.documents.panCard.url, "_blank")}
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="Open PDF"
                          >
                            <ExternalLink className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-red-400">No PAN Card uploaded</p>
                      )}
                    </div>

                    {/* Aadhaar Card */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2 font-medium">Aadhaar Card (PDF)</label>
                      {selectedAgentRequest.documents?.aadhaarCard ? (
                        <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-lg">
                          <div className="flex items-center space-x-3 min-w-0">
                            <FileText className="size-6 text-blue-400 flex-shrink-0" />
                            <span className="text-sm text-white truncate max-w-[140px]">
                              {selectedAgentRequest.documents.aadhaarCard.name}
                            </span>
                          </div>
                          <button
                            onClick={() => window.open(selectedAgentRequest.documents.aadhaarCard.url, "_blank")}
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="Open PDF"
                          >
                            <ExternalLink className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-red-400">No Aadhaar Card uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedAgentRequest.status === "PENDING" && (
                  <>
                    <div className="pt-4 border-t border-gray-700">
                      <h3 className="font-semibold text-white mb-3">Rejection Feedback Notes</h3>
                      <textarea
                        placeholder="Add reason for rejecting this subagent's KYC request..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
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
                        className="w-full text-red-400 border-red-400 hover:bg-red-400/10"
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
                <Shield className="size-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Select a subagent KYC to view documents</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
