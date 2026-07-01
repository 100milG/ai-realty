import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Phone, Lock, Save, Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";

export function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const user = await res.json();
          setName(user.name || "");
          setEmail(user.email || "");
          setPhone(user.phone || "");
        } else {
          console.error("Failed to fetch profile");
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (password && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          ...(password ? { password } : {})
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Profile updated successfully!");
        // Update local storage token and user values so context refreshes instantly
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setPassword("");
        setConfirmPassword("");
      } else {
        setErrorMsg(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <User className="size-8 text-primary mr-3" />
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage and update your personal and security details</p>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information Card */}
          <Card>
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
              <Sparkles className="size-5 text-primary mr-2" />
              General Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground/80 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card>
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
              <Lock className="size-5 text-primary mr-2" />
              Security Settings
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Save Action */}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="flex items-center gap-2 px-6">
              <Save className="size-4" />
              {submitting ? "Saving..." : "Save Profile Details"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
