import { serve } from "@hono/node-server";
import { env } from "./lib/env.js";
import { createApp } from "./app.js";

const app = createApp();

console.log(`Juvantage Business Core listening on http://localhost:${env.port}`);
serve({ fetch: app.fetch, port: env.port });
