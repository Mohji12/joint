import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import BuilderDashboard from "@/pages/builder/BuilderDashboard";
import ScrollToTop from "@/components/ScrollToTop";
import SupportChatWidget from "@/components/SupportChatWidget";
import SessionKeepAlive from "@/components/SessionKeepAlive";

// Lazy load all routes for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Legal = lazy(() => import("./pages/Legal"));
const Residential = lazy(() => import("./pages/products/Residential"));
const Commercial = lazy(() => import("./pages/products/Commercial"));
const Industrial = lazy(() => import("./pages/products/Industrial"));
const Interior = lazy(() => import("./pages/products/Interior"));
const LandownerLayout = lazy(() => import("./layouts/LandownerLayout"));
const BuilderLayout = lazy(() => import("./layouts/BuilderLayout"));
const LandownerPage = lazy(() => import("./pages/landowner/LandownerPage"));
const LandownerDashboard = lazy(() => import("./pages/landowner/LandownerDashboard"));
const LandownerMyProjects = lazy(() => import("./pages/landowner/LandownerMyProjects"));
const LandownerContractConstruction = lazy(
  () => import("./pages/landowner/LandownerContractConstruction")
);
const LandownerJointVenture = lazy(() => import("./pages/landowner/LandownerJointVenture"));
const LandownerInterior = lazy(() => import("./pages/landowner/LandownerInterior"));
const LandownerReconstruction = lazy(() => import("./pages/landowner/LandownerReconstruction"));
const LandownerMarketplace = lazy(() => import("./pages/landowner/LandownerMarketplace"));
const LandownerBuilderPortfolio = lazy(() => import("./pages/landowner/LandownerBuilderPortfolio"));
const LandownerMatches = lazy(() => import("./pages/landowner/LandownerMatches"));
const BuilderPage = lazy(() => import("@/pages/builder/BuilderPage"));
const BuilderMyProjects = lazy(() => import("@/pages/builder/BuilderMyProjects"));
const BuilderMatches = lazy(() => import("@/pages/builder/BuilderMatches"));
const BuilderContractConstruction = lazy(
  () => import("@/pages/builder/BuilderContractConstruction")
);
const BuilderJointVenture = lazy(() => import("@/pages/builder/BuilderJointVenture"));
const BuilderInterior = lazy(() => import("@/pages/builder/BuilderInterior"));
const BuilderReconstruction = lazy(() => import("@/pages/builder/BuilderReconstruction"));
const BuilderMarketplace = lazy(() => import("@/pages/builder/BuilderMarketplace"));
const BuilderPortfolio = lazy(() => import("@/pages/builder/BuilderPortfolio"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Documentation = lazy(() => import("./pages/Documentation"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminLandowners = lazy(() => import("./pages/admin/AdminLandowners"));
const AdminLandownerDetail = lazy(() => import("./pages/admin/AdminLandownerDetail"));
const AdminProfessionals = lazy(() => import("./pages/admin/AdminProfessionals"));
const AdminProfessionalDetail = lazy(() => import("./pages/admin/AdminProfessionalDetail"));
const AdminFormSubmissions = lazy(() => import("./pages/admin/AdminFormSubmissions"));
const AdminConnections = lazy(() => import("./pages/admin/AdminConnections"));
const AdminUser360 = lazy(() => import("./pages/admin/AdminUser360"));
const AdminSupportTickets = lazy(() => import("./pages/admin/AdminSupportTickets"));
const AdminPaymentsCases = lazy(() => import("./pages/admin/AdminPaymentsCases"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AccountLayout = lazy(() => import("./layouts/AccountLayout"));
const AccountProfilePage = lazy(() => import("./pages/account/AccountProfilePage"));
const AccountPaymentsPage = lazy(() => import("./pages/account/AccountPaymentsPage"));
const LandownerAccountProperties = lazy(() => import("./pages/landowner/LandownerAccountProperties"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F3B24A]"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <SessionKeepAlive />
        <SupportChatWidget />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/legal-aid" element={<Legal />} />
            <Route
              path="/help"
              element={
                <ComingSoon title="Help Center" description="Get answers to common questions and guides. Coming soon." />
              }
            />
            <Route
              path="/api"
              element={
                <ComingSoon title="API Reference" description="Developer documentation and API reference will be available here soon." ctaHref="/docs" ctaLabel="View Docs" />
              }
            />
            <Route
              path="/community"
              element={
                <ComingSoon title="Community" description="Join discussions and share your project stories. Coming soon." />
              }
            />
            <Route
              path="/partners"
              element={
                <ComingSoon title="Partners" description="Partner with Jointlly for platform growth and collaborations. Coming soon." />
              }
            />
            <Route
              path="/careers"
              element={
                <ComingSoon title="Careers" description="We're building the future of real-estate matchmaking. Careers page coming soon." />
              }
            />
            <Route
              path="/blog"
              element={
                <ComingSoon title="Blog" description="Insights, updates, and guides. Blog page coming soon." />
              }
            />
            <Route
              path="/press"
              element={
                <ComingSoon title="Press Kit" description="Brand resources, press releases, and media assets. Press kit coming soon." />
              }
            />

            {/* Product pages */}
            <Route path="/products/residential" element={<Residential />} />
            <Route path="/products/commercial" element={<Commercial />} />
            <Route path="/products/industrial" element={<Industrial />} />
            <Route path="/products/interior" element={<Interior />} />

            {/* Auth */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/docs" element={<Documentation />} />

            {/* Landowner space   separate interface with layout and all pages */}
            <Route
              path="/landowner"
              element={
                <ProtectedRoute requiredUserType="landowner">
                  <LandownerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/landowner/options" replace />} />
              <Route path="options" element={<LandownerPage />} />
              <Route path="dashboard" element={<LandownerDashboard />} />
              <Route path="account" element={<AccountLayout variant="landowner" />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<AccountProfilePage variant="landowner" />} />
                <Route path="properties" element={<LandownerAccountProperties />} />
                <Route path="payments" element={<AccountPaymentsPage />} />
              </Route>
              <Route path="my-projects" element={<LandownerMyProjects />} />
              <Route path="contract-construction" element={<LandownerContractConstruction />} />
              <Route path="joint-venture" element={<LandownerJointVenture />} />
              <Route path="interior" element={<LandownerInterior />} />
              <Route path="reconstruction" element={<LandownerReconstruction />} />
              <Route path="matches" element={<LandownerMatches />} />
              <Route path="marketplace" element={<LandownerMarketplace />} />
              <Route path="marketplace/builders/:id" element={<LandownerBuilderPortfolio />} />
            </Route>

            {/* Builder / Construction interface   separate interface with layout and all pages */}
            <Route
              path="/builder"
              element={
                <ProtectedRoute requiredUserType="builder">
                  <BuilderLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/builder/options" replace />} />
              <Route path="options" element={<BuilderPage />} />
              <Route path="dashboard" element={<BuilderDashboard />} />
              <Route path="account" element={<AccountLayout variant="builder" />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<AccountProfilePage variant="builder" />} />
                <Route path="projects" element={<BuilderMyProjects embedded />} />
                <Route path="portfolio" element={<BuilderPortfolio />} />
                <Route path="payments" element={<AccountPaymentsPage />} />
              </Route>
              <Route path="my-projects" element={<Navigate to="/builder/account/projects" replace />} />
              <Route path="matches" element={<BuilderMatches />} />
              <Route path="contract-construction" element={<BuilderContractConstruction />} />
              <Route path="joint-venture" element={<BuilderJointVenture />} />
              <Route path="interior" element={<BuilderInterior />} />
              <Route path="reconstruction" element={<BuilderReconstruction />} />
              <Route path="marketplace" element={<BuilderMarketplace />} />
            </Route>

            {/* Admin   requires ADMIN role */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUser360 />} />
              <Route path="landowners" element={<AdminLandowners />} />
              <Route path="landowners/:id" element={<AdminLandownerDetail />} />
              <Route path="professionals" element={<AdminProfessionals />} />
              <Route path="professionals/:id" element={<AdminProfessionalDetail />} />
              <Route path="form-submissions" element={<AdminFormSubmissions />} />
              <Route path="connections" element={<AdminConnections />} />
              <Route path="support-tickets" element={<AdminSupportTickets />} />
              <Route path="payments-cases" element={<AdminPaymentsCases />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
