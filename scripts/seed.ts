import "./env";
import { db } from "../src/server/db";
import { seed } from "../src/server/seed";

seed(db)
  .then((result) => {
    console.log("Seeded Westbrook program", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
