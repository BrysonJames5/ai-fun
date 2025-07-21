"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Loader2, Tag, AlertCircle, Brain, Zap, Database, Search, BookOpen } from "lucide-react"

export default function DocumentTagger() {
  const [file, setFile] = useState<File | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file")
        setFile(null)
        return
      }

      if (selectedFile.size > 1024 * 1024) {
        setError("File size must be under 1MB")
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError(null)
      setTags([])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const uploadDocument = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)
    setTags([])

    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const response = await fetch("/api/tag", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process document")
      }

      if (data.tags) {
        const tagArray = data.tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean)
        setTags(tagArray)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while processing your document")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setTags([])
    setError(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-blue-50 rounded-full border border-blue-200">
            <Brain className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">AI Document Parser</h2>
        </div>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Extract key insights and topics from your documents using advanced AI analysis. Perfect for research, content
          organization, and knowledge management.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Card */}
        <Card className="border border-blue-100 shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <FileText className="h-24 w-24" />
            </div>
            <CardTitle className="flex items-center gap-3 relative z-10">
              <Upload className="h-6 w-6" />
              Document Upload
            </CardTitle>
            <CardDescription className="text-blue-50 relative z-10">
              Upload your PDF document for intelligent content analysis and tag extraction
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 relative ${
                dragActive
                  ? "border-blue-300 bg-blue-25 scale-[1.02]"
                  : "border-blue-200 hover:border-blue-300 hover:bg-blue-25/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors border border-blue-200">
                    <FileText className="h-12 w-12 text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-800 mb-2">Drop your PDF here</p>
                  <p className="text-slate-600 mb-4">
                    or{" "}
                    <Label
                      htmlFor="file-upload"
                      className="text-blue-500 hover:text-blue-600 cursor-pointer underline font-semibold"
                    >
                      browse files
                    </Label>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      PDF only
                    </span>
                    <span>•</span>
                    <span>Max 1MB</span>
                  </div>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Selected File Display */}
            {file && (
              <div className="flex items-center justify-between p-4 bg-emerald-25 rounded-xl border border-emerald-200 animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-full border border-emerald-200">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-emerald-500 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Ready for analysis • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="border-emerald-200 hover:bg-emerald-50 text-emerald-600 bg-transparent"
                >
                  Remove
                </Button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-25">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              onClick={uploadDocument}
              disabled={!file || isLoading || !!error}
              className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold py-4 text-lg shadow-md hover:shadow-lg transition-all duration-300"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Analyzing Document...
                </>
              ) : (
                <>
                  <Brain className="mr-3 h-5 w-5" />
                  Parse & Extract Tags
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border border-indigo-100 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-400 to-blue-500 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <Search className="h-24 w-24" />
            </div>
            <CardTitle className="flex items-center gap-3 relative z-10">
              <Tag className="h-6 w-6" />
              Extracted Topics
            </CardTitle>
            <CardDescription className="text-indigo-50 relative z-10">
              {isLoading ? "AI is processing your document..." : "Intelligent content analysis results"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 min-h-[400px]">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
                  <div className="absolute inset-0 rounded-full border-2 border-blue-100 animate-ping"></div>
                </div>
                <div className="text-center space-y-3">
                  <p className="text-xl font-semibold text-slate-700">Processing Document</p>
                  <p className="text-slate-500">AI is analyzing content and extracting key topics...</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && tags.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                <div className="p-6 bg-slate-50 rounded-full border border-slate-200">
                  <BookOpen className="h-12 w-12 text-slate-300" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-600 mb-2">Ready for Analysis</p>
                  <p className="text-slate-500">Upload a PDF document to extract intelligent tags and topics</p>
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className="text-sm py-2 px-4 bg-gradient-to-r from-blue-25 to-indigo-25 text-blue-600 border border-blue-200 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-default font-medium"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="p-6 bg-gradient-to-r from-blue-25 to-indigo-25 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="h-5 w-5 text-blue-400" />
                    <p className="font-semibold text-blue-600">
                      Analysis Complete: {tags.length} topic{tags.length !== 1 ? "s" : ""} identified
                    </p>
                  </div>
                  <p className="text-blue-500">
                    These tags represent the key concepts, themes, and topics discovered in your document through AI
                    analysis.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
