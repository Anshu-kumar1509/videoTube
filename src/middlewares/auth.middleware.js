import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

export const verifyJWT = async(req, _, next)=>{  // not using res in whole function
    try {
        // getting cookie-token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if(!token){
            throw new ApiError(409, "No token");
        }
    
        // verify and returns token payload
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); 
    
        // get user document and remove pass and refreshtoken from it
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "invalid token");
        }
    
        // adding a method .user to middleware which will give the user
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(407, error?.message || "Inavalid access token");
    }
}