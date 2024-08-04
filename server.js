const exp=require('express')
const app=exp();
const cors = require('cors');
app.use(cors({ origin: "http://localhost:5173" }))
require('dotenv').config()
const {MongoClient}=require('mongodb');  
let mClient=new MongoClient('mongodb+srv://sasimaddipati65:rUgvQEMpdYP8j198@cluster0.owe0bsc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')

mClient.connect()
.then((connectionObj)=>{
    const fsddb=connectionObj .db('sasimaddipati')
    const usersCollection=fsddb.collection('user')
    const productsCollection=fsddb.collection('products')
    const menuCollection=fsddb.collection('menu')
    const itemsCollection=fsddb.collection('items')
    app.set('usersCollection',usersCollection);
    app.set('productsCollection',productsCollection);
    app.set('menuCollection',menuCollection);
    app.set('itemsCollection',itemsCollection);
    console.log("db connection success")
    app.listen(4000,()=>console.log("http server started at port 4000"))
})

const userApp=require("./API/user")
const productApp=require("./API/product")

app.use('/user-api',userApp)
app.use('/product-api',productApp)
app.use('*',(req,res,next)=>{
    console.log(req.path)
    res.send({message:"invalid path"})
})
app.use((err,req,res,next)=>{
    res.send({message:"error occurred",errorMessage:err.message})
})