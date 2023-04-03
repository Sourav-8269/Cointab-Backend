const express=require("express");
const {UserModel} = require("../models/User.model");

const userRouter=express.Router();

const bcrypt=require("bcrypt");

const jwt=require("jsonwebtoken");

userRouter.use(express.json());

let date=new Date();
// let min=date.getMinutes();
// let hrs=date.getHours();
// console.log(min,hrs)

userRouter.get("/",async(req,res)=>{
    const user=await UserModel.find();
    res.send(user);
})



userRouter.post("/register",async(req,res)=>{
    const {email,password}=req.body;
    // console.log(email,password)
    try{
        bcrypt.hash(password,5,async(err,secure_password)=>{
            try{
                const user=new UserModel({
                    email,
                    password:secure_password,
                    minutes:0,
                    hours:0,
                    incorrect_password_count:0
                });
                console.log(user)
                await user.save();
                res.send("Registered");
            }catch(err){
                res.send("Something went wrong");
                console.log(err)
            }
        })
    }catch(err){
        res.send("Something went wrong");
        console.log(err)
    }
})

userRouter.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    try{
        const user=await UserModel.find({email});
        console.log(user)
        console.log(user[0].hours,date.getHours());
        console.log(user[0].minutes,date.getMinutes())
        if(user.length!=0){
            const hashed_pass=user[0].password;
            bcrypt.compare(password, hashed_pass,async(err,result)=>{
                if(result && (user[0].incorrect_password_count < 6) && (((user[0].hours==0) && (user[0].minutes = 0)) || (user[0].hours - date.getHours() <= 0) && (user[0].minutes - date.getMinutes() <= 0))){
                    var token = jwt.sign({ userID:user[0]._id }, process.env.key);
                    user[0].incorrect_password_count = 0;
                    user[0].hours = 0;
                    user[0].minutes = 0;
                    res.send({"msg":"Login Success","token":token,"user":user[0].email});
                    await user[0].save()

                }else if(user[0].incorrect_password_count >= 5){
                    const hour = date.getHours();
                    const min = date.getMinutes()
                    user.hours = hour;
                    user.minutes = min;
                    
                    res.send({"msg" : "You can try after 24 hours", "Hour" : hour , "Minutes" : min})
                    // await user.save()
    
                }else{
                    user[0].incorrect_password_count++,
                    await user[0].save()
                    res.send({"msg":"Wrong Credentials","Remaning":5-user[0].incorrect_password_count+1});
                    // console.log(err);
                }
            });
        }else{
            res.send("New User Please Register First");
        }
    }catch(err){
        console.log("Something went wrong");
        console.log(err)
    }
})

module.exports={userRouter};