import { storage } from "./storage";

export async function runSeed() {
  try {
    console.log("Starting seed data generation...");
    await storage.seedData();
    console.log("Seed data generated successfully!");
    console.log("Created:");
    console.log("- 8 categories");
    console.log("- 3 test users");
    console.log("- 20 test products");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSeed();
}
