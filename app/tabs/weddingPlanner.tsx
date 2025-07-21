"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MapPin,
  Search,
  Heart,
  Calendar,
  Users,
  Sparkles,
  Phone,
  Loader2,
  Church,
  Utensils,
  PartyPopper,
  Music,
  Flower,
  DollarSign,
  RefreshCw,
  Camera,
  Cake,
  Gift,
  ExternalLink,
} from "lucide-react"

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
  place_id: string
}

interface VenueInfo {
  name: string
  address: string
  price: string
  website?: string
  phone?: string
}

interface WeddingPlan {
  receptionDinner: VenueInfo
  welcomeParty: VenueInfo
  catering: VenueInfo & { company: string }
  weddingLocations: VenueInfo[]
  receptionLocation: VenueInfo
  afterPartyLocation: VenueInfo
  estimatedBudget?: {
    total: string
    breakdown: {
      ceremony: string
      reception: string
      catering: string
      welcomeParty: string
      afterParty: string
    }
  }
}

const loadingMessages = [
  {
    icon: Heart,
    message: "Finding the perfect venues for your special day...",
    subtext: "Searching through hundreds of romantic locations",
  },
  {
    icon: Church,
    message: "Discovering beautiful ceremony locations...",
    subtext: "Looking for venues that match your style and budget",
  },
  {
    icon: Utensils,
    message: "Curating exceptional catering options...",
    subtext: "Finding caterers known for their exquisite cuisine",
  },
  {
    icon: PartyPopper,
    message: "Planning your welcome party experience...",
    subtext: "Selecting venues perfect for greeting your guests",
  },
  {
    icon: Music,
    message: "Designing your after-party celebration...",
    subtext: "Finding spots to dance the night away",
  },
  {
    icon: Camera,
    message: "Considering photo opportunities...",
    subtext: "Ensuring your venues are picture-perfect",
  },
  {
    icon: DollarSign,
    message: "Calculating budget-friendly options...",
    subtext: "Making sure everything fits within your budget",
  },
  {
    icon: Cake,
    message: "Adding special touches to your day...",
    subtext: "Thinking about those memorable details",
  },
  {
    icon: Gift,
    message: "Putting the finishing touches together...",
    subtext: "Almost ready to present your dream wedding plan",
  },
]

