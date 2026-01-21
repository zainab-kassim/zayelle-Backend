import { Response } from "express"

//set cookies
export function SetAccessTokenCookieOptions(res: Response, accessToken: string) {
    res.cookie('accessToken', accessToken, {
        sameSite: 'strict',
        path: '/',
        secure: false,
        httpOnly: true,
        maxAge: 20 * 60 * 1000, // 20 minutes 
    })
}

export function SetRefreshTokenCookieOptions(res: Response, refreshToken: string) {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const bufferTimeInMs = 60 * 60 * 1000; // Subtract 1 hour (3600000 ms)

    res.cookie('refreshToken', refreshToken, {
        sameSite: 'strict',
        path: '/',
        secure: false,
        httpOnly: true,
        maxAge: sevenDaysInMs - bufferTimeInMs
    })
}



export function RemoveAccessTokenCookieOptions(res: Response) {
    res.clearCookie('accessToken', {
        sameSite: 'strict',
        path: '/',
        secure: false,
        httpOnly: true,
    })
}

export function RemoveRefreshTokenCookieOptions(res: Response) {
    res.clearCookie('refreshToken', {
        path: '/',
        sameSite: 'strict',
        secure: false,
        httpOnly: true,
    })
}