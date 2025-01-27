import {RequestHandler} from "express";
import {ZodError, ZodObject} from "zod";
import {ServiceResponse} from "../models/serviceResponse";

export const validateBody = (schema: ZodObject<any>) => {
    return ((req, res, next) => {
        try {
            req.body = schema.parse(req.body)
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json(ServiceResponse.failure(
                    "Invalid request body",
                    {
                        issues: error.issues,
                    }
                ));
            }
            return res.status(400).json(ServiceResponse.failure(
                "Invalid request body",
                {
                    error: error.message,
                }
            ));
        }
    }) as RequestHandler;
}