
import { getCategories } from "./src/lib/google-sheets";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    try {
        const categories = await getCategories();
        console.log("FETCHED_CATEGORIES=" + JSON.stringify(categories));
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

main();
