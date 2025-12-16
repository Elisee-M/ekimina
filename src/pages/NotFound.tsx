import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-subtle">
      <div className="text-center space-y-6 p-8">
        <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center mx-auto">
          <span className="text-4xl font-bold text-primary-foreground">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Home Page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
