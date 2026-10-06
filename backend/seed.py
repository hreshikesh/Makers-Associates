"""Seed the ConstructONS database with premium sample content.
All images are curated luxury architecture photos from Unsplash.
"""
import asyncio
from db import db
from models import (
    Home, Package, PackageSection, Testimonial, FAQ, Blog,
    MarketplaceCategory, FinancialService, TeamMember, AIPlatformModule,
    JourneyStep, HeroSection, MediaItem, ComparisonRow, StatItem,
    SiteSettings, FloorPlanArea, now_iso
)

# --- Curated Unsplash images (premium architecture) ---
IMG_HERO_VILLA = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80"

HOME_IMAGES = {
    # Verified pool-free front elevations. Admins can override any of these via
    # Admin Panel → Homes → Edit → Cover Image URL / Gallery.
    "modern_aura": [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80",
    ],
    "classic_elite": [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80",
    ],
    "urban_nest": [
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    ],
    "sky_villa": [
        "https://images.unsplash.com/photo-1600585153490-76fb20a32601?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80",
    ],
    "luxury_duplex": [
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80",
    ],
    "premium_villa": [
        "https://images.unsplash.com/photo-1600585153490-76fb20a32601?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80",
    ],
}

FLOORPLAN_IMG = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80"

AVATAR_IMAGES = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
]

MARKETPLACE_IMGS = {
    "materials": "https://images.unsplash.com/photo-1541123356219-284ebe98ae3b?auto=format&fit=crop&w=1200&q=80",
    "equipment": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
    "contractors": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    "architects": "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1200&q=80",
    "engineers": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    "interior": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
    "smart_home": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    "landscaping": "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1200&q=80",
}
AI_MODULE_IMAGES = {
  "ai-workspace":       "https://res.cloudinary.com/k4uklwi4/image/upload/v1788777738/Screenshot_2026-09-07_160421_ovntod.jpg",
  "project-management": "https://res.cloudinary.com/k4uklwi4/image/upload/v1788777739/Screenshot_2026-09-07_160540_w0rzap.jpg",
  "site-management":    "https://res.cloudinary.com/k4uklwi4/image/upload/v1788777739/Screenshot_2026-09-07_160728_mqj8oy.jpg",
  "documents":          "https://res.cloudinary.com/k4uklwi4/image/upload/v1788777738/Screenshot_2026-09-07_160821_j9ix4v.jpg",
  "finance":            "https://res.cloudinary.com/k4uklwi4/image/upload/v1788777739/Screenshot_2026-09-07_161000_twxbtw.jpg",
  "crm":                "https://res.cloudinary.com/k4uklwi4/image/upload/v1788777739/Screenshot_2026-09-07_160907_lc7tal.jpg",
  "enterprise":         "https://res.cloudinary.com/k4uklwi4/image/upload/v1788777739/Screenshot_2026-09-07_161032_uqf2iq.jpg",
};

JOURNEY_IMAGES = [
    "https://res.cloudinary.com/yavvnb6s/image/upload/v1788785519/b24cad4f-6f38-4b21-ba3c-4df5b82c5b21.png",
    "https://res.cloudinary.com/yavvnb6s/image/upload/v1788785583/6346b918-33f9-4091-a84f-ea6305614647.png",
    "https://res.cloudinary.com/yavvnb6s/image/upload/v1788785652/935475f7-d4d9-4a94-a703-0c50ddc8f293.png",
    "https://res.cloudinary.com/yavvnb6s/image/upload/v1788785744/cf50e490-5052-4d33-91b3-5cb01d1b0f0c.png",
    "https://res.cloudinary.com/yavvnb6s/image/upload/v1788785775/c9a2ec26-fbf9-4ddf-8d7c-cb8b9a869734.png",
    "https://res.cloudinary.com/yavvnb6s/image/upload/v1788785850/4165cf33-b0de-4f99-8c1c-207cb33748d7.png",
    "https://res.cloudinary.com/yavvnb6s/image/upload/v1788785885/d2380a04-a9b8-40d8-9432-13cee6fe55db.png",
    "https://res.cloudinary.com/yavvnb6s/image/upload/v1788785936/78f7a88d-4ff3-4916-a4b8-2eda299240b7.png",
]

async def _reset(collection):
    await db[collection].delete_many({})


