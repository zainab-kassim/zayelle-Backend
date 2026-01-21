import { users } from '../models/user.model';
import bcrypt from 'bcrypt'
import { Request, Response } from "express";
import { GenerateAccessToken,GenerateRefreshToken } from "../auth/auth";
import { SetAccessTokenCookieOptions, SetRefreshTokenCookieOptions,RemoveRefreshTokenCookieOptions,RemoveAccessTokenCookieOptions } from "../utils/authCookies";
import { supabase } from '../config/db';




export const UserSignup = async (req: Request, res: Response) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    const {data:existingUser} = await supabase.from('users').select().eq('email', email).single();
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 20)

    const { data: newUser , error} = await supabase.from('users').insert({
        firstname : firstName,
        lastname : lastName,
        email,
        phonenumber : phoneNumber,
        password: hashedPassword,
    }).select().single();

      if (error || !newUser) {
        return res.status(500).json({ message: "Error creating user", error });
    }

    const accessToken = GenerateAccessToken({ email: newUser.email, id: newUser.id })
    const refreshToken = GenerateRefreshToken({ email: newUser.email, id: newUser.id })
      
    SetAccessTokenCookieOptions(res, accessToken)
    SetRefreshTokenCookieOptions(res, refreshToken)
    

    console.log("New user created:", newUser);
    res.status(200).json({message:"user signed up successfully",user:newUser})
}


export const UserLogin=async(req:Request,res:Response)=>{
    const { email, password } = req.body;

    const {data:user, error} = await supabase.from('users').select().eq('email',email).select().single()
    if (error || !user) {
        return res.status(404).json({message:"User not found"})
    }

    const isPasswordValid=await bcrypt.compare(password,user.password)

    if(!isPasswordValid){
        return res.status(401).json({message:"Invalid credentials"})
    }

    const accessToken = GenerateAccessToken({ email: user.email, id: user.id })
    const refreshToken = GenerateRefreshToken({ email: user.email, id: user.id })

    SetAccessTokenCookieOptions(res, accessToken)
    SetRefreshTokenCookieOptions(res, refreshToken)

    console.log("User logged in:", user);
    res.status(200).json({message:"user logged in successfully",user:user})
}


export const UserLogout=async(req:Request,res:Response)=>{
    RemoveAccessTokenCookieOptions(res)
    RemoveRefreshTokenCookieOptions(res)
    res.status(200).json({message:"user logged out successfully"})
}