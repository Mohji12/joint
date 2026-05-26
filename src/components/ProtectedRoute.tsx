import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: "builder" | "landowner" | "admin";
}

const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to auth page with user type
    return (
      <Navigate
        to="/auth"
        state={{ userType: requiredUserType || "builder", from: location.pathname }}
        replace
      />
    );
  }

  // Check if user type matches required type
  if (requiredUserType && user?.userType !== requiredUserType) {
    if (requiredUserType === "admin") {
      if (user?.userType === "builder") return <Navigate to="/builder/options" replace />;
      if (user?.userType === "landowner") return <Navigate to="/landowner/options" replace />;
      return <Navigate to="/auth" replace />;
    }
    if (user?.userType === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user?.userType === "builder") {
      return <Navigate to="/builder/options" replace />;
    }
    return <Navigate to="/landowner/options" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
