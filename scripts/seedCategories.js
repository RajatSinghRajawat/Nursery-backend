/**
 * Run: node scripts/seedCategories.js (from Nursery-Backend root, after MONGO_URI in .env)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Category = require("../src/models/Categories");

const SEED = [
  { slug: "indoor-plants", name: "Indoor Plants", description: "Indoor collection" },
  { slug: "outdoor-plants", name: "Outdoor Plants", description: "Outdoor collection" },
  { slug: "gardening-tools", name: "Gardening Tools", description: "Tools collection" },
  { slug: "pots-planters", name: "Pots & Planters", description: "Planters" },
  { slug: "seeds-bulbs", name: "Seeds & Bulbs", description: "Seeds" },
  { slug: "plant-care", name: "Plant Care", description: "Care products" },
];

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || undefined });
  for (const row of SEED) {
    await Category.findOneAndUpdate(
      { slug: row.slug },
      {
        $setOnInsert: {
          name: row.name,
          description: row.description,
          slug: row.slug,
          kind: "Plants",
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    console.log("Category:", row.slug);
  }
  console.log("Done.");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
