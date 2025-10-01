import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    userName:{
        type: String,
        required: true,
        unique: true,
        lowerCase: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowerCase: true,
        trim: true,
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, //cloudanary image uploads
        required: true
    },
    coverImage:{
        type: String,
    },
    password:{
        type: String,
        required: [true,'password is required'],
        unique: true
    },
    watchHistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    refreshToken:{
        type: String
    }
},{timestamps: true});

//"pre" middleware that works before saving document in db
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
})

//custom method for schema
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password); // returns boolean
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        //payload
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },//signature
        process.env.ACCESS_TOKEN_SECRET,
        //expiry
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User',userSchema);