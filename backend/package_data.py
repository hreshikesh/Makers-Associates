"""Detailed real-world package specifications used to seed MongoDB.

Contains 4 packages (Basic, Essential, Standard, Premium) with:
- Deep spec categories (real Indian brands: UltraTech, TATA Tiscon, Jaquar, Kajaria, ...)
- Scope of work
- Exclusions
- Add-ons with pricing
- Payment schedule (milestone-based)
- Package-specific FAQs
"""
from typing import List, Dict, Any

PACKAGE_HERO_IMAGES = {
    "basic": "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1800&q=80",
    "essential": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80",
    "standard": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80",
    "premium": "https://images.unsplash.com/photo-1600566753086-00f18fe6ba68?auto=format&fit=crop&w=1800&q=80",
}


def _spec(spec, value, brand=None, warranty=None, notes=None):
    return {"spec": spec, "value": value, "brand": brand, "warranty": warranty, "notes": notes}


def _cat(name, icon, items):
    return {"name": name, "icon": icon, "items": items}


# ---------------- BASIC PACKAGE ----------------
BASIC_SPECS = [
    _cat("Structure & Foundation", "Building2", [
        _spec("Foundation", "Isolated / Strip footing with M20 grade concrete", "Design as per IS 456"),
        _spec("Cement", "PPC / OPC 43 Grade", "UltraTech / ACC / Ambuja"),
        _spec("TMT Steel", "Fe-500 Grade TMT bars", "TATA Tiscon / Kamdhenu"),
        _spec("Concrete Grade", "M20 for structure, M25 for columns", "Ready-mix / site-mix"),
        _spec("Design Load", "Seismic Zone III compliant", warranty="Structural: 5 Years"),
    ]),
    _cat("Walls & Masonry", "Layers", [
        _spec("External Walls", "9\" (230mm) red clay bricks / AAC blocks", "Bigbloc / Site-sourced"),
        _spec("Internal Walls", "4\" (115mm) red clay bricks", "Local certified vendor"),
        _spec("Mortar", "1:6 cement mortar", "UltraTech"),
        _spec("Plastering", "Double coat plaster, 15mm external + 12mm internal", "1:4 & 1:6 mix"),
    ]),
    _cat("Flooring", "Grid3x3", [
        _spec("Living / Dining / Bedrooms", "Vitrified Tiles 600×600 mm", "Kajaria / Somany", notes="Up to ₹55/sqft basic"),
        _spec("Kitchen", "Anti-skid Ceramic Tiles 300×300 mm", "Johnson / Orient Bell"),
        _spec("Bathrooms", "Anti-skid Ceramic Tiles 300×300 mm", "Johnson / Nitco"),
        _spec("Balcony / Utility", "Anti-skid Ceramic Tiles", "Johnson"),
        _spec("Staircase", "Kota Stone / Granite", "Local"),
    ]),
    _cat("Doors & Windows", "DoorOpen", [
        _spec("Main Door", "Engineered hardwood frame + veneered flush shutter", "Century Ply / Greenlam"),
        _spec("Internal Doors", "Wood-composite frame + laminated flush doors", "Century / Merino"),
        _spec("Windows", "UPVC sliding windows with mosquito mesh", "Fenesta / Local UPVC"),
        _spec("Door Hardware", "SS 304 handles + mortise locks", "Godrej / Yale"),
    ]),
    _cat("Kitchen", "ChefHat", [
        _spec("Counter Top", "Granite (Jet Black / Steel Grey)", "Locally sourced"),
        _spec("Wall Dado", "Ceramic tiles up to 2 ft above counter (600×300)", "Kajaria / Somany"),
        _spec("Sink", "SS 304 single-bowl", "Nirali / Jayna"),
        _spec("Provision", "Chimney, hob, RO — points only, appliances not included"),
    ]),
    _cat("Bathrooms", "ShowerHead", [
        _spec("Wall Tiles", "Glazed ceramic up to 7 ft height 300×450", "Kajaria / Somany"),
        _spec("Sanitary Ware", "Wall-mounted EWC + wash basin", "Cera / Parryware"),
        _spec("CP Fittings", "Chrome Plated basin mixer, health faucet, shower", "Cera / Hindware"),
        _spec("Waterproofing", "2-coat chemical waterproofing", "Dr. Fixit / Fosroc", warranty="5 Years"),
    ]),
    _cat("Electrical", "Zap", [
        _spec("Wiring", "ISI marked FR wires (1.0 / 1.5 / 2.5 / 4 sq mm)", "Polycab / Finolex"),
        _spec("Switches & Sockets", "Modular switches white series", "Anchor Roma / Havells"),
        _spec("MCB / DB", "6-way / 8-way distribution board", "Havells / Legrand"),
        _spec("Points per BHK", "3BHK: ~85 points (including AC, geyser, TV)", notes="Additional points chargeable"),
        _spec("Earthing", "Chemical earthing (2 pits)", "As per IS 3043"),
    ]),
    _cat("Plumbing", "Droplets", [
        _spec("Water Supply", "CPVC pipes for hot & cold water", "Astral / Ashirvad"),
        _spec("Drainage", "PVC SWR pipes", "Supreme / Prince"),
        _spec("Overhead Tank", "1000 L (Sintex / Plasto)", "Sintex", warranty="10 Years"),
        _spec("Sump", "5000 L RCC below ground", ""),
    ]),
    _cat("Painting", "PaintBucket", [
        _spec("Internal Walls", "Putty + Primer + 2 coats emulsion", "Asian Paints Tractor Emulsion"),
        _spec("Ceilings", "Putty + Primer + 2 coats white distemper", "Asian Paints"),
        _spec("External Walls", "Primer + 2 coats exterior emulsion", "Asian Paints Ace / Berger"),
        _spec("Enamel Doors/Grills", "Enamel paint 2 coats", "Asian Paints"),
    ]),
    _cat("Waterproofing", "ShieldCheck", [
        _spec("Terrace", "Brickbat coba + waterproofing chemical", "Dr. Fixit", warranty="5 Years"),
        _spec("Bathrooms", "Chemical waterproofing 2 coats", "Dr. Fixit / Fosroc", warranty="5 Years"),
        _spec("Sump / Overhead Tank", "Cementitious waterproofing", "Dr. Fixit"),
    ]),
    _cat("Ceiling", "Ceiling", [
        _spec("False Ceiling", "Not included in Basic (available as add-on)", ""),
    ]),
    _cat("AI Platform (Included)", "Shield", [
        _spec("Live Progress Dashboard", "Web + mobile access with milestone tracking"),
        _spec("AI Assistant", "WhatsApp AI assistant for project queries"),
        _spec("Digital Documents", "All approvals, invoices & contracts online"),
        _spec("Weekly Reports", "Auto-generated PDF site reports every Friday"),
    ]),
]

