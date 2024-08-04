const exp=require("express");
const productApp=exp.Router();
const expressAsyncHandler=require('express-async-handler');
productApp.get('/products',expressAsyncHandler(async(req,res)=>{
    let productsCollection=req.app.get('productsCollection')

    let productsList=await productsCollection.find().toArray()

    res.send({message:'products',payload:productsList})
}))
productApp.get('/products/:id',expressAsyncHandler(async(req,res)=>{
    //get prod call obj
    let productsCollection=req.app.get('productsCollection')
    //get product id from url
    let productId=Number(req.params.id)
    //read product by id
    let product=await productsCollection.findOne({id:productId})
    //send res
    res.send({message:'products',payload:product})

}))
productApp.get('/menu-items',expressAsyncHandler(async(req,res)=>{
    //get prod call obj
    let menuCollection=req.app.get('menuCollection')
    let menuitems = await menuCollection.find().toArray();
    let categories = menuitems ? menuitems.categories : [];
    //send res
    res.send({message:'products',payload:menuitems})

}))

productApp.get('/items',expressAsyncHandler(async(req,res)=>{
    //get prod call obj
    let itemsCollection=req.app.get('itemsCollection')
    let items = await itemsCollection.find().toArray();
  //  let categories = items ? : [];
    //send res
    res.send({message:'products',items})

}))

module.exports =productApp;