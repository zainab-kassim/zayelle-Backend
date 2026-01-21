import { NextFunction, Request, Response } from "express";

export function handleAsyncErr(fn: Function) {
    return async function (req: Request, res: Response, next: NextFunction) {
        try{
           await fn(req, res, next)
        }catch(err){
            next(err)
        }
    }
}