BASIC_SCOPE = [
    "Structural design, drawing & GFC drawings",
    "Foundation, columns, beams, slabs & staircase (RCC)",
    "External & internal walls (brickwork/blockwork)",
    "Plastering (internal + external)",
    "Vitrified tile flooring in living/bedrooms",
    "Anti-skid ceramic flooring in kitchen/bathrooms/balcony",
    "Standard doors & UPVC windows",
    "Kitchen platform with granite counter",
    "Bathrooms with wall tiling up to 7 ft",
    "Standard CP fittings & sanitary ware",
    "Electrical wiring, points, switches & MCB",
    "Plumbing with CPVC (water) & PVC (drainage)",
    "Painting: 2 coats internal emulsion + external emulsion",
    "Terrace + bathroom waterproofing",
    "Site supervision, quality checks & AI live tracking",
]

BASIC_EXCLUSIONS = [
    "Land cost, land registration & stamp duty",
    "Statutory approvals (BBMP/BDA/RERA/permits & their fees)",
    "Compound wall, gate, driveway & external development",
    "Modular kitchen, wardrobes & loose furniture",
    "False ceiling (available as add-on)",
    "Home appliances (chimney, hob, RO, AC etc.)",
    "Solar / EV charger / smart home devices",
    "Landscaping & external gardening",
    "GST — charged extra as per prevailing rates",
]

BASIC_ADDONS = [
    {"name": "False Ceiling (Gypsum)", "description": "Gyproc gypsum board with plain / cove design", "price": "₹85/sq.ft", "unit": "per sq.ft"},
    {"name": "Modular Kitchen", "description": "L-shape modular with soft-close hardware, laminate finish", "price": "₹1,25,000", "unit": "starting"},
    {"name": "Wardrobes", "description": "Bedroom wardrobes with laminated finish + soft-close", "price": "₹1,200/sq.ft", "unit": "per sq.ft"},
    {"name": "Solar Water Heater", "description": "200 LPD Solar water heater installed", "price": "₹48,000", "unit": "one-time"},
    {"name": "Compound Wall + Gate", "description": "Boundary wall (up to 5 ft) + MS main gate", "price": "₹1,850/running ft", "unit": "per running ft"},
]

BASIC_PAY_SCHEDULE = [
    {"milestone": "Booking Advance", "percentage": 10, "description": "On agreement signing & design finalisation"},
    {"milestone": "Foundation Complete", "percentage": 15, "description": "PCC, footing & plinth beam done"},
    {"milestone": "Ground Floor Roof Slab", "percentage": 25, "description": "GF slab casting complete"},
    {"milestone": "Brickwork Complete", "percentage": 15, "description": "All floors brickwork & lintels"},
    {"milestone": "Plastering & Flooring", "percentage": 15, "description": "Internal + external plaster + tiling"},
    {"milestone": "Electrical & Plumbing", "percentage": 10, "description": "Points, fittings, sanitary & CP"},
    {"milestone": "Painting & Finishing", "percentage": 8, "description": "Internal + external paint"},
    {"milestone": "Handover", "percentage": 2, "description": "Final snagging & keys handover"},
]

BASIC_FAQS = [
    {"question": "What is included in Basic Package pricing?", "answer": "The ₹/Sq.ft price includes structure, materials, labor, standard finishes, project management and AI Platform access. It excludes land, permits, GST and premium upgrades."},
    {"question": "How is 'Sq.ft' calculated?", "answer": "Built-up area (including walls) across all floors, staircase and slab projections. We share the calculation sheet before agreement."},
    {"question": "Can I upgrade materials later?", "answer": "Yes — you can pay the difference and upgrade any category (tiles, sanitary, doors) before that phase starts."},
    {"question": "What warranty do I get with Basic?", "answer": "10-year comprehensive warranty covering structure, waterproofing and workmanship — same as every other ConstructONS package."},
    {"question": "Is a modular kitchen included?", "answer": "No — Basic includes the platform with granite counter. Modular kitchen is an add-on."},
]


