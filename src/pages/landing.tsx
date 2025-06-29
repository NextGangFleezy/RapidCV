import Navigation from "@/components/navigation";
import { User as FirebaseUser } from "firebase/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Edit3, 
  Lightbulb, 
  Download, 
  MessageSquare, 
  CheckCircle, 
  BarChart3,
  Users,
  Twitter,
  Linkedin,
  Github
} from "@/lib/icons";

interface LandingProps {
  user?: FirebaseUser | null;
  onUserChange?: (user: FirebaseUser | null) => void;
}

export default function Landing({ user, onUserChange }: LandingProps) {
  const [authOpen, setAuthOpen] = useState(false);

  const handleGoogleSignIn = (signedInUser: FirebaseUser) => {
    onUserChange?.(signedInUser);
  };

  const handleStartTrial = () => {
    if (user) {
      // User is signed in, redirect to builder
      window.location.href = "/builder";
    } else {
      // User not signed in, show auth dialog
      setAuthOpen(true);
    }
  };

  return (
    <div className="bg-gray-50 font-sans">
      <Navigation user={user} onUserChange={onUserChange} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Build Your Perfect Resume in
              <span className="text-primary"> Minutes</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create professional resumes with AI-powered suggestions, beautiful templates, and real-time preview. Land your dream job faster with RapidCV.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary text-white px-8 py-4 text-lg hover:bg-blue-700"
                onClick={handleStartTrial}
              >
                Get 2 Free Resumes
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg"
                onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                View Our Plans
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">2 free resume builds included • Upgrade for AI features</p>
          </div>

          {/* Hero Preview */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg">
                    <div className="text-center mb-6">
                      <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                      <h3 className="font-bold text-lg text-gray-900">Sarah Johnson</h3>
                      <p className="text-gray-600">Senior Software Engineer</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Contact</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>sarah.johnson@email.com</p>
                          <p>(555) 123-4567</p>
                          <p>San Francisco, CA</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>JavaScript, React</p>
                          <p>Node.js, Python</p>
                          <p>AWS, Docker</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">Professional Summary</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Experienced software engineer with 5+ years developing scalable web applications. Proven track record of leading cross-functional teams and delivering high-quality solutions.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">Experience</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-gray-900">Senior Software Engineer</h4>
                            <span className="text-sm text-gray-500">2021 - Present</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">TechCorp Inc.</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Led development of microservices architecture</li>
                            <li>• Improved application performance by 40%</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Badge className="absolute -top-4 -right-4 bg-success text-white">
              Live Preview
            </Badge>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive suite of tools helps you create, optimize, and deliver professional resumes that get noticed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-6">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Resume Builder</h3>
                <p className="text-gray-600">
                  Create professional resumes with our intuitive drag-and-drop editor. Real-time preview ensures your resume looks perfect.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Suggestions</h3>
                <p className="text-gray-600">
                  Get intelligent content suggestions and optimization tips powered by advanced AI to make your resume stand out.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mb-6">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Templates</h3>
                <p className="text-gray-600">
                  Choose from dozens of professionally designed templates that are optimized for applicant tracking systems (ATS).
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Cover Letter Generator</h3>
                <p className="text-gray-600">
                  Generate personalized cover letters using AI that perfectly complement your resume and target specific job positions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Job Match Analyzer</h3>
                <p className="text-gray-600">
                  Analyze job descriptions and get recommendations on how to optimize your resume for specific positions and industries.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Export & Share</h3>
                <p className="text-gray-600">
                  Download your resume as PDF, Word document, or share a live link. Multiple format options for every application need.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How RapidCV Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build professional resumes in three simple steps. No design experience needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Enter Your Information</h3>
              <p className="text-gray-600">
                Fill out our guided forms with your work experience, education, and skills. Our system walks you through each section step-by-step.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Your Template</h3>
              <p className="text-gray-600">
                Select from professionally designed templates that are optimized for applicant tracking systems and hiring managers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Download & Apply</h3>
              <p className="text-gray-600">
                Download your resume as a PDF or Word document. Make edits anytime and generate multiple versions for different job applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with 2 free resume builds, then upgrade for unlimited access and AI features. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200 hover:border-blue-300 transition-all">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                  <p className="text-gray-600">Get started with basic features</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">2 professional resume builds</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">PDF upload and parsing</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">Basic PDF export</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">3 professional templates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">Real-time preview</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                  onClick={handleStartTrial}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary shadow-lg relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-primary mb-2">
                    $5-15
                    <span className="text-lg text-gray-600 font-normal">/month</span>
                  </div>
                  <p className="text-gray-600">For serious job seekers</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">Unlimited professional resumes</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">AI-powered content suggestions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">AI cover letter generator</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">Job match analyzer</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">Full dashboard access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">All premium templates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">Priority support</span>
                  </li>
                </ul>
                
                <Button className="w-full bg-primary text-white hover:bg-blue-700">
                  Upgrade to Pro
                </Button>
                <p className="text-center text-sm text-gray-500 mt-2">Cancel anytime</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Build Your Perfect Resume?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have landed their dream jobs with RapidCV. Start building your standout resume today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary px-8 py-4 text-lg hover:bg-gray-50"
              onClick={handleStartTrial}
            >
              Get 2 Free Resumes
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white px-8 py-4 text-lg hover:bg-white hover:text-primary">
              View Features
            </Button>
          </div>
          <p className="text-sm text-blue-100 mt-6">✓ 2 free resume builds  ✓ No credit card required  ✓ Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">RapidCV</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                The fastest way to create professional resumes that get you hired. Build, optimize, and download your perfect resume in minutes.
              </p>
              <div className="flex space-x-4">
                <Twitter className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Linkedin className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Github className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/builder" className="hover:text-white transition-colors">Resume Builder</Link></li>
                <li><Link href="/cover-letter" className="hover:text-white transition-colors">Cover Letter Generator</Link></li>
                <li><Link href="/job-analyzer" className="hover:text-white transition-colors">Job Match Analyzer</Link></li>
                <li><a href="#templates" className="hover:text-white transition-colors">Templates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">© 2024 RapidCV. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      <AuthDialog 
        open={authOpen} 
        onOpenChange={setAuthOpen}
        onSignIn={handleGoogleSignIn}
      />
    </div>
  );
}
