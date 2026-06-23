import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Upload, FileText, CheckCircle2, Clock, AlertCircle, X, ExternalLink } from "lucide-react";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";

export function KYCVerification() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<"unsubmitted" | "pending" | "approved" | "rejected">("unsubmitted");
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState({
    panCard: null as { name: string; url: string } | null,
    aadhaarCard: null as { name: string; url: string } | null,
  });

  const panInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadKYCDetails() {
      setLoading(true);
      try {
        const res = await fetch("/api/kyc", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.status) {
            const dbStatus = data.status.toLowerCase();
            setVerificationStatus(dbStatus as any);
            setFeedback(data.adminFeedback || "");
            if (data.documents) {
              setDocuments({
                panCard: data.documents.panCard || null,
                aadhaarCard: data.documents.aadhaarCard || null,
              });
            }
          }
        }
      } catch (err) {
        console.error("Error loading KYC:", err);
      } finally {
        setLoading(false);
      }
    }
    loadKYCDetails();
  }, [token, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "panCard" | "aadhaarCard") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF document only.");
        return;
      }
      setDocuments((prev) => ({
        ...prev,
        [type]: {
          name: file.name,
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // Mock uploaded document URL for sandbox
        },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!documents.panCard || !documents.aadhaarCard) {
      alert("Please upload both PAN Card and Aadhaar Card PDF documents.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ documents })
      });

      const data = await res.json();
      if (res.ok) {
        setVerificationStatus("pending");
        alert(data.message || "KYC documents submitted successfully!");
      } else {
        alert(data.error || "Failed to submit KYC.");
      }
    } catch (err) {
      console.error("Error submitting KYC:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-600 mt-1">Verify your identity by submitting tax and identification cards (PDF format only)</p>
        </div>

        {/* Status Card */}
        <Card>
          <div className="flex items-start space-x-4">
            <div className={`size-12 rounded-lg flex items-center justify-center ${
              verificationStatus === "approved" ? "bg-green-100" :
              verificationStatus === "rejected" ? "bg-red-100" :
              verificationStatus === "pending" ? "bg-yellow-100" :
              "bg-gray-100"
            }`}>
              {verificationStatus === "approved" && <CheckCircle2 className="size-7 text-green-600" />}
              {verificationStatus === "rejected" && <AlertCircle className="size-7 text-red-600" />}
              {verificationStatus === "pending" && <Clock className="size-7 text-yellow-600" />}
              {verificationStatus === "unsubmitted" && <AlertCircle className="size-7 text-gray-600" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">Verification Status</h2>
                <Badge
                  variant={
                    verificationStatus === "approved" ? "success" :
                    verificationStatus === "rejected" ? "danger" :
                    verificationStatus === "pending" ? "warning" :
                    "default"
                  }
                >
                  {verificationStatus === "approved" && "Verified"}
                  {verificationStatus === "rejected" && "Rejected"}
                  {verificationStatus === "pending" && "Pending Review"}
                  {verificationStatus === "unsubmitted" && "Not Submitted"}
                </Badge>
              </div>
              <p className="text-gray-600">
                {verificationStatus === "approved" && "Your account has been verified. You can now list properties."}
                {verificationStatus === "rejected" && `Your verification was rejected. Feedback: "${feedback || "Please upload valid documents."}"`}
                {verificationStatus === "pending" && "Your documents are under review. This usually takes 24-48 hours."}
                {verificationStatus === "unsubmitted" && "Please upload PAN Card and Aadhaar Card PDF files below to complete verification."}
              </p>
            </div>
          </div>
        </Card>

        {/* Progress Steps */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Verification Progress</h2>
          <div className="space-y-4">
            {[
              { step: "Personal Information", status: "completed" },
              { step: "Document Upload", status: documents.panCard && documents.aadhaarCard ? "completed" : "current" },
              { step: "Admin Review", status: verificationStatus === "approved" ? "completed" : verificationStatus === "pending" ? "current" : "pending" },
              { step: "Approval", status: verificationStatus === "approved" ? "completed" : "pending" },
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`size-8 rounded-full flex items-center justify-center font-semibold ${
                  item.status === "completed" ? "bg-green-100 text-green-600" :
                  item.status === "current" ? "bg-blue-100 text-primary" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {item.status === "completed" ? <CheckCircle2 className="size-5" /> : index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    item.status === "pending" ? "text-gray-500" : "text-gray-900"
                  }`}>
                    {item.step}
                  </p>
                </div>
                <Badge variant={
                  item.status === "completed" ? "success" :
                  item.status === "current" ? "info" :
                  "default"
                } size="sm">
                  {item.status === "completed" ? "Completed" :
                   item.status === "current" ? "In Progress" :
                   "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Document Upload */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Documents</h2>
          <div className="space-y-6">
            
            {/* PAN Card Upload */}
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                PAN Card (PDF Format) *
              </label>
              <input
                ref={panInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e, "panCard")}
              />
              {documents.panCard ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="size-8 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{documents.panCard.name}</p>
                      <p className="text-xs text-gray-600">PDF Document</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(documents.panCard?.url, "_blank")}
                      className="p-2 text-gray-500 hover:text-primary"
                      title="View PDF"
                    >
                      <ExternalLink className="size-5" />
                    </button>
                    <button
                      onClick={() => setDocuments({ ...documents, panCard: null })}
                      className="p-2 text-gray-500 hover:text-red-500"
                      title="Remove PDF"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => panInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors flex flex-col items-center justify-center"
                >
                  <Upload className="size-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 font-medium">Upload PAN Card PDF</span>
                  <span className="text-xs text-gray-500 mt-1">Accepts only PDF format</span>
                </button>
              )}
            </div>

            {/* Aadhaar Card Upload */}
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Aadhaar Card (PDF Format) *
              </label>
              <input
                ref={aadhaarInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e, "aadhaarCard")}
              />
              {documents.aadhaarCard ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="size-8 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{documents.aadhaarCard.name}</p>
                      <p className="text-xs text-gray-600">PDF Document</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(documents.aadhaarCard?.url, "_blank")}
                      className="p-2 text-gray-500 hover:text-primary"
                      title="View PDF"
                    >
                      <ExternalLink className="size-5" />
                    </button>
                    <button
                      onClick={() => setDocuments({ ...documents, aadhaarCard: null })}
                      className="p-2 text-gray-500 hover:text-red-500"
                      title="Remove PDF"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => aadhaarInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors flex flex-col items-center justify-center"
                >
                  <Upload className="size-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 font-medium">Upload Aadhaar Card PDF</span>
                  <span className="text-xs text-gray-500 mt-1">Accepts only PDF format</span>
                </button>
              )}
            </div>
            
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-gray-600">
            All documents will be reviewed by our admin team
          </p>
          <Button
            size="lg"
            variant="success"
            className="w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={!documents.panCard || !documents.aadhaarCard || submitting}
          >
            {submitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}