# ---------------- ESSENTIAL PACKAGE (mid-tier) ----------------
ESSENTIAL_SPECS = [
    _cat("Structure & Foundation", "Building2", [
        _spec("Foundation", "RCC Isolated / Raft footing with M25 concrete", "As per Soil Report"),
        _spec("Cement", "PPC 53 Grade", "UltraTech / ACC / Ambuja"),
        _spec("TMT Steel", "Fe-500D Grade seismic-resistant bars", "TATA Tiscon / JSW Neosteel"),
        _spec("Concrete Grade", "M25 structure, M30 columns", "Ready-mix concrete"),
        _spec("Design Load", "Seismic Zone III + Wind IS 875 compliant", warranty="Structural: 7 Years"),
    ]),
    _cat("Walls & Masonry", "Layers", [
        _spec("External Walls", "8\" AAC blocks with lightweight thermal insulation", "Bigbloc / Magicrete / Siporex"),
        _spec("Internal Walls", "4\" AAC blocks / 4\" red bricks", "Bigbloc"),
        _spec("Plastering", "Two-coat plaster; external Sponge finish + internal Punning", "1:4 & 1:6"),
    ]),
    _cat("Flooring", "Grid3x3", [
        _spec("Living / Dining", "Double-charged Vitrified Tiles 800×800", "Kajaria / Somany", notes="Up to ₹85/sqft"),
        _spec("Bedrooms", "Wooden-finish Vitrified Tiles 600×1200", "Kajaria / Orient Bell"),
        _spec("Kitchen", "Anti-skid Vitrified Tiles 600×600", "Somany"),
        _spec("Bathrooms", "Anti-skid Vitrified Tiles 600×600", "Somany / Nitco"),
        _spec("Balcony / Utility", "Wooden-finish anti-skid tiles", "Kajaria"),
        _spec("Staircase", "Granite full length", "Locally sourced"),
    ]),
    _cat("Doors & Windows", "DoorOpen", [
        _spec("Main Door", "Solid teak wood frame + designer teak shutter", "Century Ply teak veneer"),
        _spec("Internal Doors", "Sal wood frame + membrane / laminated flush doors", "Century / Greenply"),
        _spec("Bathroom Doors", "WPC waterproof doors", "Duroply / Alstone WPC"),
        _spec("Windows", "UPVC sliding + openable with mosquito mesh & MS grills", "Fenesta / LG"),
        _spec("Door Hardware", "SS 304 designer handles + mortise locks", "Godrej Advantis / Yale"),
    ]),
    _cat("Kitchen", "ChefHat", [
        _spec("Counter Top", "Premium Granite (Steel Grey / Absolute Black) 20mm", "Ranga Reddy / Ilkal quarries"),
        _spec("Wall Dado", "Glazed ceramic full-height (600×600)", "Kajaria / Somany"),
        _spec("Sink", "SS 304 double-bowl anti-scratch", "Nirali / Franke Basic"),
        _spec("Provision", "Chimney, hob, RO, dishwasher — points only"),
    ]),
    _cat("Bathrooms", "ShowerHead", [
        _spec("Wall Tiles", "Full-height Glazed Vitrified 600×1200 with highlighter", "Kajaria / Somany"),
        _spec("Sanitary Ware", "Wall-hung EWC + counter wash basin + concealed cistern", "Jaquar / Cera"),
        _spec("CP Fittings", "Diverter, overhead shower, health faucet, hand shower", "Jaquar Continental"),
        _spec("Geyser Provision", "25 L geyser point + concealed piping"),
        _spec("Waterproofing", "3-coat elastomeric waterproofing", "Dr. Fixit Roofseal", warranty="7 Years"),
    ]),
    _cat("Electrical", "Zap", [
        _spec("Wiring", "FR-LSH copper wires with Cat-6 & CCTV conduits", "Polycab / Finolex"),
        _spec("Switches & Sockets", "Modular switches designer series", "Legrand Myrius / Havells Crabtree"),
        _spec("MCB / DB / RCCB", "16-way DB with RCCB + surge protector", "Legrand / Havells"),
        _spec("Points per BHK", "3BHK: ~120 points including AC in each bedroom, geyser, TV, exhaust"),
        _spec("Provisions", "Provision for CCTV, video door phone & internet router"),
        _spec("Earthing", "Chemical earthing (3 pits)", "As per IS 3043"),
    ]),
    _cat("Plumbing", "Droplets", [
        _spec("Water Supply", "CPVC hot + cold with pressure-tested joints", "Astral / Ashirvad"),
        _spec("Drainage", "SWR + Silent PVC pipes", "Supreme Silentline"),
        _spec("Overhead Tank", "1500 L UV-stabilised triple-layer", "Sintex", warranty="10 Years"),
        _spec("Sump", "8000 L RCC with FRP lining", ""),
        _spec("Water Pump", "0.5 HP Crompton / Kirloskar", "Crompton"),
    ]),
    _cat("Painting", "PaintBucket", [
        _spec("Internal Walls", "Wall putty + primer + 2 coats premium emulsion", "Asian Paints Premium Emulsion / Berger Silk"),
        _spec("Ceilings", "Putty + 2 coats acrylic emulsion", "Asian Paints"),
        _spec("External Walls", "Weatherproof exterior emulsion", "Asian Paints Apex / Berger Weathercoat"),
        _spec("Enamel", "Enamel paint on grills & doors", "Asian Paints"),
    ]),
    _cat("Waterproofing", "ShieldCheck", [
        _spec("Terrace", "APP membrane + brickbat coba", "Dr. Fixit Roofseal", warranty="7 Years"),
        _spec("Bathrooms", "3-coat elastomeric waterproofing", "Dr. Fixit / Fosroc", warranty="7 Years"),
        _spec("External Walls", "Water-repellent coating", "Dr. Fixit Raincoat"),
    ]),
    _cat("Ceiling", "Ceiling", [
        _spec("Living / Dining", "Peripheral gypsum false ceiling with cove lighting", "Gyproc Habito"),
        _spec("Bedrooms", "Peripheral cove ceiling (basic design)"),
    ]),
    _cat("AI Platform (Included)", "Shield", [
        _spec("Live Progress Dashboard", "Web + mobile with milestone + Gantt tracking"),
        _spec("AI Assistant", "WhatsApp + web AI assistant"),
        _spec("Site Camera", "1 live CCTV feed on your dashboard"),
        _spec("Documents Vault", "Approvals, invoices, warranty cards, drawings"),
        _spec("Reports", "Weekly PDF + Monthly video updates"),
    ]),
]

