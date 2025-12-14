"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Globe,
  Share2,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";

export default function SEOSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const [seoData, setSeoData] = useState({
    siteTitle: "BeautyHQ - AI-Powered Salon & Spa Management",
    siteDescription: "The complete AI-powered platform for beauty and wellness businesses.",
    keywords: "salon software, spa management, beauty business, appointment scheduling",
    googleAnalyticsId: "",
    googleSearchConsoleId: "",
    facebookPixelId: "",
    ogImage: "/og-image.png",
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("SEO settings saved!");
  };

  const seoScore = 85;
  const seoChecks = [
    { name: "Meta title optimized", status: "pass", details: "Title is 55 characters (ideal: 50-60)" },
    { name: "Meta description set", status: "pass", details: "Description is 78 characters (ideal: 150-160)" },
    { name: "Open Graph tags", status: "pass", details: "All OG tags are properly configured" },
    { name: "Sitemap available", status: "pass", details: "sitemap.xml is accessible" },
    { name: "Robots.txt configured", status: "pass", details: "robots.txt is properly configured" },
    { name: "SSL certificate", status: "pass", details: "Site is served over HTTPS" },
    { name: "Mobile friendly", status: "pass", details: "Site is responsive" },
    { name: "Google Analytics", status: seoData.googleAnalyticsId ? "pass" : "warning", details: seoData.googleAnalyticsId ? "GA4 is configured" : "Not configured" },
    { name: "Structured data", status: "pass", details: "JSON-LD schema is implemented" },
    { name: "Page speed", status: "warning", details: "Consider optimizing images" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SEO Settings</h1>
          <p className="text-slate-500 mt-1">
            Optimize your website for search engines
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* SEO Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
                seoScore >= 80 ? "bg-green-100 text-green-600" :
                seoScore >= 60 ? "bg-yellow-100 text-yellow-600" :
                "bg-red-100 text-red-600"
              }`}>
                {seoScore}
              </div>
              <div>
                <h3 className="font-semibold text-lg">SEO Score</h3>
                <p className="text-slate-500">Your site is well optimized</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Run Audit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="general">
            <Search className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Globe className="h-4 w-4 mr-2" />
            Audit
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags</CardTitle>
              <CardDescription>
                Configure how your site appears in search results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input
                  id="siteTitle"
                  value={seoData.siteTitle}
                  onChange={(e) => setSeoData({ ...seoData, siteTitle: e.target.value })}
                  placeholder="Your Site Title"
                />
                <p className="text-xs text-slate-500">
                  {seoData.siteTitle.length}/60 characters (recommended: 50-60)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Meta Description</Label>
                <Textarea
                  id="siteDescription"
                  value={seoData.siteDescription}
                  onChange={(e) => setSeoData({ ...seoData, siteDescription: e.target.value })}
                  placeholder="Describe your website..."
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  {seoData.siteDescription.length}/160 characters (recommended: 150-160)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={seoData.keywords}
                  onChange={(e) => setSeoData({ ...seoData, keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="text-xs text-slate-500">
                  Separate keywords with commas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Search Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Search Preview</CardTitle>
              <CardDescription>
                How your site appears in Google search results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg p-4 max-w-xl">
                <div className="text-sm text-green-700 mb-1">https://beautyhq.io</div>
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer mb-1">
                  {seoData.siteTitle || "Your Site Title"}
                </h3>
                <p className="text-sm text-slate-600">
                  {seoData.siteDescription || "Your site description will appear here..."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical SEO */}
          <Card>
            <CardHeader>
              <CardTitle>Technical SEO</CardTitle>
              <CardDescription>
                Important technical files for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Sitemap</p>
                    <p className="text-sm text-slate-500">/sitemap.xml</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/sitemap.xml" target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("https://beautyhq.io/sitemap.xml")}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy URL
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Robots.txt</p>
                    <p className="text-sm text-slate-500">/robots.txt</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/robots.txt" target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Settings */}
        <TabsContent value="social" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Open Graph</CardTitle>
              <CardDescription>
                Configure how your site appears when shared on social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ogImage">Default Share Image</Label>
                <div className="flex gap-2">
                  <Input
                    id="ogImage"
                    value={seoData.ogImage}
                    onChange={(e) => setSeoData({ ...seoData, ogImage: e.target.value })}
                    placeholder="/og-image.png"
                  />
                  <Button variant="outline">Upload</Button>
                </div>
                <p className="text-xs text-slate-500">
                  Recommended size: 1200x630 pixels
                </p>
              </div>

              {/* Social Preview */}
              <div className="mt-6">
                <Label className="mb-3 block">Preview</Label>
                <div className="border rounded-lg overflow-hidden max-w-md">
                  <div className="bg-slate-200 h-40 flex items-center justify-center text-slate-500">
                    1200 x 630 image preview
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-slate-500 uppercase">beautyhq.io</p>
                    <p className="font-semibold text-slate-900 mt-1">{seoData.siteTitle}</p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{seoData.siteDescription}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Profiles</CardTitle>
              <CardDescription>
                Link your social media accounts for better visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Facebook Page URL</Label>
                  <Input placeholder="https://facebook.com/yourpage" />
                </div>
                <div className="space-y-2">
                  <Label>Twitter/X Handle</Label>
                  <Input placeholder="@yourhandle" />
                </div>
                <div className="space-y-2">
                  <Label>Instagram Handle</Label>
                  <Input placeholder="@yourhandle" />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input placeholder="https://linkedin.com/company/yourcompany" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Settings */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>
                Track your website traffic and user behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gaId">Google Analytics 4 Measurement ID</Label>
                <Input
                  id="gaId"
                  value={seoData.googleAnalyticsId}
                  onChange={(e) => setSeoData({ ...seoData, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-slate-500">
                  Find this in Google Analytics {">"} Admin {">"} Data Streams
                </p>
              </div>
              {seoData.googleAnalyticsId && (
                <Badge variant="success" className="mt-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Search Console</CardTitle>
              <CardDescription>
                Monitor your search performance and fix issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gscId">Verification Code</Label>
                <Input
                  id="gscId"
                  value={seoData.googleSearchConsoleId}
                  onChange={(e) => setSeoData({ ...seoData, googleSearchConsoleId: e.target.value })}
                  placeholder="google-site-verification=..."
                />
              </div>
              <Button variant="outline" asChild>
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener">
                  Open Search Console
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facebook Pixel</CardTitle>
              <CardDescription>
                Track conversions from Facebook ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fbPixel">Pixel ID</Label>
                <Input
                  id="fbPixel"
                  value={seoData.facebookPixelId}
                  onChange={(e) => setSeoData({ ...seoData, facebookPixelId: e.target.value })}
                  placeholder="123456789012345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Audit */}
        <TabsContent value="audit" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Audit Results</CardTitle>
              <CardDescription>
                {seoChecks.filter(c => c.status === "pass").length} of {seoChecks.length} checks passed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seoChecks.map((check, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      check.status === "pass" ? "bg-green-50" :
                      check.status === "warning" ? "bg-yellow-50" :
                      "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {check.status === "pass" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : check.status === "warning" ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-slate-500">{check.details}</p>
                      </div>
                    </div>
                    <Badge variant={check.status === "pass" ? "success" : check.status === "warning" ? "warning" : "destructive"}>
                      {check.status === "pass" ? "Passed" : check.status === "warning" ? "Warning" : "Failed"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 bg-yellow-500 rounded-full" />
                  <div>
                    <p className="font-medium">Optimize images</p>
                    <p className="text-sm text-slate-500">
                      Compress images and use modern formats like WebP for faster page loads.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full" />
                  <div>
                    <p className="font-medium">Add more internal links</p>
                    <p className="text-sm text-slate-500">
                      Link between related pages to improve navigation and SEO.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full" />
                  <div>
                    <p className="font-medium">Create more blog content</p>
                    <p className="text-sm text-slate-500">
                      Regular blog posts can improve search rankings and attract organic traffic.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
