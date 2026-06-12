import { Ratelimit, Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export function createRateLimit({ requests, window, prefix }: {
    requests: number, 
    window: Duration,
    prefix: string,
}) {
    return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(requests, window),
        prefix: `${prefix}:ratelimit:${requests}:${window.replace(/\s+/g, "_")}`,
        analytics: true,
    });
}