ESSENTIAL_SCOPE = BASIC_SCOPE + [
    "Peripheral gypsum false ceiling in living + dining",
    "UPVC sliding windows with MS grills",
    "Wall-hung EWC with concealed cistern in all bathrooms",
    "Overhead shower with diverter in master bathroom",
    "Live CCTV feed integrated on customer dashboard",
]

ESSENTIAL_EXCLUSIONS = BASIC_EXCLUSIONS

ESSENTIAL_ADDONS = [
    {"name": "Full False Ceiling", "description": "Gypsum ceiling across all rooms with designer profile", "price": "₹95/sq.ft", "unit": "per sq.ft"},
    {"name": "Modular Kitchen", "description": "L-shape modular with acrylic finish + Blum hardware", "price": "₹1,85,000", "unit": "starting"},
    {"name": "Wardrobes", "description": "Bedroom wardrobes with acrylic + Ebco / Hettich hardware", "price": "₹1,650/sq.ft", "unit": "per sq.ft"},
    {"name": "Solar Water Heater", "description": "300 LPD Solar water heater", "price": "₹68,000", "unit": "one-time"},
    {"name": "Home Automation Basics", "description": "Smart lights + curtains in living + master (Wipro/Havells)", "price": "₹95,000", "unit": "one-time"},
    {"name": "CCTV Package", "description": "6-camera Hikvision NVR system with mobile app", "price": "₹42,000", "unit": "one-time"},
]

ESSENTIAL_PAY_SCHEDULE = BASIC_PAY_SCHEDULE  # same milestones, values scale

ESSENTIAL_FAQS = [
    {"question": "What's the biggest upgrade from Basic?", "answer": "Better structure (M25 concrete + Fe-500D steel + AAC blocks), premium Kajaria/Somany tiles up to 800×800, Jaquar Continental fittings, Legrand modular switches, and peripheral false ceiling in living. Plus better warranties (7-yr waterproofing, 7-yr structure)."},
    {"question": "Is teak wood main door included?", "answer": "Yes — solid teak wood frame with teak-veneer shutter is standard in Essential."},
    {"question": "How many electrical points are provided?", "answer": "For a 3BHK: approximately 120 points including AC provisions in every bedroom, geysers, TV, exhaust, and points for CCTV/router."},
    {"question": "Do I get a modular kitchen?", "answer": "The kitchen counter with granite and sink is included. Modular cabinets (loft/base units) are an add-on starting at ₹1,85,000 for a standard L-shape."},
]


