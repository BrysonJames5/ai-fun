"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Heart } from "lucide-react"
import DocumentTagger from "./tabs/documentTagger"
import WeddingPlanner from "./tabs/weddingPlanner"

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Bryson's Projects</h1>
          <p className="text-slate-600 text-lg">AI-powered tools for work and life</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="document-tagger" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
            <TabsTrigger
              value="document-tagger"
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-800 text-slate-600 font-medium"
            >
              <FileText className="h-4 w-4" />
              Document Parser
            </TabsTrigger>
            <TabsTrigger
              value="wedding-planner"
              className="flex items-center gap-2 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-800 text-slate-600 font-medium"
            >
              <Heart className="h-4 w-4" />
              Wedding Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="document-tagger">
            <DocumentTagger />
          </TabsContent>

          <TabsContent value="wedding-planner">
            <WeddingPlanner />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
