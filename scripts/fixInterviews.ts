import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const main = async () => {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    console.log("Starting to fix interview endTimes...");

    try {
        await client.mutation(api.interviews.fixUnsetEndTimes);
        console.log("Successfully fixed interview endTimes");
    } catch (error) {
        console.error("Error fixing interview endTimes:", error);
    }
};

main().catch(console.error); 