# ---------------- STANDARD PACKAGE (Premium Value) ----------------
STANDARD_SPECS = [
    _cat("Structure & Foundation", "Building2", [
        _spec("Foundation", "RCC Raft foundation designed per soil bearing", "Geotechnical report"),
        _spec("Cement", "PSC / OPC 53 Grade", "UltraTech Ultra 53 / ACC Gold"),
        _spec("TMT Steel", "Fe-550D CRS TMT bars", "TATA Tiscon Superlinks / JSW Neosteel 550D"),
        _spec("Concrete Grade", "M30 structure + M35 columns + M40 shear walls", "Ready-mix concrete"),
        _spec("Design", "STAAD.Pro analysed, wind + seismic zone V compliant", warranty="Structural: 10 Years"),
    ]),
    _cat("Walls & Masonry", "Layers", [
        _spec("External Walls", "8\" AAC blocks with EPS thermal panels", "Magicrete / Siporex"),
        _spec("Internal Walls", "4\" AAC blocks", "Magicrete"),
        _spec("Plastering", "Gypsum smooth-finish internal + external double-coat", "Gyproc Elite"),
    ]),
    _cat("Flooring", "Grid3x3", [
        _spec("Living / Dining", "Imported marble OR GVT 800×1600 (large format)", "Kajaria Eternity / Somany Duragres", notes="Up to ₹135/sqft"),
        _spec("Bedrooms", "Wooden laminate flooring OR wooden-finish tiles", "Pergo / Kajaria Eternity"),
        _spec("Kitchen", "Anti-skid GVT 800×800", "Kajaria / Orient Bell"),
        _spec("Bathrooms", "Anti-skid designer tiles 600×1200", "Somany / Nitco Premium"),
        _spec("Balcony / Deck", "Wooden deck tile / Anti-skid GVT", "Kajaria"),
        _spec("Staircase", "Italian marble treads", ""),
    ]),
    _cat("Doors & Windows", "DoorOpen", [
        _spec("Main Door", "Designer teak door with brass hardware + carved panels", "Century / Custom-built"),
        _spec("Internal Doors", "Solid-core engineered doors with veneer finish", "Century / Merino"),
        _spec("Bathroom Doors", "WPC + laminate designer doors", "Alstone / Duroply"),
        _spec("Windows", "Aluminium + UPVC casement / sliding with double-glazed panes", "Fenesta / Aluplast"),
        _spec("Door Hardware", "Premium hardware", "Yale / Dorset / Godrej Ultra"),
    ]),
    _cat("Kitchen", "ChefHat", [
        _spec("Counter Top", "Quartz stone counter 20mm", "Kalinga Stone / Caesarstone entry"),
        _spec("Wall Dado", "Backpainted glass / Designer full-height GVT", "Kajaria / Custom"),
        _spec("Sink", "SS 304 undermount double-bowl", "Franke Maris / Nirali Elegance"),
        _spec("Provisions", "Chimney, hob, RO, dishwasher, microwave, refrigerator — points + water lines"),
    ]),
    _cat("Bathrooms", "ShowerHead", [
        _spec("Wall Tiles", "Full-height designer GVT with mosaic highlighter", "Kajaria Prima Plus / Somany Duragres"),
        _spec("Sanitary Ware", "Rimless wall-hung EWC + counter-top basin + smart flush", "Jaquar / Kohler / Grohe"),
        _spec("CP Fittings", "Concealed diverter, rain shower, hand shower, health faucet, sensor mixers optional", "Jaquar Fonte / Kohler"),
        _spec("Bath Accessories", "Towel bar, robe hook, tumbler holder, soap dish (SS 304)", "Jaquar"),
        _spec("Geysers", "Instant + storage points, provision for solar", ""),
        _spec("Waterproofing", "4-coat crystalline + elastomeric", "Fosroc Nitoflor / Dr. Fixit", warranty="10 Years"),
    ]),
    _cat("Electrical", "Zap", [
        _spec("Wiring", "FR-LSH copper wires + Cat-6A + fibre-optic conduits", "Polycab / Finolex"),
        _spec("Switches & Sockets", "Designer modular series with USB sockets", "Legrand Arteor / Schneider Livia"),
        _spec("MCB / DB / RCCB / SPD", "20-way DB with RCCB + SPD + smart meters", "Schneider / ABB"),
        _spec("Points per BHK", "3BHK: 150+ points; provision for home automation"),
        _spec("Provisions", "CCTV, VDP, alarm, smart lock, motorised curtains points"),
        _spec("Earthing", "Chemical earthing (4 pits) + lightning arrester", ""),
        _spec("EV Point", "Level-2 EV charger point in garage (32A)", ""),
    ]),
    _cat("Plumbing", "Droplets", [
        _spec("Water Supply", "CPVC + PEX hot water lines", "Astral / Ashirvad / Rehau PEX"),
        _spec("Drainage", "Silent PVC + noise-insulated stacks", "Supreme Silentline / Astral Silencio"),
        _spec("Overhead Tank", "2000 L food-grade + insulated hot water tank", "Sintex Reno / Ashirvad"),
        _spec("Water Pump", "1 HP Grundfos / Wilo pressure pump", "Grundfos / Wilo"),
        _spec("RO + Softener", "Central RO + water softener provisions", ""),
    ]),
    _cat("Painting", "PaintBucket", [
        _spec("Internal Walls", "Wall putty + primer + Royale luxury emulsion", "Asian Paints Royale Luxury / Berger Silk Luxury"),
        _spec("Ceilings", "Royale Aspira ceiling", "Asian Paints"),
        _spec("External Walls", "Silicone-based weatherproof exterior", "Asian Paints Apex Ultima / Berger WeatherCoat All-Guard"),
        _spec("Textures", "One accent wall texture per bedroom included", "Asian Paints RoyalePlay"),
    ]),
    _cat("Waterproofing", "ShieldCheck", [
        _spec("Terrace", "APP + Bituminous membrane + insulation layer", "Fosroc / Dr. Fixit", warranty="10 Years"),
        _spec("Bathrooms", "Crystalline + elastomeric + PU coating", "Fosroc Nitoflor", warranty="10 Years"),
        _spec("External Walls", "Silicone water-repellent + anti-fungal", "Dr. Fixit"),
    ]),
    _cat("Ceiling", "Ceiling", [
        _spec("Living / Dining", "Designer gypsum with cove + spot lights", "Gyproc"),
        _spec("Bedrooms", "Full false ceiling with LED profile lights"),
        _spec("Bathrooms", "PVC / gypsum ceiling with exhaust integration"),
    ]),
    _cat("Home Automation", "Cpu", [
        _spec("Smart Switches", "Smart switches in living + bedrooms", "Wipro Garnet / Havells"),
        _spec("Curtains", "Motorised curtains in living + master", "Silent Gliss / Aqara"),
        _spec("Voice Assistant", "Alexa / Google Home integration"),
    ]),
    _cat("AI Platform (Included)", "Shield", [
        _spec("Live Progress Dashboard", "Web + mobile + tablet"),
        _spec("AI Assistant", "24/7 WhatsApp + web assistant"),
        _spec("Site Cameras", "3 live CCTV feeds"),
        _spec("Weekly Site Visits", "By dedicated project maestro"),
        _spec("Documents Vault", "Full digital handover pack"),
    ]),
]