async def seed_all():
    # -------- Site Settings --------
    await _reset("site_settings")
    settings = SiteSettings(
        company_name="ConstructONS",
        tagline="Everything Construction. Always On.",
        phone="+91 98765 43210",
        whatsapp="+91 98765 43210",
        email="hello@constructons.in",
        address="12th Floor, Prestige Tower, MG Road, Bangalore 560001, India",
        google_maps_embed="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.7196744857637!2d77.60423!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sMG%20Road%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1710000000000",
        social_links={
            "facebook": "https://facebook.com/constructons",
            "twitter": "https://twitter.com/constructons",
            "instagram": "https://instagram.com/constructons",
            "linkedin": "https://linkedin.com/company/constructons",
            "youtube": "https://youtube.com/@constructons",
        },
        footer_note="Made with ❤ in India",
    )
    await db.site_settings.insert_one(settings.model_dump())

    # -------- Hero --------
    await _reset("hero_sections")
    hero = HeroSection(
        key="home_hero",
        eyebrow="AI-Powered Home Construction",
        headline="Build Your Dream Home with",
        headline_highlight="AI-Powered Construction",
        subheading="From design to handover, experience transparent construction with standardized packages, live tracking and intelligent project management.",
        background_image=IMG_HERO_VILLA,
        primary_cta_label="Explore Home Collection",
        primary_cta_link="#home-collection",
        secondary_cta_label="Get Free Consultation",
        secondary_cta_link="#contact",
        stats=[
            {"label": "Transparent Pricing", "value": "100%"},
            {"label": "On-Time Delivery", "value": "98%"},
            {"label": "AI Live Tracking", "value": "24/7"},
            {"label": "Year Warranty", "value": "10"},
        ],
        sort_order=1,
    )
    await db.hero_sections.insert_one(hero.model_dump())

    # -------- Homes --------
    await _reset("homes")
    homes_data = [
        dict(
            name="Modern Aura",
            slug="modern-aura",
            style="Modern",
            area_sqft="1,850 Sq.ft",
            dimensions="30' x 60'",
            bedrooms=3, bathrooms=3, floors=2, parking=2,
            estimated_cost="From ₹40.68 Lakhs",
            package_compatibility=["Basic", "Essential", "Standard", "Premium"],
            cover_image=HOME_IMAGES["modern_aura"][0],
            gallery=HOME_IMAGES["modern_aura"],
            floorplan_image=FLOORPLAN_IMG,
            floor_areas=[
                FloorPlanArea(label="Living Room", area="320 Sq.ft").model_dump(),
                FloorPlanArea(label="Master Bedroom", area="240 Sq.ft").model_dump(),
                FloorPlanArea(label="Kitchen + Dining", area="220 Sq.ft").model_dump(),
                FloorPlanArea(label="Balcony", area="90 Sq.ft").model_dump(),
            ],
            tagline="A minimalist marvel with panoramic windows and open-plan living.",
            description="Modern Aura is designed for young families who love clean lines, natural light and effortless flow between spaces. Every detail is crafted with premium materials and AI-optimized layouts, delivered in 8 months.",
            features=[
                "Double-height living room", "Home office nook",
                "Smart lighting ready", "Solar-ready roof",
                "Rainwater harvesting", "EV charging point",
            ],
            sort_order=1,
        ),
        dict(
            name="Classic Elite",
            slug="classic-elite",
            style="Classic",
            area_sqft="2,400 Sq.ft",
            dimensions="40' x 60'",
            bedrooms=4, bathrooms=4, floors=2, parking=2,
            estimated_cost="From ₹56.20 Lakhs",
            package_compatibility=["Essential", "Standard", "Premium"],
            cover_image=HOME_IMAGES["classic_elite"][0],
            gallery=HOME_IMAGES["classic_elite"],
            floorplan_image=FLOORPLAN_IMG,
            floor_areas=[
                FloorPlanArea(label="Living Room", area="380 Sq.ft").model_dump(),
                FloorPlanArea(label="Master Suite", area="320 Sq.ft").model_dump(),
                FloorPlanArea(label="Home Theatre", area="220 Sq.ft").model_dump(),
                FloorPlanArea(label="Garden Deck", area="180 Sq.ft").model_dump(),
            ],
            tagline="Timeless architecture. Elevated living. Built to endure generations.",
            description="Classic Elite combines heritage-inspired proportions with contemporary comforts. Perfect for growing families who value craftsmanship and enduring style.",
            features=[
                "Grand foyer", "Formal dining", "Puja room (Vastu)",
                "Servant quarter", "Landscaped garden", "Home theatre",
            ],
            sort_order=2,
        ),
        dict(
            name="Urban Nest",
            slug="urban-nest",
            style="Contemporary",
            area_sqft="1,600 Sq.ft",
            dimensions="25' x 50'",
            bedrooms=3, bathrooms=3, floors=1, parking=1,
            estimated_cost="From ₹35.20 Lakhs",
            package_compatibility=["Basic", "Essential", "Standard"],
            cover_image=HOME_IMAGES["urban_nest"][0],
            gallery=HOME_IMAGES["urban_nest"],
            floorplan_image=FLOORPLAN_IMG,
            floor_areas=[
                FloorPlanArea(label="Living + Dining", area="360 Sq.ft").model_dump(),
                FloorPlanArea(label="Master Bedroom", area="200 Sq.ft").model_dump(),
                FloorPlanArea(label="Kitchen", area="140 Sq.ft").model_dump(),
                FloorPlanArea(label="Utility", area="60 Sq.ft").model_dump(),
            ],
            tagline="Compact by design. Boundless in comfort.",
            description="Urban Nest is engineered for the modern Indian metro plot, offering premium living within efficient dimensions. Ideal for first-time home builders.",
            features=[
                "Vaastu-compliant layout", "Modular kitchen",
                "Pooja niche", "Utility yard", "Terrace garden ready",
            ],
            sort_order=3,
        ),
        dict(
            name="Sky Villa",
            slug="sky-villa",
            style="Luxury",
            area_sqft="3,200 Sq.ft",
            dimensions="50' x 70'",
            bedrooms=4, bathrooms=5, floors=2, parking=3,
            estimated_cost="From ₹79.90 Lakhs",
            package_compatibility=["Standard", "Premium"],
            cover_image=HOME_IMAGES["sky_villa"][0],
            gallery=HOME_IMAGES["sky_villa"],
            floorplan_image=FLOORPLAN_IMG,
            floor_areas=[
                FloorPlanArea(label="Grand Living", area="520 Sq.ft").model_dump(),
                FloorPlanArea(label="Master Suite", area="380 Sq.ft").model_dump(),
                FloorPlanArea(label="Sky Deck", area="260 Sq.ft").model_dump(),
                FloorPlanArea(label="Pool Deck", area="220 Sq.ft").model_dump(),
            ],
            tagline="A statement villa in the sky. Panoramic. Private. Poetic.",
            description="Sky Villa reimagines luxury with a rooftop infinity deck, private plunge pool, and glass-wrapped living pavilion. Built for those who refuse the ordinary.",
            features=[
                "Rooftop infinity deck", "Plunge pool", "Smart home suite",
                "Wine cellar", "Home gym", "Chauffeur quarter",
            ],
            sort_order=4,
        ),
        dict(
            name="Luxury Duplex",
            slug="luxury-duplex",
            style="Duplex",
            area_sqft="2,000 Sq.ft",
            dimensions="30' x 50'",
            bedrooms=4, bathrooms=4, floors=2, parking=2,
            estimated_cost="From ₹49.50 Lakhs",
            package_compatibility=["Essential", "Standard", "Premium"],
            cover_image=HOME_IMAGES["luxury_duplex"][0],
            gallery=HOME_IMAGES["luxury_duplex"],
            floorplan_image=FLOORPLAN_IMG,
            floor_areas=[
                FloorPlanArea(label="Living Room", area="340 Sq.ft").model_dump(),
                FloorPlanArea(label="Master + Kids", area="440 Sq.ft").model_dump(),
                FloorPlanArea(label="Family Lounge", area="260 Sq.ft").model_dump(),
                FloorPlanArea(label="Terrace", area="180 Sq.ft").model_dump(),
            ],
            tagline="Two floors of curated elegance. One unforgettable home.",
            description="Luxury Duplex offers vertical space for privacy and togetherness. Elegant staircase, family lounge on the first floor, and a lush terrace to unwind.",
            features=[
                "Sculptural staircase", "Family lounge",
                "Study room", "Landscaped terrace", "Smart AC-ready",
            ],
            sort_order=5,
        ),
        dict(
            name="Premium Villa",
            slug="premium-villa",
            style="Villa",
            area_sqft="4,000 Sq.ft",
            dimensions="60' x 80'",
            bedrooms=5, bathrooms=6, floors=2, parking=4,
            estimated_cost="Custom Quote",
            package_compatibility=["Premium"],
            cover_image=HOME_IMAGES["premium_villa"][0],
            gallery=HOME_IMAGES["premium_villa"],
            floorplan_image=FLOORPLAN_IMG,
            floor_areas=[
                FloorPlanArea(label="Foyer + Living", area="640 Sq.ft").model_dump(),
                FloorPlanArea(label="Owner's Suite", area="520 Sq.ft").model_dump(),
                FloorPlanArea(label="Pool + Deck", area="380 Sq.ft").model_dump(),
                FloorPlanArea(label="Landscape", area="500 Sq.ft").model_dump(),
            ],
            tagline="Bespoke luxury. Uncompromising craft. Fully personalized.",
            description="Premium Villa is a curated experience — architect-led design, hand-picked materials, and a dedicated project maestro. For the connoisseur of fine living.",
            features=[
                "Private pool", "Home cinema", "Wine lounge",
                "Landscaped garden", "Smart home automation", "Solar + battery",
            ],
            sort_order=6,
        ),
    ]
    for i, h in enumerate(homes_data):
        home = Home(**h)
        await db.homes.insert_one(home.model_dump())

    # -------- Packages --------
    await _reset("packages")
    from package_data import PACKAGES_DETAILED

    common_sections = lambda tier: [
        PackageSection(title="Overview", items=[
            f"{tier} tier construction with transparent pricing",
            "Standardized specifications & materials",
            "Dedicated project manager",
            "AI-powered live tracking",
        ]).model_dump(),
        PackageSection(title="Materials", items=[
            "TMT Steel: Fe-500D grade",
            "Cement: 53 grade OPC / PPC",
            "Bricks: Red clay / AAC blocks",
            "Waterproofing: Chemical solution",
        ]).model_dump(),
        PackageSection(title="Specifications", items=[
            "Wall finish: Premium putty + emulsion",
            "Flooring: Vitrified tiles 800x800mm",
            "Doors: Engineered wood + laminate",
            "Windows: UPVC / Aluminum sliding",
        ]).model_dump(),
        PackageSection(title="Warranty", items=[
            "Structural warranty",
            "Plumbing & electrical support",
            "Free defect resolution",
        ]).model_dump(),
        PackageSection(title="Timeline", items=[
            "8–10 months completion",
            "Weekly progress reports",
            "Live milestone tracking",
        ]).model_dump(),
        PackageSection(title="Quality", items=[
            "150+ quality checkpoints",
            "Third-party audit reports",
            "Site visits with expert",
        ]).model_dump(),
        PackageSection(title="AI Features", items=[
            "AI Assistant on WhatsApp",
            "Live progress dashboard",
            "Cost tracker & alerts",
            "Digital document vault",
        ]).model_dump(),
    ]

    def _detail(slug):
        d = next((d for d in PACKAGES_DETAILED if d["slug"] == slug), {})
        # remove slug from spread — it's already set in outer dict
        return {k: v for k, v in d.items() if k != "slug"}

    packages_data = [
        dict(
            name="Basic Package",
            slug="basic", tier="basic",
            price_display="₹1,499", price_unit="/Sq.ft",
            tagline="Smart & Affordable",
            description="Perfect for budget-conscious home owners who want quality with transparency.",
            highlights=[
                "Standard Quality Materials",
                "Standard Finishes",
                "Project Supervision",
                "10 Year Warranty",
            ],
            sections=common_sections("Basic"),
            is_most_popular=False, accent_color="#22C55E", sort_order=1,
            **_detail("basic"),
        ),
        dict(
            name="Essential Package",
            slug="essential", tier="essential",
            price_display="₹1,799", price_unit="/Sq.ft",
            tagline="Perfect Balance",
            description="Best combination of quality and value with premium finishes.",
            highlights=[
                "Better Quality Materials",
                "Premium Finishes",
                "Live Project Tracking",
                "10 Year Warranty",
            ],
            sections=common_sections("Essential"),
            is_most_popular=True, accent_color="#0B1220", sort_order=2,
            **_detail("essential"),
        ),
        dict(
            name="Standard Package",
            slug="standard", tier="standard",
            price_display="₹2,199", price_unit="/Sq.ft",
            tagline="Premium Value",
            description="Premium construction with advanced features and designer finishes.",
            highlights=[
                "Premium Quality Materials",
                "Designer Finishes",
                "Dedicated PM",
                "10 Year Warranty",
            ],
            sections=common_sections("Standard"),
            is_most_popular=False, accent_color="#FF5A00", sort_order=3,
            **_detail("standard"),
        ),
        dict(
            name="Premium Package",
            slug="premium", tier="premium",
            price_display="Custom Quote", price_unit="",
            tagline="Bespoke Luxury",
            description="Fully customized to your lifestyle and requirements. Every detail crafted for you.",
            highlights=[
                "Custom Design & Planning",
                "Luxury Materials",
                "Smart Home Integration",
                "10 Year Warranty",
            ],
            sections=common_sections("Premium"),
            is_most_popular=False, accent_color="#7C3AED",
            cta_label="Get Custom Quote", sort_order=4,
            **_detail("premium"),
        ),
    ]
    for p in packages_data:
        await db.packages.insert_one(Package(**p).model_dump())

    # -------- AI Platform Modules --------
