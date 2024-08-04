//create mini-express app
const exp = require("express");

const userApp = exp.Router();
const bcryptjs=require('bcryptjs')
const jwt=require('jsonwebtoken')
const tokenVerify=require('../middlewares/tokenVerify.js')
const expressAsyncHandler=require('express-async-handler')

//add body parser middleware
userApp.use(exp.json());

//create sample rest api(req handlers- routes)
//route to get users(protected route)
userApp.get("/users", tokenVerify,expressAsyncHandler(async (req, res) => {
  //get usersCollection obj
  const usersCollection = req.app.get("usersCollection");
  //get users data from usersCollection of DB
  let usersList = await usersCollection.fnd().toArray();
  //send users data to client
  res.send({ message: "users", payload: usersList });
}));



//route to send one user by id(protected route)
userApp.get("/users/:username", tokenVerify,expressAsyncHandler(async(req, res) => {
  //get usersCollection obj
  const usersCollection = req.app.get("usersCollection");
  //get id from url
  const usernameOfUrl=req.params.username;
  //find user by id
  let user=await usersCollection.findOne({username:{$eq:usernameOfUrl}})
  //send res
  res.send({message:"one user",payload:user})
}));




//route to create user (public route)
userApp.post("/user", expressAsyncHandler(async(req, res) => {

  //get usersCollection obj
  const usersCollection = req.app.get("usersCollection");
  //get new User from client
  const newUser=req.body;

   //verify duplicate user
   let existingUser=await usersCollection.findOne({username:newUser.username})
   //if user already existed
   if(existingUser!==null){
     res.send({message:"User already existed"})
   }
   //if user not existed
   else{
     //hash the password
     let hashedpassword= await bcryptjs.hash(newUser.password,7)
     //replace plain password with hashed password in newUser
     newUser.password=hashedpassword;
     //save user
     newUser.cart=[];
     newUser.address=[];
     await usersCollection.insertOne(newUser)
     //send res
     res.send({message:"user created"})
   }
}));



//user login(authentication)(public route)
userApp.post('/login',expressAsyncHandler(async(req,res)=>{
  //get usersCollection obj
const usersCollection = req.app.get("usersCollection");
//get new UserCredentils from client
const userCred=req.body;
//verify username
let dbUser=await usersCollection.findOne({username:userCred.username})
//if user not existed
if(dbUser===null){
 res.send({message:"Invalid username"})
}
//if user found,compare passwords
else{
   let result=await bcryptjs.compare(userCred.password,dbUser.password)
   if(result===false){
     res.send({message:"Invalid password"})
   }
   else{
      let signedToken= jwt.sign({username:userCred.username},'abcdef',{expiresIn:'1h'})
    
     res.send({message:"login success",token:signedToken,user:dbUser})
   }
}

}))
userApp.put("/user", tokenVerify,expressAsyncHandler(async(req, res) => {
      const usersCollection = req.app.get("usersCollection");
      let modifiedUser=req.body;
      await usersCollection.updateOne({username:modifiedUser.username},{$set:{...modifiedUser}})
      res.send({message:"User modified"})
}));

userApp.delete("/user/:id", tokenVerify,expressAsyncHandler((req, res) => {
  
}));
userApp.put("/add-to-cart/:username",expressAsyncHandler(async(req, res) => {
  const usersCollection = req.app.get("usersCollection");
  let usernameFromurl=req.params.username;
  let pro=req.body;
  console.log(pro);
  console.log('sasi');
  let result=await usersCollection.updateOne({username:usernameFromurl},{$push:{products:pro}})
  res.send({message:"product added",payload:result})

  res.send({message:pro})
}));