STANDARD_SCOPE = ESSENTIAL_SCOPE + [
    "Full false ceiling with LED lighting in every room",
    "Home automation basics (smart switches + voice assistant)",
    "Quartz kitchen counter with premium fittings",
    "Wall-hung rimless EWC in all bathrooms",
    "Rain + hand shower in master bathroom",
    "Level-2 EV charging point provision",
    "Weekly site visits by project maestro",
]

STANDARD_EXCLUSIONS = BASIC_EXCLUSIONS

STANDARD_ADDONS = [
    {"name": "Modular Kitchen (Full)", "description": "L / U-shape acrylic modular + Blum hardware + tall units", "price": "₹2,85,000", "unit": "starting"},
    {"name": "Full Home Wardrobes", "description": "PU / Acrylic finish across all bedrooms", "price": "₹1,950/sq.ft", "unit": "per sq.ft"},
    {"name": "Solar Panel System", "description": "3 kW rooftop solar with inverter + net-metering", "price": "₹2,15,000", "unit": "one-time"},
    {"name": "Home Automation Pro", "description": "All lights + curtains + AC + security via smart hub", "price": "₹3,50,000", "unit": "one-time"},
    {"name": "Interior Package (Turnkey)", "description": "Full interiors incl. sofas, dining, beds, lights", "price": "₹1,850/sq.ft", "unit": "per sq.ft"},
    {"name": "Swimming Pool", "description": "Small plunge pool 12x8 ft with filtration", "price": "₹6,50,000", "unit": "one-time"},
]

STANDARD_PAY_SCHEDULE = BASIC_PAY_SCHEDULE

STANDARD_FAQS = [
    {"question": "What makes Standard 'Most Premium Value'?", "answer": "You get Fe-550D steel + M30 concrete, imported marble or 800×1600 large-format tiles, Jaquar Fonte / Kohler bathrooms, quartz kitchen counters, Schneider/Legrand designer switches, full false ceiling, home automation basics and 10-year waterproofing — at a mid-market price."},
    {"question": "Is home automation really included?", "answer": "Yes — smart switches in living + bedrooms, motorised curtains in living + master, and Alexa/Google Home integration are all standard."},
    {"question": "Do I get EV charging?", "answer": "Yes — a Level-2 (32A) EV charger point in the garage is included. The actual charger unit can be added later."},
    {"question": "How is quality monitored?", "answer": "150+ checkpoints across 15 stages, third-party audit at critical junctures, and a dedicated project maestro visits weekly."},
]


