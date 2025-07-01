import Navigation from "@/components/navigation";
import { User as FirebaseUser } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { hasUnlimitedAccess, getUserPlanName } from "@/lib/user-utils";
import { 
  FileText, 
  Plus, 
  MessageSquare, 
  BarChart3, 
  Star,
  Calendar,
  Download,
  Eye
} from "@/lib/icons";

interface DashboardProps {
  user?: FirebaseUser | null;
  onUserChange?: (user: FirebaseUser | null) => void;
}

export default function Dashboard({ user, onUserChange }: DashboardProps) {
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} onUserChange={onUserChange} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access your dashboard</h1>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isUnlimitedUser = hasUnlimitedAccess(user);
  const planName = getUserPlanName(user);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onUserChange={onUserChange} />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.displayName || user.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your resumes and career documents
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className={isUnlimitedUser ? "text-blue-600 border-blue-600" : "text-green-600 border-green-600"}>
                <Star className="w-4 h-4 mr-1" />
                {isUnlimitedUser ? "Full Access" : "Free Plan"}
              </Badge>
              <Button variant={isUnlimitedUser ? "outline" : "default"}>
                {isUnlimitedUser ? "All Features Unlocked" : "Upgrade to Pro"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/resume-builder">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-gray-300">
                    <CardContent className="p-6 text-center">
                      <Plus className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Create New Resume</h3>
                      <p className="text-sm text-gray-600">Start from scratch or upload your existing resume</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/cover-letter">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Generate Cover Letter</h3>
                      <p className="text-sm text-gray-600">AI-powered cover letters for specific jobs</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/job-analyzer">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Analyze Job Match</h3>
                      <p className="text-sm text-gray-600">Get suggestions to optimize your resume</p>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Download className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Bulk Export</h3>
                    <p className="text-sm text-gray-600">Download multiple resumes and documents</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Documents</h2>
              <div className="space-y-3">
                
                {/* Sample Resume Entry */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Software Engineer Resume</h3>
                          <p className="text-sm text-gray-500">Last edited 2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sample Cover Letter Entry */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-8 h-8 text-green-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Google Cover Letter</h3>
                          <p className="text-sm text-gray-500">Created 3 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Empty State */}
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-500 mb-2">No documents yet</h3>
                    <p className="text-sm text-gray-400 mb-4">Create your first resume to get started</p>
                    <Link href="/resume-builder">
                      <Button>Create Resume</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plan</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">Test</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Resumes Created</span>
                  <span className="font-medium">Unlimited</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cover Letters</span>
                  <span className="font-medium">Unlimited</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Features</span>
                  <span className="font-medium">Enabled</span>
                </div>
                <div className="pt-2 border-t">
                  <Button className="w-full" variant="outline">All Features Unlocked</Button>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900 mb-1">Tailor for each job</p>
                  <p className="text-gray-600">Customize your resume for each application using our job analyzer.</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 mb-1">Use action verbs</p>
                  <p className="text-gray-600">Start bullet points with strong action verbs like "led," "created," or "improved."</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 mb-1">Keep it concise</p>
                  <p className="text-gray-600">Aim for 1-2 pages maximum and focus on relevant experience.</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-900">Account created</p>
                    <p className="text-gray-500">Today</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-gray-900">Resume downloaded</p>
                    <p className="text-gray-500">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-gray-900">Cover letter generated</p>
                    <p className="text-gray-500">3 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}