userApp.delete("/user/:id", tokenVerify,expressAsyncHandler((req, res) => {

}));
userApp.post("/carts-add/:username", expressAsyncHandler(async (req, res) => {
  try {
    const usersCollection = req.app.get("usersCollection");
    const usernameFromUrl = req.params.username;
    const product = req.body;
  
    if (!product || !product.name || product.count === undefined) {
      return res.status(400).send({ message: "Invalid product data" });
    }
    const user = await usersCollection.findOne({ username: usernameFromUrl });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    product.count=1;
    await usersCollection.updateOne(
      { username: usernameFromUrl },
      { $push: { cart: product } }
    );
    const updatedUser = await usersCollection.findOne({ username: usernameFromUrl });
    res.send({ message: "Product added", payload: updatedUser.cart });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
}));



userApp.put("/carts-add/:username", expressAsyncHandler(async (req, res) => {
  try {
    const usersCollection = req.app.get("usersCollection");
    const usernameFromUrl = req.params.username;
    const product = req.body;

    if (!product || !product.name || product.count === undefined) {
      return res.status(400).send({ message: "Invalid product data" });
    }
    const user = await usersCollection.findOne({ username: usernameFromUrl });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
      await usersCollection.updateOne(
        { username: usernameFromUrl, "cart.name": product.name },
        { $inc: { "cart.$.count": 1 } }
      );
    const updatedUser = await usersCollection.findOne({ username: usernameFromUrl });
    res.send({ message: "Product added/updated", payload: updatedUser.cart });
  } catch (error) {
    console.error("Error adding/updating product in cart:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
}));



userApp.put("/carts-remove/:username", expressAsyncHandler(async (req, res) => {
  try {
    const usersCollection = req.app.get("usersCollection");
    const usernameFromUrl = req.params.username;
    const productToRemove = req.body;

    if (!productToRemove || !productToRemove.name || productToRemove.count === undefined) {
      return res.status(400).send({ message: "Invalid product data" });
    }
   console.log(productToRemove.count);
    if (productToRemove.count <= 1) {
      await usersCollection.updateOne(
        { username: usernameFromUrl },
        { $pull: { cart: { name: productToRemove.name } } }
      );
    } else {
      const user = await usersCollection.findOne({ username: usernameFromUrl }, { projection: { cart: 1, _id: 0 } });
      if (user) {
        const product = user.cart.find(item => item.name === productToRemove.name);
        if (product) {
          if (product.count > 1) {
            product.count = productToRemove.count-1;
            await usersCollection.updateOne(
              { username: usernameFromUrl, "cart.name": productToRemove.name },
              { $set: { "cart.$.count": product.count } }
            );
          } else {
            await usersCollection.updateOne(
              { username: usernameFromUrl },
              { $pull: { cart: { name: productToRemove.name } } }
            );
          }
        }
      }
    }

    const updatedUser = await usersCollection.findOne({ username: usernameFromUrl }, { projection: { cart: 1, _id: 0 } });
    console.log(updatedUser.cart);
    res.send({ message: "Product removed", payload: updatedUser.cart });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
}));


//route to send one user by id(protected route)
userApp.get("/cart-display/:username",expressAsyncHandler(async(req, res) => {
  const usersCollection = req.app.get("usersCollection");
  //get id from url
  const usernameOfUrl=req.params.username;
 // console.log( usernameOfUrl);
  //find user by id
  let r=await usersCollection.findOne({username:usernameOfUrl})
  //send res
  console.log(r);
  //console.log('welcome to india')
 //console.log(r.cart)
  res.send({message:"one user",payload:r.cart})
}));

//saving the address in the user profile
userApp.put("/address-add/:username", expressAsyncHandler(async (req, res) => {
  const usersCollection = req.app.get("usersCollection");
  const usernameFromUrl = req.params.username;
  const newAddress = req.body;
  await usersCollection.updateOne(
      { username: usernameFromUrl },
      { $set: { address: newAddress } }
  );
  const updatedUser = await usersCollection.findOne({ username: usernameFromUrl });
  if (updatedUser && updatedUser.address) {
      res.send({ message: "Saved address", payload: updatedUser.address });
  } else {
      res.status(404).send({ message: "User not found" });
  }
}));





//route to delete user(protected route)
userApp.delete("/user/:id", tokenVerify,expressAsyncHandler((req, res) => {

}));

//export userApp
module.exports = userApp;