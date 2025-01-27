import type {Request} from "express";
import {rateLimit} from "express-rate-limit";


const rateLimiter = rateLimit({
    legacyHeaders: true,
    limit: parseInt(process.env.COMMON_RATE_LIMIT_MAX_REQUESTS) || 100,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    windowMs: 60 * (parseInt(process.env.COMMON_RATE_LIMIT_WINDOW_MS) || 1000),
    keyGenerator: (req: Request) => req.ip as string,
});

export default rateLimiter;
