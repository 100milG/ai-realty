import { createBrowserRouter } from "react-router";

// Customer Pages
import { CustomerLanding } from "./pages/customer/Landing";
import { PropertySearch } from "./pages/customer/PropertySearch";
import { PropertyDetails } from "./pages/customer/PropertyDetails";
import { AIChat } from "./pages/customer/AIChat";
import { CustomerDashboard } from "./pages/customer/Dashboard";
import { CustomerChat } from "./pages/customer/CustomerChat";
import { SavedProperties } from "./pages/customer/SavedProperties";

// Subagent Pages
import { SubagentDashboard } from "./pages/subagent/Dashboard";
import { AddProperty } from "./pages/subagent/AddProperty";
import { LeadManagement } from "./pages/subagent/LeadManagement";
import { KYCVerification } from "./pages/subagent/KYCVerification";
import { PropertyManagement } from "./pages/subagent/PropertyManagement";
import { SubagentPropertyDetails } from "./pages/subagent/PropertyDetails";
import { Profile } from "./pages/subagent/Profile";

// Admin Pages
import { AdminDashboard } from "./pages/admin/Dashboard";
import { SubagentApproval } from "./pages/admin/SubagentApproval";
import { PropertyModeration } from "./pages/admin/PropertyModeration";
import { LeadVisibility } from "./pages/admin/LeadVisibility";
import { ChatMonitoring } from "./pages/admin/ChatMonitoring";
import { AdminPropertyManagement } from "./pages/admin/PropertyManagement";
import { AdminPropertyDetails } from "./pages/admin/PropertyDetails";

// Layouts
import { CustomerLayout } from "./layouts/CustomerLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Auth
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/",
    Component: CustomerLayout,
    children: [
      { index: true, Component: CustomerLanding },
      { path: "search", Component: PropertySearch },
      { path: "property/:id", Component: PropertyDetails },
      { path: "ai-chat", Component: AIChat },
    ],
  },
  {
    path: "/customer",
    Component: DashboardLayout,
    children: [
      { path: "dashboard", Component: CustomerDashboard },
      { path: "chat", Component: CustomerChat },
      { path: "chat/:leadId", Component: CustomerChat },
      { path: "search", Component: PropertySearch },
      { path: "property/:id", Component: PropertyDetails },
      { path: "ai-chat", Component: AIChat },
      { path: "saved", Component: SavedProperties },
    ],
  },
  {
    path: "/subagent",
    Component: DashboardLayout,
    children: [
      { path: "dashboard", Component: SubagentDashboard },
      { path: "properties", Component: PropertyManagement },
      { path: "properties/add", Component: AddProperty },
      { path: "properties/edit/:id", Component: AddProperty },
      { path: "property/:id", Component: SubagentPropertyDetails },
      { path: "leads", Component: LeadManagement },
      { path: "kyc", Component: KYCVerification },
      { path: "chat", Component: CustomerChat },
      { path: "chat/:leadId", Component: CustomerChat },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "/admin",
    Component: DashboardLayout,
    children: [
      { path: "dashboard", Component: AdminDashboard },
      { path: "properties", Component: AdminPropertyManagement },
      { path: "property/:id", Component: AdminPropertyDetails },
      { path: "approvals", Component: SubagentApproval },
      { path: "moderation", Component: PropertyModeration },
      { path: "leads", Component: LeadVisibility },
      { path: "monitoring", Component: ChatMonitoring },
    ],
  },
]);