export default function WeddingPlanner() {
  const [searchQuery, setSearchQuery] = useState("")
  const [budget, setBudget] = useState("")
  const [attendees, setAttendees] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [weddingPlan, setWeddingPlan] = useState<WeddingPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [refreshingSection, setRefreshingSection] = useState<string | null>(null)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const debounceRef = useRef<NodeJS.Timeout>(undefined)

  useEffect(() => {
    if (!isGenerating) return

    const interval = setInterval(() => {
      setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length)
    }, 2000) 

    return () => clearInterval(interval)
  }, [isGenerating])

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=5&addressdetails=1`,
      )
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error("Error fetching locations:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (searchQuery) {
        searchLocations(searchQuery)
      } else {
        setSuggestions([])
      }
    }, 100) 

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const handleLocationSelect = (location: LocationSuggestion) => {
    setSelectedLocation(location)
    setSearchQuery(location.display_name)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setSelectedLocation(null)
    setShowSuggestions(true)
  }

  const generateWeddingPlan = async () => {
    if (!selectedLocation) return

    setIsGenerating(true)
    setCurrentLoadingMessage(0) // Reset to first message
    try {
      const response = await fetch("/api/wedding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: selectedLocation.display_name,
          budget: budget ? Number.parseInt(budget.replace(/,/g, "")) : null,
          attendees: attendees ? Number.parseInt(attendees.replace(/,/g, "")) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate wedding plan")
      }

      setWeddingPlan(data)
    } catch (error) {
      console.error("Error generating wedding plan:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const refreshSection = async (sectionType: string, currentContent: VenueInfo | VenueInfo[]) => {
    if (!selectedLocation || !weddingPlan) return

    setRefreshingSection(sectionType)
    try {
      const response = await fetch("/api/wedding/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: selectedLocation.display_name,
          budget: budget ? Number.parseInt(budget.replace(/,/g, "")) : null,
          attendees: attendees ? Number.parseInt(attendees.replace(/,/g, "")) : null,
          sectionType,
          currentContent,
          existingPlan: weddingPlan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh section")
      }

      setWeddingPlan((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          [sectionType]: data.newContent,
        }
      })
    } catch (error) {
      console.error("Error refreshing section:", error)
    } finally {
      setRefreshingSection(null)
    }
  }

  const formatBudget = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const formatAttendees = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBudget(e.target.value)
    setBudget(formatted)
  }

  const handleAttendeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAttendees(e.target.value)
    setAttendees(formatted)
  }

  const VenueCard = ({
    venue,
    icon: Icon,
    title,
    colorClass,
    onRefresh,
    isRefreshing,
  }: {
    venue: VenueInfo | (VenueInfo & { company: string })
    icon: React.ElementType
    title: string
    colorClass: string
    onRefresh: () => void
    isRefreshing: boolean
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`font-bold text-slate-800 flex items-center gap-3 text-lg`}>
          <div className={`p-2 bg-${colorClass}-50 rounded-full border border-${colorClass}-200`}>
            <Icon className={`h-5 w-5 text-${colorClass}-400`} />
          </div>
          {title}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`border-${colorClass}-200 hover:bg-${colorClass}-25 text-${colorClass}-600`}
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>
      <div className={`bg-${colorClass}-25 p-4 rounded-xl border border-${colorClass}-100 space-y-3`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-bold text-lg text-slate-800 mb-1">{"company" in venue ? venue.company : venue.name}</h4>
            <p className="text-slate-600 text-sm mb-2">{venue.address}</p>
            <p className="font-semibold text-slate-800">{venue.price}</p>
          </div>
          {venue.website ? (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-${colorClass}-200 hover:bg-${colorClass}-50 transition-colors text-${colorClass}-600 font-medium`}
            >
              <ExternalLink className="h-4 w-4" />
              Book Now
            </a>
          ) : venue.phone ? (
            <a
              href={`tel:${venue.phone}`}
              className={`flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-${colorClass}-200 hover:bg-${colorClass}-50 transition-colors text-${colorClass}-600 font-medium`}
            >
              <Phone className="h-4 w-4" />
              {venue.phone}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )

  const currentMessage = loadingMessages[currentLoadingMessage]
  const CurrentIcon = currentMessage.icon

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-rose-50 rounded-full border border-rose-200">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Dream Wedding Planner</h2>
        </div>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Create your perfect wedding day with AI-powered venue recommendations, catering options, and complete event
          planning tailored to your chosen location and budget.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Church className="h-4 w-4 text-rose-400" />
            Venues
          </span>
          <span className="flex items-center gap-1">
            <Utensils className="h-4 w-4 text-rose-400" />
            Catering
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-rose-400" />
            Budget Planning
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border border-rose-100 shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="bg-gradient-to-r from-rose-400 to-pink-400 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <Flower className="h-24 w-24" />
            </div>
            <CardTitle className="flex items-center gap-3 relative z-10">
              <Search className="h-6 w-6" />
              Find Your Venue
            </CardTitle>
            <CardDescription className="text-rose-50 relative z-10">
              Search for the perfect location to celebrate your special day
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="location-search" className="text-slate-700 font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-400" />
                Wedding Location
              </Label>
              <div className="relative">
                <Input
                  id="location-search"
                  type="text"
                  placeholder="e.g., Junto Hotel, Napa Valley, Central Park..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  className="pr-12 py-3 text-lg border-rose-200 focus:border-rose-300 focus:ring-rose-300/20 rounded-xl"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-400"></div>
                  ) : (
                    <MapPin className="h-5 w-5 text-rose-300" />
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-rose-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.place_id}
                        className="w-full text-left px-6 py-4 hover:bg-rose-25 border-b border-rose-50 last:border-b-0 transition-colors group/item"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-rose-300 mt-1 flex-shrink-0 group-hover/item:text-rose-400" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {suggestion.display_name.split(",")[0]}
                            </p>
                            <p className="text-sm text-slate-500 truncate">{suggestion.display_name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="budget-input" className="text-slate-700 font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-rose-400" />
                  Budget
                </Label>
                <div className="relative">
                  <Input
                    id="budget-input"
                    type="text"
                    placeholder="50,000"
                    value={budget}
                    onChange={handleBudgetChange}
                    className="pl-8 py-3 text-lg border-rose-200 focus:border-rose-300 focus:ring-rose-300/20 rounded-xl"
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-rose-300" />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="attendees-input" className="text-slate-700 font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-rose-400" />
                  Guests
                </Label>
                <div className="relative">
                  <Input
                    id="attendees-input"
                    type="text"
                    placeholder="150"
                    value={attendees}
                    onChange={handleAttendeesChange}
                    className="pl-8 py-3 text-lg border-rose-200 focus:border-rose-300 focus:ring-rose-300/20 rounded-xl"
                  />
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-rose-300" />
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center">
              AI will tailor recommendations to fit your budget and guest count
            </p>

            {selectedLocation && (
              <div className="p-6 bg-gradient-to-r from-rose-25 to-pink-25 rounded-xl border border-rose-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-50 rounded-full border border-rose-200">
                    <Heart className="h-5 w-5 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 mb-1">Selected Venue Location</p>
                    <p className="text-rose-500 break-words font-medium">{selectedLocation.display_name}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                      {budget && (
                        <span>
                          Budget: <span className="font-semibold">${budget}</span>
                        </span>
                      )}
                      {attendees && (
                        <span>
                          Guests: <span className="font-semibold">{attendees}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Ready to create your dream wedding plan</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={generateWeddingPlan}
              className="w-full bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white font-semibold py-4 text-lg shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
              disabled={!selectedLocation || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Creating Your Dream Plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-5 w-5" />
                  Plan My Perfect Wedding
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-pink-100 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-pink-400 to-rose-400 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <Calendar className="h-24 w-24" />
            </div>
            <CardTitle className="flex items-center gap-3 relative z-10">
              <Calendar className="h-6 w-6" />
              Your Wedding Plan
            </CardTitle>
            <CardDescription className="text-pink-50 relative z-10">
              {isGenerating
                ? "Crafting your perfect wedding day..."
                : "Personalized recommendations for your special day"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 min-h-[500px]">
            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                <div className="relative">
                  <div className="p-6 bg-rose-50 rounded-full border-2 border-rose-200 animate-pulse">
                    <CurrentIcon className="h-16 w-16 text-rose-400 animate-bounce" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-rose-300 animate-ping opacity-30"></div>
                  <div className="absolute inset-2 rounded-full border border-rose-200 animate-pulse"></div>
                </div>

                <div className="text-center space-y-4 max-w-md">
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-slate-800 animate-fade-in">{currentMessage.message}</p>
                    <p className="text-slate-600 animate-fade-in delay-200">{currentMessage.subtext}</p>
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-6">
                    {loadingMessages.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${
                          index === currentLoadingMessage
                            ? "bg-rose-400 scale-125"
                            : index < currentLoadingMessage
                              ? "bg-rose-300"
                              : "bg-rose-100"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="relative h-8 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-rose-300 animate-pulse absolute -translate-x-8" />
                      <Heart className="w-3 h-3 text-rose-400 animate-pulse delay-300 absolute" />
                      <Heart className="w-4 h-4 text-rose-300 animate-pulse delay-700 absolute translate-x-8" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mt-4">
                    This usually takes 15-30 seconds to create the perfect plan...
                  </p>
                </div>
              </div>
            )}

            {!isGenerating && !weddingPlan && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                <div className="p-6 bg-rose-50 rounded-full border border-rose-100">
                  <Heart className="h-12 w-12 text-rose-300" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-600 mb-2">Ready to Plan Your Wedding</p>
                  <p className="text-slate-500">
                    Select your dream location and let AI create the perfect wedding plan
                  </p>
                </div>
              </div>
            )}

            {!isGenerating && weddingPlan && (
              <div className="space-y-6">
                {weddingPlan.estimatedBudget && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg">
                      <div className="p-2 bg-green-50 rounded-full border border-green-200">
                        <DollarSign className="h-5 w-5 text-green-500" />
                      </div>
                      Budget Breakdown
                    </h3>
                    <div className="bg-green-25 p-4 rounded-xl border border-green-100">
                      <p className="font-semibold text-lg text-slate-800 mb-3">
                        Total Estimated: {weddingPlan.estimatedBudget.total}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Ceremony:</span>
                          <span className="font-medium">{weddingPlan.estimatedBudget.breakdown.ceremony}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Reception:</span>
                          <span className="font-medium">{weddingPlan.estimatedBudget.breakdown.reception}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Catering:</span>
                          <span className="font-medium">{weddingPlan.estimatedBudget.breakdown.catering}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Welcome Party:</span>
                          <span className="font-medium">{weddingPlan.estimatedBudget.breakdown.welcomeParty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <VenueCard
                  venue={weddingPlan.receptionDinner}
                  icon={Utensils}
                  title="Reception Dinner"
                  colorClass="blue"
                  onRefresh={() => refreshSection("receptionDinner", weddingPlan.receptionDinner)}
                  isRefreshing={refreshingSection === "receptionDinner"}
                />

                <VenueCard
                  venue={weddingPlan.welcomeParty}
                  icon={PartyPopper}
                  title="Welcome Party"
                  colorClass="purple"
                  onRefresh={() => refreshSection("welcomeParty", weddingPlan.welcomeParty)}
                  isRefreshing={refreshingSection === "welcomeParty"}
                />

                <VenueCard
                  venue={weddingPlan.catering}
                  icon={Utensils}
                  title="Catering Services"
                  colorClass="rose"
                  onRefresh={() => refreshSection("catering", weddingPlan.catering)}
                  isRefreshing={refreshingSection === "catering"}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg">
                      <div className="p-2 bg-emerald-50 rounded-full border border-emerald-200">
                        <Church className="h-5 w-5 text-emerald-400" />
                      </div>
                      Ceremony Venues
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshSection("weddingLocations", weddingPlan.weddingLocations)}
                      disabled={refreshingSection === "weddingLocations"}
                      className="border-emerald-200 hover:bg-emerald-25 text-emerald-600"
                    >
                      {refreshingSection === "weddingLocations" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {weddingPlan.weddingLocations.map((location, index) => (
                      <div key={index} className="bg-emerald-25 p-4 rounded-xl border border-emerald-100 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-slate-800 mb-1">{location.name}</h4>
                            <p className="text-slate-600 text-sm mb-2">{location.address}</p>
                            <p className="font-semibold text-slate-800">{location.price}</p>
                          </div>
                          {location.website ? (
                            <a
                              href={location.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-emerald-200 hover:bg-emerald-50 transition-colors text-emerald-600 font-medium"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Book Now
                            </a>
                          ) : location.phone ? (
                            <a
                              href={`tel:${location.phone}`}
                              className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-emerald-200 hover:bg-emerald-50 transition-colors text-emerald-600 font-medium"
                            >
                              <Phone className="h-4 w-4" />
                              {location.phone}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <VenueCard
                  venue={weddingPlan.receptionLocation}
                  icon={Users}
                  title="Reception Venue"
                  colorClass="amber"
                  onRefresh={() => refreshSection("receptionLocation", weddingPlan.receptionLocation)}
                  isRefreshing={refreshingSection === "receptionLocation"}
                />

                <VenueCard
                  venue={weddingPlan.afterPartyLocation}
                  icon={Music}
                  title="After Party"
                  colorClass="indigo"
                  onRefresh={() => refreshSection("afterPartyLocation", weddingPlan.afterPartyLocation)}
                  isRefreshing={refreshingSection === "afterPartyLocation"}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
