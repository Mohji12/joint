import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="text-center max-w-md">
        <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl font-bold">404</h1>
        <p className="mb-4 sm:mb-6 text-base sm:text-lg md:text-xl text-muted-foreground">Oops! Page not found</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 text-primary underline hover:text-primary/90 rounded-md"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
