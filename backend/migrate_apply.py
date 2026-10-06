"""One-off migration to apply latest changes to a running DB.

Updates:
  1. Home cover_image + gallery -> new Indian-elevation Unsplash photos
  2. All packages -> highlights "10 Year Warranty" and warranty_years = 10
  3. Basic package FAQ warranty answer -> 10-year phrasing
  4. Compare-table warranty row -> "10 year warranty"
"""
import asyncio
from db import db
from seed import HOME_IMAGES

HOME_SLUG_TO_KEY = {
    "modern-aura": "modern_aura",
    "classic-elite": "classic_elite",
    "urban-nest": "urban_nest",
    "sky-villa": "sky_villa",
    "luxury-duplex": "luxury_duplex",
    "premium-villa": "premium_villa",
}

PACKAGE_HIGHLIGHTS = {
    "basic": [
        "Standard Quality Materials",
        "Standard Finishes",
        "Project Supervision",
        "10 Year Warranty",
    ],
    "essential": [
        "Better Quality Materials",
        "Premium Finishes",
        "Live Project Tracking",
        "10 Year Warranty",
    ],
    "standard": [
        "Premium Quality Materials",
        "Designer Finishes",
        "Dedicated PM",
        "10 Year Warranty",
    ],
    "premium": [
        "Custom Design & Planning",
        "Luxury Materials",
        "Smart Home Integration",
        "10 Year Warranty",
    ],
}

BASIC_FAQ_OLD = "1 year comprehensive against defects + 5-year structural warranty as per IS 456 design."
BASIC_FAQ_NEW = "10-year comprehensive warranty covering structure, waterproofing and workmanship — same as every other ConstructONS package."


async def migrate_homes():
    updated = 0
    for slug, key in HOME_SLUG_TO_KEY.items():
        imgs = HOME_IMAGES.get(key)
        if not imgs:
            continue
        res = await db.homes.update_one(
            {"slug": slug},
            {"$set": {"cover_image": imgs[0], "gallery": imgs}},
        )
        updated += res.modified_count
    print(f"[homes] updated {updated} documents")


async def migrate_packages():
    updated = 0
    for slug, highlights in PACKAGE_HIGHLIGHTS.items():
        pkg = await db.packages.find_one({"slug": slug})
        if not pkg:
            continue
        # Update FAQ answer for basic
        pkg_faqs = pkg.get("package_faqs") or []
        for f in pkg_faqs:
            if f.get("answer") == BASIC_FAQ_OLD:
                f["answer"] = BASIC_FAQ_NEW
        res = await db.packages.update_one(
            {"slug": slug},
            {"$set": {
                "highlights": highlights,
                "warranty_years": 10,
                "package_faqs": pkg_faqs,
            }},
        )
        updated += res.modified_count
    print(f"[packages] updated {updated} documents")


async def migrate_compare_table():
    """Update FAQ / testimonials / compare_table content docs that mention 'Up to 10 year warranty'."""
    updated = 0
    async for doc in db.faqs.find({"answer": {"$regex": "up to 10-year warranty", "$options": "i"}}):
        new_ans = doc["answer"].replace("up to 10-year warranty", "a 10-year warranty on every package")
        await db.faqs.update_one({"_id": doc["_id"]}, {"$set": {"answer": new_ans}})
        updated += 1
    # Compare-table docs may be under site_settings, comparisons, or standalone
    for coll in ["comparisons", "compare_table", "compare_rows"]:
        try:
            res = await db[coll].update_many(
                {"constructons": {"$regex": "Up to 10 year warranty", "$options": "i"}},
                {"$set": {"constructons": "10 year warranty"}},
            )
            updated += res.modified_count
        except Exception:
            pass
    print(f"[content] normalised warranty phrasing on {updated} docs")


async def main():
    await migrate_homes()
    await migrate_packages()
    await migrate_compare_table()


if __name__ == "__main__":
    asyncio.run(main())
