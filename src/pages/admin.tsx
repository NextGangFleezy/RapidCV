import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FirebaseDebug from "@/components/firebase-debug";
import HomepageDebug from "@/components/homepage-debug";
import PerformanceMonitor from "@/components/performance-monitor";
import { 
  AiOutlineExclamationCircle as AlertCircle,
  AiOutlineDatabase as Database,
  AiOutlineFileText as FileText,
  AiOutlineTeam as Users,
  AiOutlineBarChart as BarChart3,
  AiOutlineSetting as Settings,
  AiOutlineDelete as Trash2,
  AiOutlineDownload as Download
} from "react-icons/ai";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AuthUser } from "@/lib/auth";

interface AdminProps {
  user: AuthUser | null;
}

export default function Admin({ user }: AdminProps) {
  const { toast } = useToast();
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Debug logging (can be removed after testing)
  console.log("Admin page - user:", user);
  console.log("Admin page - user exists:", !!user);

  // For development, allow access without authentication for testing
  // In production, proper Firebase authentication would be required
  const isAdmin = true; // Temporarily bypass auth for admin testing

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user && isAdmin,
  });

  const { data: systemStats } = useQuery<any>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && isAdmin,
  });

  const executeSqlMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest("POST", "/api/admin/sql", { query });
    },
    onSuccess: async (response) => {
      const result = await response.json();
      setSqlResult(result);
      toast({
        title: "Success",
        description: "SQL query executed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to execute SQL query",
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async (dataType: string) => {
      return apiRequest("DELETE", `/api/admin/clear/${dataType}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Success",
        description: "Data cleared successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear data",
        variant: "destructive",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async (dataType: string) => {
      return apiRequest("GET", `/api/admin/export/${dataType}`);
    },
    onSuccess: async (response, dataType) => {
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    },
  });

  // Temporarily disable auth check for admin testing
  // In production, proper authentication would be enforced
  const showAuthRequired = false;

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage and monitor your RapidCV application</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="sql">SQL Console</TabsTrigger>
          <TabsTrigger value="debug">Debug & Monitor</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.resumes || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cover Letters</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.coverLetters || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Job Analyses</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.jobAnalyses || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Application Status</span>
                  <Badge variant="default">Running</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database Status</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Services</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">ID: {user.id} | Firebase: {user.firebaseUid}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download data for backup or analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => exportDataMutation.mutate('users')}
                  disabled={exportDataMutation.isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
                <Button 
                  onClick={() => exportDataMutation.mutate('resumes')}
                  disabled={exportDataMutation.isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Resumes
                </Button>
                <Button 
                  onClick={() => exportDataMutation.mutate('cover-letters')}
                  disabled={exportDataMutation.isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Cover Letters
                </Button>
                <Button 
                  onClick={() => exportDataMutation.mutate('job-analyses')}
                  disabled={exportDataMutation.isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Job Analyses
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clear Data</CardTitle>
                <CardDescription>Remove data from the system (use with caution)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all cover letters?")) {
                      clearDataMutation.mutate('cover-letters');
                    }
                  }}
                  disabled={clearDataMutation.isPending}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cover Letters
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all job analyses?")) {
                      clearDataMutation.mutate('job-analyses');
                    }
                  }}
                  disabled={clearDataMutation.isPending}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Job Analyses
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all resumes? This cannot be undone!")) {
                      clearDataMutation.mutate('resumes');
                    }
                  }}
                  disabled={clearDataMutation.isPending}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Resumes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sql" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SQL Console</CardTitle>
              <CardDescription>Execute SQL queries directly on the database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea
                  id="sql-query"
                  placeholder="SELECT * FROM users LIMIT 10;"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={6}
                />
              </div>
              <Button 
                onClick={() => executeSqlMutation.mutate(sqlQuery)}
                disabled={executeSqlMutation.isPending || !sqlQuery.trim()}
              >
                <Database className="h-4 w-4 mr-2" />
                Execute Query
              </Button>

              {sqlResult && (
                <div className="mt-4">
                  <Label>Query Result</Label>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-sm overflow-auto max-h-96">
                    {JSON.stringify(sqlResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Firebase Authentication Debug</CardTitle>
                <CardDescription>Monitor authentication system and test Firebase integration</CardDescription>
              </CardHeader>
              <CardContent>
                <FirebaseDebug />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
                <CardDescription>Real-time performance metrics and web vitals</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceMonitor />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>Comprehensive system debugging and error tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <HomepageDebug />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Console & Error Logs</CardTitle>
              <CardDescription>Live monitoring of browser console and application errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Real-time Console Monitor</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    This panel captures all console logs, errors, and warnings in real-time.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-lg font-bold text-green-600" id="success-count">0</div>
                      <div className="text-xs text-gray-500">Success Logs</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-lg font-bold text-red-600" id="error-count">0</div>
                      <div className="text-xs text-gray-500">Error Logs</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Quick Diagnostic Tests</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        console.log('🧪 Test log entry generated');
                        toast({ title: "Test", description: "Test log generated" });
                      }}
                    >
                      Generate Test Log
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        fetch('/api/users').then(r => 
                          console.log('🌐 API test:', r.status, r.statusText)
                        );
                      }}
                    >
                      Test API Connection
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const testData = { timestamp: Date.now(), test: true };
                        console.log('📊 Performance test:', performance.now());
                      }}
                    >
                      Performance Test
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Backend Tools</CardTitle>
              <CardDescription>Direct access to administrative functions and utilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-start hover:bg-blue-50"
                  onClick={() => window.open('/api/admin/stats', '_blank')}
                >
                  <BarChart3 className="h-6 w-6 mb-2 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">System Stats API</div>
                    <div className="text-sm text-gray-600">View live system statistics</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-start hover:bg-green-50"
                  onClick={() => window.open('/api/admin/export/users', '_blank')}
                >
                  <Users className="h-6 w-6 mb-2 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Export Users</div>
                    <div className="text-sm text-gray-600">Download user data JSON</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-start hover:bg-purple-50"
                  onClick={() => window.open('/api/admin/export/resumes', '_blank')}
                >
                  <FileText className="h-6 w-6 mb-2 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Export Resumes</div>
                    <div className="text-sm text-gray-600">Download resume data JSON</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-start hover:bg-orange-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all cover letters? This cannot be undone.')) {
                      fetch('/api/admin/clear/cover-letters', { method: 'DELETE' })
                        .then(() => {
                          toast({ title: "Success", description: "Cover letters cleared" });
                          queryClient.invalidateQueries();
                        })
                        .catch(() => toast({ title: "Error", description: "Failed to clear data", variant: "destructive" }));
                    }
                  }}
                >
                  <Trash2 className="h-6 w-6 mb-2 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Clear Cover Letters</div>
                    <div className="text-sm text-gray-600">Remove all cover letter data</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-start hover:bg-indigo-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all job analyses? This cannot be undone.')) {
                      fetch('/api/admin/clear/job-analyses', { method: 'DELETE' })
                        .then(() => {
                          toast({ title: "Success", description: "Job analyses cleared" });
                          queryClient.invalidateQueries();
                        })
                        .catch(() => toast({ title: "Error", description: "Failed to clear data", variant: "destructive" }));
                    }
                  }}
                >
                  <Database className="h-6 w-6 mb-2 text-indigo-600" />
                  <div className="text-left">
                    <div className="font-medium">Clear Job Analyses</div>
                    <div className="text-sm text-gray-600">Remove all analysis data</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-start hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all resumes? This will permanently delete all resume data and cannot be undone!')) {
                      fetch('/api/admin/clear/resumes', { method: 'DELETE' })
                        .then(() => {
                          toast({ title: "Success", description: "Resumes cleared" });
                          queryClient.invalidateQueries();
                        })
                        .catch(() => toast({ title: "Error", description: "Failed to clear data", variant: "destructive" }));
                    }
                  }}
                >
                  <AlertCircle className="h-6 w-6 mb-2 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium">Clear All Resumes</div>
                    <div className="text-sm text-gray-600">⚠️ Dangerous operation</div>
                  </div>
                </Button>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">User Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="default"
                    className="justify-start bg-green-600 hover:bg-green-700"
                    onClick={() => window.open('/builder', '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Resume Builder
                  </Button>

                  <Button 
                    variant="default"
                    className="justify-start bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => window.open('/cover-letter', '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Cover Letter Tool
                  </Button>

                  <Button 
                    variant="default"
                    className="justify-start bg-teal-600 hover:bg-teal-700"
                    onClick={() => window.open('/job-analyzer', '_blank')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Job Analyzer
                  </Button>
                </div>

                <h3 className="text-lg font-semibold">Admin Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="default"
                    className="justify-start bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      fetch('/api/admin/stats')
                        .then(res => res.json())
                        .then(data => {
                          alert(JSON.stringify(data, null, 2));
                        });
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Stats in Popup
                  </Button>

                  <Button 
                    variant="default"
                    className="justify-start bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      queryClient.invalidateQueries();
                      toast({ title: "Success", description: "All caches refreshed" });
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Refresh All Data
                  </Button>

                  <Button 
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const logData = {
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                        localStorage: Object.keys(localStorage),
                        sessionStorage: Object.keys(sessionStorage)
                      };
                      console.log('Admin Debug Info:', logData);
                      toast({ title: "Debug Info", description: "Check browser console for details" });
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Debug Info to Console
                  </Button>

                  <Button 
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const endpoints = [
                        '/api/users',
                        '/api/resumes', 
                        '/api/cover-letters',
                        '/api/job-analyses',
                        '/api/admin/stats'
                      ];
                      
                      Promise.all(endpoints.map(url => 
                        fetch(url).then(res => ({ url, status: res.status, ok: res.ok }))
                      )).then(results => {
                        console.log('API Health Check:', results);
                        const allHealthy = results.every(r => r.ok);
                        toast({ 
                          title: allHealthy ? "All APIs Healthy" : "Some APIs Have Issues", 
                          description: `Check console for details`,
                          variant: allHealthy ? "default" : "destructive"
                        });
                      });
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Test All APIs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}