# ---------------- PREMIUM PACKAGE (bespoke luxury) ----------------
PREMIUM_SPECS = [
    _cat("Structure & Foundation", "Building2", [
        _spec("Foundation", "Custom-engineered raft / pile with seismic dampers", "PEER / DSTA"),
        _spec("Cement", "43/53 Grade + Ambuja Plus / UltraTech Xtralite", "UltraTech / Ambuja Plus"),
        _spec("TMT Steel", "Fe-550D SD / Fe-600 imported CRS TMT", "TATA Tiscon SD / JSW / imported"),
        _spec("Concrete Grade", "M35 minimum, up to M45 with admixtures", "Ready-mix + microsilica"),
        _spec("Design", "STAAD + ETABS analysis, 3rd-party structural audit", warranty="Structural: 10 Years"),
    ]),
    _cat("Walls & Masonry", "Layers", [
        _spec("External Walls", "AAC blocks + EPS thermal insulation + rain-screen cladding", "Magicrete + custom cladding"),
        _spec("Internal Walls", "AAC blocks + acoustic partitions in home theatre", "Magicrete + Saint-Gobain"),
        _spec("Plastering", "Gypsum internal + textured external", "Gyproc"),
    ]),
    _cat("Flooring", "Grid3x3", [
        _spec("Living / Dining", "Italian marble (Statuario / Carrara / Botticino) OR imported porcelain 1200×2400", "Italian marble consignment", notes="Up to ₹250+/sqft"),
        _spec("Bedrooms", "Engineered oak wooden flooring OR imported porcelain", "Pergo / Kährs"),
        _spec("Kitchen", "GVT / Italian marble", "Kajaria / Italian"),
        _spec("Bathrooms", "Designer imported tiles / marble slabs", ""),
        _spec("Terrace / Deck", "Wooden IPE deck tiles", "Accoya / IPE"),
        _spec("Staircase", "Italian marble + glass railing / SS handrail", "Custom"),
    ]),
    _cat("Doors & Windows", "DoorOpen", [
        _spec("Main Door", "Custom-designed pivot / large teak door with brass inlay", "Custom carpentry"),
        _spec("Internal Doors", "Solid-core designer doors with custom finish", "Custom / Merino"),
        _spec("Windows", "Thermally-broken aluminium double / triple glazed", "Schuco / Reynaers / Aluplast"),
        _spec("Skylights", "Fixed / operable skylights with laminated glass", "Velux"),
        _spec("Hardware", "Imported hardware", "Häfele / Hettich / Blum"),
    ]),
    _cat("Kitchen", "ChefHat", [
        _spec("Counter Top", "Caesarstone / Silestone quartz OR natural stone", "Caesarstone / Silestone / Neolith"),
        _spec("Wall Splashback", "Backpainted lacquered glass / natural stone slab", ""),
        _spec("Sink", "Franke / Blanco undermount with garbage disposer", "Franke / Blanco"),
        _spec("Appliances Provision", "Full appliance provisioning (Bosch / Miele / Siemens)"),
        _spec("Modular Cabinetry", "Included: Blum / Hettich handleless modular, tall units, breakfast counter"),
    ]),
    _cat("Bathrooms", "ShowerHead", [
        _spec("Wall Tiles", "Book-matched imported marble / large-format porcelain", ""),
        _spec("Sanitary Ware", "Rimless smart EWC + counter basin + bidet + concealed cistern", "Kohler / TOTO / Villeroy & Boch"),
        _spec("CP Fittings", "Thermostatic showers, rain + body-jet + hand shower, sensor mixers", "Grohe / Hansgrohe / Kohler"),
        _spec("Bath Suite", "Freestanding bathtub in master + steam shower / sauna optional", "Kohler / Duravit"),
        _spec("Accessories", "Full designer bath suite in matching finish", ""),
        _spec("Waterproofing", "5-coat premium waterproofing system", "Fosroc / Sika", warranty="10 Years"),
    ]),
    _cat("Electrical", "Zap", [
        _spec("Wiring", "FR-LSH + fibre-optic + Cat-6A structured cabling", "Polycab Etira / imported"),
        _spec("Switches & Sockets", "Touch-panel switches + fully wired for automation", "Lutron / Crestron / Schneider Wiser"),
        _spec("Backup", "Whole-home inverter + battery backup + optional DG set", "Luminous / Su-Kam / Cummins DG"),
        _spec("Home Automation", "Fully-integrated system: lights, curtains, AC, security, entertainment", "Crestron / Control4 / Lutron"),
        _spec("Points per BHK", "4BHK: 200+ points; every device integrated"),
        _spec("EV Charger", "Full Level-2 EV charger installed", "Tata Power / Statiq"),
        _spec("Solar", "5 kW rooftop solar + net-metering", "Loom Solar / Waaree"),
    ]),
    _cat("Plumbing", "Droplets", [
        _spec("Water Supply", "PEX + copper hot water lines with recirculation", "Rehau / Uponor PEX"),
        _spec("Drainage", "Silent PVC + acoustic insulation", "Astral Silencio / Geberit"),
        _spec("Water Systems", "Central RO + water softener + hot water recirculation + UV disinfection", ""),
        _spec("Overhead Tank", "3000 L food-grade + booster pump", "Grundfos / Wilo"),
        _spec("Rainwater Harvesting", "Full rainwater harvesting + storage", ""),
    ]),
    _cat("Painting", "PaintBucket", [
        _spec("Internal Walls", "Royale Play + Italian textures / imported paints", "Fine Paints of Europe / Asian Royale Play"),
        _spec("Ceilings", "Designer smooth-finish ceiling", "Asian Paints"),
        _spec("External Walls", "Silicone weatherproof + fluorescent-free", "Asian Paints Apex Ultima Protek"),
        _spec("Accent Walls", "Custom murals / designer wallpapers per bedroom", "Elementto / imported"),
    ]),
    _cat("Ceiling", "Ceiling", [
        _spec("Living / Dining", "Custom designer gypsum with cove + tunable LED + chandelier point"),
        _spec("Bedrooms", "Full false ceiling with mood lighting + fan point"),
        _spec("Bathrooms", "Waterproof gypsum with recessed lighting + exhaust"),
    ]),
    _cat("Home Automation & Security", "Cpu", [
        _spec("Automation", "Full Crestron / Control4 integration"),
        _spec("Security", "CCTV (8+ cameras), video door phone, motion sensors, smart locks, alarm"),
        _spec("Entertainment", "Home theatre wiring + Sonos zones"),
        _spec("Climate", "VRF air-conditioning system (Daikin / Mitsubishi)", warranty="5 Years"),
    ]),
    _cat("Landscape & Exteriors", "Trees", [
        _spec("Landscaping", "Custom landscape by professional designer"),
        _spec("Compound", "Designer compound wall + automated gate"),
        _spec("Outdoor Lighting", "Landscape uplighters + facade highlight lighting"),
    ]),
    _cat("AI Platform (Included)", "Shield", [
        _spec("Live Dashboard", "Web + mobile + tablet with predictive insights"),
        _spec("AI Assistant", "Dedicated AI concierge + human maestro on speed-dial"),
        _spec("Site Cameras", "6+ live CCTV feeds"),
        _spec("Quality", "Third-party audits at every major milestone"),
        _spec("Ongoing", "Post-handover: 5-year AMC + priority support"),
    ]),
]

