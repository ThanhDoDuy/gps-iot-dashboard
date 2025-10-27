"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"

const faqs = [
  {
    question: "How do I add a new device?",
    answer: "Navigate to the Devices page and click 'Add Device'. Follow the setup wizard to configure your device.",
  },
  {
    question: "How do I manage user permissions?",
    answer: "Go to Roles & Permissions to view and edit role definitions. Assign roles to users in the Users page.",
  },
  {
    question: "What should I do if a device goes offline?",
    answer:
      "Check the device connection status in the Devices page. Verify network connectivity and restart the device if needed.",
  },
  {
    question: "How do I export device data?",
    answer: "Use the export feature in the Devices or Machines page to download data in CSV or JSON format.",
  },
]

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
          <p className="text-muted-foreground mt-1">Find answers and get support</p>
        </div>

        {/* Contact Support */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Get help from our support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Subject</label>
              <Input placeholder="Describe your issue" className="mt-2 bg-input border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Message</label>
              <textarea
                placeholder="Provide details about your issue..."
                className="mt-2 w-full p-3 rounded-lg bg-input border border-border text-foreground"
                rows={4}
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Send Message</Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Common questions and answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="pb-4 border-b border-border last:border-0">
                <p className="font-medium text-foreground">{faq.question}</p>
                <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Documentation and guides</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Getting Started Guide", description: "Learn the basics" },
                { title: "API Documentation", description: "Integration guide" },
                { title: "Video Tutorials", description: "Step-by-step guides" },
                { title: "Community Forum", description: "Connect with users" },
              ].map((resource) => (
                <Button
                  key={resource.title}
                  variant="outline"
                  className="h-auto flex flex-col items-start p-4 text-foreground border-border hover:bg-muted bg-transparent"
                >
                  <p className="font-medium">{resource.title}</p>
                  <p className="text-xs text-muted-foreground">{resource.description}</p>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