# -------- AI Platform Modules --------
    await _reset("ai_modules")
    ai_modules = [
    {"name": "AI Workspace",        "slug": "ai-workspace",       "icon": "Bot",       "tagline": "Your intelligent construction assistant",           "description": "Ask anything about your project — AI understands your timeline, budget, and site status."},
    {"name": "Project Management",  "slug": "project-management", "icon": "LayoutDashboard","tagline": "Plan, track & manage every task",                    "description": "Milestones, Gantt views, resource allocation, and AI-driven risk alerts."},
    {"name": "Site Management",     "slug": "site-management",    "icon": "HardHat",        "tagline": "Monitor site, labor, materials & more",              "description": "Daily site logs, labor attendance, material dispatch tracking."},
    {"name": "Documents",           "slug": "documents",          "icon": "FileText",       "tagline": "All documents in one secure place",                  "description": "Contracts, approvals, invoices, warranties — instantly searchable."},
    {"name": "Finance",             "slug": "finance",            "icon": "Wallet",         "tagline": "Track costs, invoices & payments",                   "description": "Live cost vs. budget, invoice approvals, escrow tracking."},
    {"name": "CRM",                 "slug": "crm",                "icon": "Users",          "tagline": "Manage leads, customers & sales",                    "description": "For our partners: unified customer conversations across channels."},
    {"name": "Enterprise",          "slug": "enterprise",         "icon": "Building2",      "tagline": "Scalable solutions for construction businesses",     "description": "Multi-project, multi-user, roles, audit logs, and analytics."},
]
    for i, m in enumerate(ai_modules):
        m["sort_order"] = i + 1
        m["image"] = AI_MODULE_IMAGES.get(m["slug"], "")   # ← NEW LINE
        await db.ai_modules.insert_one(AIPlatformModule(**m).model_dump())

    # -------- Marketplace --------
    await _reset("marketplace_categories")
    marketplace = [
        {"name": "Materials", "slug": "materials", "description": "Best quality building materials at transparent prices.", "image": MARKETPLACE_IMGS["materials"], "icon": "Package", "coming_soon": False},
        {"name": "Equipment", "slug": "equipment", "description": "Construction equipment on rent or sale.", "image": MARKETPLACE_IMGS["equipment"], "icon": "Truck", "coming_soon": False},
        {"name": "Contractors", "slug": "contractors", "description": "Verified & experienced construction contractors.", "image": MARKETPLACE_IMGS["contractors"], "icon": "HardHat", "coming_soon": False},
        {"name": "Architects", "slug": "architects", "description": "Award-winning residential architects near you.", "image": MARKETPLACE_IMGS["architects"], "icon": "PenTool", "coming_soon": False},
        {"name": "Engineers", "slug": "engineers", "description": "Structural, MEP & site engineers verified by us.", "image": MARKETPLACE_IMGS["engineers"], "icon": "Ruler", "coming_soon": True},
        {"name": "Interior Designers", "slug": "interior", "description": "Home interiors & modular solutions.", "image": MARKETPLACE_IMGS["interior"], "icon": "Sofa", "coming_soon": False},
        {"name": "Smart Home", "slug": "smart-home", "description": "Smart home devices & automation.", "image": MARKETPLACE_IMGS["smart_home"], "icon": "Cpu", "coming_soon": True},
        {"name": "Landscaping", "slug": "landscaping", "description": "Landscape & outdoor design.", "image": MARKETPLACE_IMGS["landscaping"], "icon": "Trees", "coming_soon": True},
    ]
    for i, m in enumerate(marketplace):
        m["sort_order"] = i + 1
        await db.marketplace_categories.insert_one(MarketplaceCategory(**m).model_dump())

    # -------- Financial Services --------
    await _reset("financial_services")
    finserv = [
        {"name": "PayLater", "slug": "paylater", "tagline": "Build now, pay later with flexible EMIs", "description": "Split your construction payments across the build timeline with zero-cost EMIs.", "icon": "CreditCard", "features": ["Zero-cost EMIs", "Instant approval", "No prepayment penalty"], "coming_soon": False},
        {"name": "Construction Loan", "slug": "loans", "tagline": "Home construction loans at best rates", "description": "Partnered with top banks & NBFCs to get you the best interest rates.", "icon": "Landmark", "features": ["Rates from 8.5%", "Up to ₹2 Cr", "Digital approval"], "coming_soon": False},
        {"name": "Insurance", "slug": "insurance", "tagline": "Protect your home and your investment", "description": "Comprehensive coverage during construction and beyond.", "icon": "ShieldCheck", "features": ["Construction cover", "Home & contents", "10-year structural"], "coming_soon": False},
        {"name": "Payment Gateway", "slug": "payment-gateway", "tagline": "Secure & seamless online payments", "description": "Escrow-backed, milestone-based payments to your contractor.", "icon": "Banknote", "features": ["Milestone escrow", "UPI + Cards", "Instant receipts"], "coming_soon": False},
    ]
    for i, f in enumerate(finserv):
        f["sort_order"] = i + 1
        await db.financial_services.insert_one(FinancialService(**f).model_dump())

    # -------- Comparison --------
    await _reset("comparison")
    rows = [
        {"feature": "Transparent Pricing", "traditional": "No fixed pricing", "constructons": "Transparent package pricing", "traditional_positive": False, "constructons_positive": True},
        {"feature": "AI Tracking", "traditional": "No live tracking", "constructons": "AI-powered live tracking", "traditional_positive": False, "constructons_positive": True},
        {"feature": "Digital Documents", "traditional": "Paper based documents", "constructons": "Digital documents", "traditional_positive": False, "constructons_positive": True},
        {"feature": "Quality Monitoring", "traditional": "Manual updates", "constructons": "Real-time updates", "traditional_positive": False, "constructons_positive": True},
        {"feature": "Customer Dashboard", "traditional": "No dashboard", "constructons": "On-time delivery guarantee", "traditional_positive": False, "constructons_positive": True},
        {"feature": "Live Progress", "traditional": "Delays & cost overrun", "constructons": "Live milestone tracking", "traditional_positive": False, "constructons_positive": True},
        {"feature": "Warranty", "traditional": "Limited after-sales", "constructons": "10 year warranty", "traditional_positive": False, "constructons_positive": True},
        {"feature": "Technology", "traditional": "None", "constructons": "AI + IoT + Cloud", "traditional_positive": False, "constructons_positive": True},
    ]
    for i, r in enumerate(rows):
        r["sort_order"] = i + 1
        await db.comparison.insert_one(ComparisonRow(**r).model_dump())

    # -------- Stats --------
    await _reset("stats")
    stats = [
        {"label": "Homes Planned", "value": "250+", "icon": "Home"},
        {"label": "Years Experience", "value": "10+", "icon": "Award"},
        {"label": "On-Time Delivery", "value": "98%", "icon": "Clock"},
        {"label": "Expert Professionals", "value": "50+", "icon": "Users"},
    ]
    for i, s in enumerate(stats):
        s["sort_order"] = i + 1
        await db.stats.insert_one(StatItem(**s).model_dump())

    # -------- Journey --------
    await _reset("journey_steps")
    journey = [
    {
        "step_no": 1,
        "name": "Choose Home",
        "description": "Select from our ready-to-build home collection.",
        "icon": "Home",
        "image": JOURNEY_IMAGES[0],
    },
    {
        "step_no": 2,
        "name": "Choose Package",
        "description": "Pick the construction package that fits your lifestyle.",
        "icon": "Package",
        "image": JOURNEY_IMAGES[1],
    },
    {
        "step_no": 3,
        "name": "Consultation",
        "description": "Get a free consultation and detailed site evaluation.",
        "icon": "MessageSquare",
        "image": JOURNEY_IMAGES[2],
    },
    {
        "step_no": 4,
        "name": "Design & Planning",
        "description": "Finalize your design with detailed plans and 3D visuals.",
        "icon": "PenTool",
        "image": JOURNEY_IMAGES[3],
    },
    {
        "step_no": 5,
        "name": "Construction",
        "description": "Your home takes shape with controlled execution and quality checks.",
        "icon": "HardHat",
        "image": JOURNEY_IMAGES[4],
    },
    {
        "step_no": 6,
        "name": "Live Tracking",
        "description": "Monitor construction progress, milestones and updates in real time.",
        "icon": "Activity",
        "image": JOURNEY_IMAGES[5],
    },
    {
        "step_no": 7,
        "name": "Handover",
        "description": "Receive your completed home with complete documentation.",
        "icon": "KeyRound",
        "image": JOURNEY_IMAGES[6],
    },
    {
        "step_no": 8,
        "name": "Warranty & Support",
        "description": "Our relationship continues even after you receive the keys.",
        "icon": "ShieldCheck",
        "image": JOURNEY_IMAGES[7],
    },
]
    for j in journey:
        j["sort_order"] = j["step_no"]
        await db.journey_steps.insert_one(JourneyStep(**j).model_dump())

    # -------- Testimonials --------
    await _reset("testimonials")
    testimonials = [
        {"customer_name": "Ramesh & Priya", "location": "Hyderabad", "quote": "The transparency & live tracking made our construction journey stress-free. Highly recommend ConstructONS!", "rating": 5, "avatar": AVATAR_IMAGES[0], "home_purchased": "Modern Aura"},
        {"customer_name": "Kiran Kumar", "location": "Bangalore", "quote": "Excellent quality and on-time delivery. The AI dashboard is a game-changer!", "rating": 5, "avatar": AVATAR_IMAGES[1], "home_purchased": "Classic Elite"},
        {"customer_name": "Anita Sharma", "location": "Pune", "quote": "Professional team, premium quality, and great support throughout. Our Sky Villa is a dream.", "rating": 5, "avatar": AVATAR_IMAGES[2], "home_purchased": "Sky Villa"},
        {"customer_name": "Rohit Verma", "location": "Chennai", "quote": "Best decision we made. The floor plan is exactly what we wanted and the pricing was crystal clear.", "rating": 5, "avatar": AVATAR_IMAGES[3], "home_purchased": "Urban Nest"},
        {"customer_name": "Sneha Iyer", "location": "Mumbai", "quote": "ConstructONS delivered our duplex on time and within budget. The whole family loves it.", "rating": 5, "avatar": AVATAR_IMAGES[4], "home_purchased": "Luxury Duplex"},
    ]
    for i, t in enumerate(testimonials):
        t["sort_order"] = i + 1
        await db.testimonials.insert_one(Testimonial(**t).model_dump())

    # -------- FAQs --------
    await _reset("faqs")
    faqs = [
        {"question": "How is ConstructONS different from a traditional contractor?", "answer": "We offer standardized packages with transparent per-sqft pricing, AI-powered live tracking, digital documents, and a 10-year warranty on every package — no hidden costs, no delays."},
        {"question": "What is included in the price per Sq.ft?", "answer": "Structure, materials, labor, standard finishes as per the package, project management, and access to the AI Platform. Land, permits, and premium upgrades are additional."},
        {"question": "How long does construction take?", "answer": "Typically 8–10 months depending on the home model, package, and site conditions. You'll get live milestone tracking throughout."},
        {"question": "Can I customize the home design?", "answer": "Yes — Essential and above packages allow layout and finish customizations. Premium is fully bespoke."},
        {"question": "Do you build in my city?", "answer": "We're currently active across Bangalore, Hyderabad, Pune, Chennai and Mumbai — with new cities added every quarter."},
        {"question": "What warranty do I get?", "answer": "1 year (Basic), 2 years (Essential), 3 years (Standard), and up to 10 years structural (Premium)."},
    ]
    for i, f in enumerate(faqs):
        f["sort_order"] = i + 1
        f["category"] = "general"
        await db.faqs.insert_one(FAQ(**f).model_dump())

    # -------- Blogs --------
    await _reset("blogs")
    blogs = [
        {
            "title": "Why AI is the future of home construction in India",
            "slug": "ai-future-home-construction-india",
            "excerpt": "AI-driven planning, live tracking and predictive quality checks are transforming how Indian homes are built.",
            "cover_image": HOME_IMAGES["modern_aura"][1],
            "author": "Aditya Menon",
            "author_avatar": AVATAR_IMAGES[3],
            "read_minutes": 6,
            "tags": ["AI", "Construction", "Technology"],
            "content_html": "<p>Traditional construction has been plagued by opacity, delays and quality gaps. AI-driven planning changes this by...</p><h2>Live tracking</h2><p>Live milestone tracking means you always know where your project stands.</p>",
            "published_at": now_iso(),
        },
        {
            "title": "Choosing between Basic, Essential, Standard & Premium",
            "slug": "choosing-the-right-package",
            "excerpt": "A practical guide to picking the right ConstructONS package based on your budget and lifestyle.",
            "cover_image": HOME_IMAGES["classic_elite"][0],
            "author": "Priya Nair",
            "author_avatar": AVATAR_IMAGES[1],
            "read_minutes": 5,
            "tags": ["Packages", "Guide"],
            "content_html": "<p>Every family is unique. Here's how to choose the right ConstructONS package...</p>",
            "published_at": now_iso(),
        },
        {
            "title": "Vastu-aware layouts for modern Indian homes",
            "slug": "vastu-aware-modern-layouts",
            "excerpt": "Blending Vastu wisdom with modern architecture — how our designs deliver both harmony and function.",
            "cover_image": HOME_IMAGES["sky_villa"][0],
            "author": "Karthik Rao",
            "author_avatar": AVATAR_IMAGES[2],
            "read_minutes": 7,
            "tags": ["Vastu", "Design"],
            "content_html": "<p>Vastu isn't superstition when applied smartly. Our architects blend it with modern layouts...</p>",
            "published_at": now_iso(),
        },
    ]
    for i, b in enumerate(blogs):
        b["sort_order"] = i + 1
        await db.blogs.insert_one(Blog(**b).model_dump())

    # -------- Team --------
    await _reset("team_members")
    team = [
        {"name": "Aditya Menon", "role": "Founder & CEO", "photo": AVATAR_IMAGES[3], "bio": "15 years in construction tech. Ex-IIT Bombay."},
        {"name": "Priya Nair", "role": "Chief Design Officer", "photo": AVATAR_IMAGES[1], "bio": "Award-winning residential architect."},
        {"name": "Karthik Rao", "role": "Head of AI Platform", "photo": AVATAR_IMAGES[2], "bio": "Building the OS of construction. Ex-Google."},
        {"name": "Sneha Iyer", "role": "Head of Customer Experience", "photo": AVATAR_IMAGES[4], "bio": "Obsessed with delightful customer journeys."},
    ]
    for i, m in enumerate(team):
        m["sort_order"] = i + 1
        await db.team_members.insert_one(TeamMember(**m).model_dump())

    # -------- Media Gallery (dashboard-like previews) --------
    await _reset("media")
    media_items = [
        {"title": "AI Dashboard", "url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80", "category": "dashboard"},
        {"title": "Live Site Camera", "url": "https://images.unsplash.com/photo-1590595978583-3967cf17d2ea?auto=format&fit=crop&w=1600&q=80", "category": "dashboard"},
        {"title": "Documents Vault", "url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80", "category": "dashboard"},
    ]
    for i, m in enumerate(media_items):
        m["sort_order"] = i + 1
        await db.media.insert_one(MediaItem(**m).model_dump())

    print("✅ Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed_all())