PREMIUM_SCOPE = STANDARD_SCOPE + [
    "Italian marble / imported porcelain in living/dining",
    "Freestanding bathtub in master bathroom + steam optional",
    "Fully integrated home automation (Crestron/Control4)",
    "VRF AC system with warranty",
    "5 kW rooftop solar + rainwater harvesting",
    "Full modular kitchen with premium cabinetry",
    "Custom landscape + designer compound",
    "5-year post-handover AMC",
]

PREMIUM_EXCLUSIONS = [
    "Land cost, land registration & stamp duty",
    "Statutory approvals & permit fees",
    "Very high-end appliances (Miele/Sub-Zero) — supplied at cost + service fee",
    "Art, décor, artefacts",
    "Elevators (available as add-on)",
    "GST — charged extra as per prevailing rates",
]

PREMIUM_ADDONS = [
    {"name": "Home Elevator", "description": "Kone / Otis / Schindler 4-person residential elevator", "price": "₹18,00,000", "unit": "starting"},
    {"name": "Full Interior Design", "description": "Turnkey interior with imported furniture", "price": "Custom Quote", "unit": "based on scope"},
    {"name": "Home Theatre", "description": "Dolby Atmos 7.1.4 with acoustic room", "price": "₹8,50,000", "unit": "one-time"},
    {"name": "Wine Cellar", "description": "Climate-controlled wine cellar (200-bottle)", "price": "₹5,50,000", "unit": "one-time"},
    {"name": "Swimming Pool + Deck", "description": "Full pool with equipment + wooden deck", "price": "₹18,00,000", "unit": "starting"},
]

PREMIUM_PAY_SCHEDULE = BASIC_PAY_SCHEDULE

PREMIUM_FAQS = [
    {"question": "Why 'Custom Quote' pricing?", "answer": "Premium is a bespoke build — imported materials, designer collaborations and architect-led scope vary widely by home. We provide a fixed itemised quote after a design consultation, typically starting at ₹3,500/Sq.ft."},
    {"question": "Who designs the home?", "answer": "A senior architect + interior designer team dedicated to your project, plus your own choice of designer if you have a preference. All-in-one project maestro coordinates."},
    {"question": "What's the timeline?", "answer": "12–18 months for a typical premium villa (3,000–5,000 Sq.ft). We share a Gantt chart and stick to it — with milestone-based penalties baked into the contract."},
    {"question": "Do you handle imports?", "answer": "Yes — we handle end-to-end imports (Italian marble, European sanitary, automation systems) with duties + logistics fully documented in your PDF brochure."},
]


PACKAGES_DETAILED = [
    {
        "slug": "basic",
        "spec_categories": BASIC_SPECS,
        "scope_of_work": BASIC_SCOPE,
        "exclusions": BASIC_EXCLUSIONS,
        "addons": BASIC_ADDONS,
        "payment_schedule": BASIC_PAY_SCHEDULE,
        "package_faqs": BASIC_FAQS,
        "hero_image": PACKAGE_HERO_IMAGES["basic"],
        "timeline_months": "8–10 months",
        "warranty_years": 10,
        "price_per_sqft": 1499,
        "min_area_sqft": 800,
    },
    {
        "slug": "essential",
        "spec_categories": ESSENTIAL_SPECS,
        "scope_of_work": ESSENTIAL_SCOPE,
        "exclusions": ESSENTIAL_EXCLUSIONS,
        "addons": ESSENTIAL_ADDONS,
        "payment_schedule": ESSENTIAL_PAY_SCHEDULE,
        "package_faqs": ESSENTIAL_FAQS,
        "hero_image": PACKAGE_HERO_IMAGES["essential"],
        "timeline_months": "9–11 months",
        "warranty_years": 10,
        "price_per_sqft": 1799,
        "min_area_sqft": 1000,
    },
    {
        "slug": "standard",
        "spec_categories": STANDARD_SPECS,
        "scope_of_work": STANDARD_SCOPE,
        "exclusions": STANDARD_EXCLUSIONS,
        "addons": STANDARD_ADDONS,
        "payment_schedule": STANDARD_PAY_SCHEDULE,
        "package_faqs": STANDARD_FAQS,
        "hero_image": PACKAGE_HERO_IMAGES["standard"],
        "timeline_months": "10–12 months",
        "warranty_years": 10,
        "price_per_sqft": 2199,
        "min_area_sqft": 1200,
    },
    {
        "slug": "premium",
        "spec_categories": PREMIUM_SPECS,
        "scope_of_work": PREMIUM_SCOPE,
        "exclusions": PREMIUM_EXCLUSIONS,
        "addons": PREMIUM_ADDONS,
        "payment_schedule": PREMIUM_PAY_SCHEDULE,
        "package_faqs": PREMIUM_FAQS,
        "hero_image": PACKAGE_HERO_IMAGES["premium"],
        "timeline_months": "12–18 months",
        "warranty_years": 10,
        "price_per_sqft": 0,  # custom quote
        "min_area_sqft": 2000,
    },
]
