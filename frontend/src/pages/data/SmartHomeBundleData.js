export const SMART_HOME_BUNDLES = [
  {
    id: "sh-01",
    name: "Complete Home Automation",
    tagline: "The full ecosystem. Every room, every device, one app.",
    category: "Full Home Automation",
    ecosystems: ["Amazon Alexa", "Google Home"],
    homeSizes: ["3 BHK", "4+ BHK / Villa"],
    priceFrom: 249000,
    installTime: "5–7 days",
    deviceCount: 42,
    coverage: "Whole Home",
    warranty: "3 Years",
    devices: [
      { icon: "lightbulb", label: "Smart Lighting", count: 18 },
      { icon: "lock", label: "Smart Locks", count: 3 },
      { icon: "camera", label: "Security Cameras", count: 6 },
      { icon: "thermostat", label: "Climate Control", count: 4 },
      { icon: "speaker", label: "Voice Hubs", count: 4 },
      { icon: "curtain", label: "Motorized Blinds", count: 7 }
    ],
    features: [
      "Room-by-room voice & app control",
      "Auto scenes: Morning, Movie, Sleep, Away",
      "Geo-fenced arm/disarm on arrival",
      "Energy dashboard with real-time savings",
      "Guest access with time-limited codes",
      "Integration with existing appliances"
    ],
    brands: ["Philips Hue", "Yale", "Bosch", "Sonos", "Xiaomi"]
  },
  {
    id: "sh-02",
    name: "Security & Surveillance Pro",
    tagline: "Total awareness. Zero blind spots. Peace of mind, 24/7.",
    category: "Security & Surveillance",
    ecosystems: ["Amazon Alexa", "Apple HomeKit", "Samsung SmartThings"],
    homeSizes: ["1-2 BHK", "3 BHK", "4+ BHK / Villa"],
    priceFrom: 89000,
    installTime: "2–3 days",
    deviceCount: 14,
    coverage: "All Access Points",
    warranty: "2 Years",
    devices: [
      { icon: "camera", label: "4K Cameras", count: 6 },
      { icon: "lock", label: "Smart Deadbolts", count: 2 },
      { icon: "shield", label: "Motion Sensors", count: 4 },
      { icon: "bell", label: "Video Doorbell", count: 1 },
      { icon: "siren", label: "Alarm System", count: 1 }
    ],
    features: [
      "24/7 cloud recording with 30-day storage",
      "AI person, package & vehicle detection",
      "Two-way audio with mobile alerts",
      "Auto-lock doors after set time",
      "Panic button integration",
      "Night vision + weatherproof cameras"
    ],
    brands: ["Yale", "Godrej", "Hikvision", "Ring"]
  },
  {
    id: "sh-03",
    name: "Lighting & Ambience Suite",
    tagline: "16 million colors. Infinite moods. Zero switches.",
    category: "Lighting & Ambience",
    ecosystems: ["Amazon Alexa", "Google Home", "Apple HomeKit"],
    homeSizes: ["1-2 BHK", "3 BHK"],
    priceFrom: 45000,
    installTime: "1–2 days",
    deviceCount: 24,
    coverage: "All Rooms",
    warranty: "2 Years",
    devices: [
      { icon: "lightbulb", label: "Smart Bulbs", count: 18 },
      { icon: "strip", label: "LED Strips", count: 4 },
      { icon: "switch", label: "Smart Switches", count: 6 },
      { icon: "hub", label: "Bridge Hub", count: 1 }
    ],
    features: [
      "16 million colors + tunable white",
      "Circadian rhythm auto-adjust",
      "Scene presets: Focus, Relax, Party, Dinner",
      "Sunrise wake-up simulation",
      "Voice + gesture control ready",
      "Music-sync for entertainment"
    ],
    brands: ["Philips Hue", "Wipro", "Syska", "Nanoleaf"]
  },
  {
    id: "sh-04",
    name: "Climate Comfort System",
    tagline: "The perfect temperature, before you even ask.",
    category: "Climate Control",
    ecosystems: ["Amazon Alexa", "Google Home"],
    homeSizes: ["3 BHK", "4+ BHK / Villa"],
    priceFrom: 68000,
    installTime: "2–3 days",
    deviceCount: 12,
    coverage: "All AC Units",
    warranty: "3 Years",
    devices: [
      { icon: "thermostat", label: "Smart Thermostats", count: 4 },
      { icon: "sensor", label: "Temp Sensors", count: 6 },
      { icon: "fan", label: "Smart Fans", count: 2 }
    ],
    features: [
      "Room-wise temperature learning",
      "Geo-fenced pre-cooling on arrival",
      "Weather-adaptive scheduling",
      "Up to 30% energy savings",
      "Multi-zone control from single app",
      "Integration with any AC brand"
    ],
    brands: ["Cielo", "Sensibo", "Tado", "Daikin"]
  },
  {
    id: "sh-05",
    name: "Entertainment Suite",
    tagline: "Cinema, concert hall, and gaming lounge — in one command.",
    category: "Entertainment",
    ecosystems: ["Amazon Alexa", "Google Home", "Apple HomeKit"],
    homeSizes: ["3 BHK", "4+ BHK / Villa"],
    priceFrom: 175000,
    installTime: "3–4 days",
    deviceCount: 16,
    coverage: "Living + Bedrooms",
    warranty: "3 Years",
    devices: [
      { icon: "speaker", label: "Wireless Speakers", count: 8 },
      { icon: "tv", label: "Smart TV Setup", count: 2 },
      { icon: "projector", label: "4K Projector", count: 1 },
      { icon: "hub", label: "Media Hubs", count: 5 }
    ],
    features: [
      "Multi-room synchronized audio",
      "One-tap movie mode: dim, cool, play",
      "Voice-controlled Netflix, Prime, YouTube",
      "Dolby Atmos surround sound",
      "Gaming console integration",
      "Party mode with music sync lights"
    ],
    brands: ["Sonos", "Bose", "Samsung", "LG", "Denon"]
  },
  {
    id: "sh-06",
    name: "Starter Smart Kit",
    tagline: "Everything you need to begin. Nothing you don't.",
    category: "Full Home Automation",
    ecosystems: ["Amazon Alexa", "Google Home"],
    homeSizes: ["1-2 BHK"],
    priceFrom: 32000,
    installTime: "1 day",
    deviceCount: 10,
    coverage: "Essential Rooms",
    warranty: "2 Years",
    devices: [
      { icon: "speaker", label: "Voice Hub", count: 1 },
      { icon: "lightbulb", label: "Smart Bulbs", count: 6 },
      { icon: "lock", label: "Smart Lock", count: 1 },
      { icon: "camera", label: "Indoor Camera", count: 1 },
      { icon: "plug", label: "Smart Plugs", count: 1 }
    ],
    features: [
      "Perfect first step into smart living",
      "Voice control for lights & lock",
      "Live indoor camera monitoring",
      "App-based scheduling",
      "Easy DIY expansion later",
      "Free 1-hour onboarding session"
    ],
    brands: ["Amazon Echo", "Wipro", "Godrej", "TP-Link"]
  }
];