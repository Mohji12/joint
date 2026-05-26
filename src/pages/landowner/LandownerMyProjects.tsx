import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LandownerProjectCard } from "@/components/LandownerProjectCard";

const LandownerMyProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [propertyType, setPropertyType] = useState<string>("all");
  const [verified, setVerified] = useState<string>("all");

  useEffect(() => {
    const stored = localStorage.getItem("landownerProjects");
    if (stored) {
      const parsed = JSON.parse(stored);
      setProjects(parsed);
      setFilteredProjects(parsed);
    }
  }, []);

  useEffect(() => {
    let filtered = [...projects];
    
    if (propertyType !== "all") {
      filtered = filtered.filter(p => p.type === propertyType);
    }
    
    if (verified === "yes") {
      filtered = filtered.filter(p => p.pidValidation);
    } else if (verified === "no") {
      filtered = filtered.filter(p => !p.pidValidation);
    }
    
    setFilteredProjects(filtered);
  }, [propertyType, verified, projects]);

  return (
    <div className="w-full">
      {/* Professional Header */}
      <header className="bg-black text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto w-full py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold">Jointlly</Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/landowner/dashboard" className="text-sm font-medium hover:text-green-400 transition-colors">Dashboard</Link>
                <Link to="/landowner/my-projects" className="text-sm font-medium text-green-400">My Projects</Link>
              </nav>
            </div>
            <Link to="/landowner/dashboard">
              <Button variant="outline" className="border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">My Projects</h1>
          <p className="text-gray-600">Your published requests and their status. Builders can view and respond to these.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-black mb-6">Filter</h2>
              
              <div className="space-y-6">
                {/* Property Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Property Type</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="contract-construction">Contract Construction</SelectItem>
                      <SelectItem value="joint-venture">Joint Venture</SelectItem>
                      <SelectItem value="interior">Interior</SelectItem>
                      <SelectItem value="reconstruction">Renovation/Repaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Verified */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Verified</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="verified-yes" 
                        checked={verified === "yes"}
                        onCheckedChange={() => setVerified(verified === "yes" ? "all" : "yes")}
                      />
                      <label htmlFor="verified-yes" className="text-sm text-gray-600 cursor-pointer">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="verified-no" 
                        checked={verified === "no"}
                        onCheckedChange={() => setVerified(verified === "no" ? "all" : "no")}
                      />
                      <label htmlFor="verified-no" className="text-sm text-gray-600 cursor-pointer">No</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Projects Grid */}
          <div className="flex-1">
            {filteredProjects.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-600 mb-4">No projects found</p>
                <Link to="/landowner/options">
                  <Button className="btn-premium">
                    Create New Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => (
                  <LandownerProjectCard key={index} project={project} index={index} variant="default" />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandownerMyProjects;
