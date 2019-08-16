class ProductController
{
    constructor(){
        this.mongoDB = require("mongodb");
        this.mongoClient = this.mongoDB.MongoClient;
    }

    connectToDB(){
        let dbPromise= new Promise((resolve, reject) => {
            let conStr = 'mongodb://localhost:27017/testDB';
            this.mongoClient.connect(conStr,{ useNewUrlParser: true },(err, mongoCon) =>{
                if(err){
                    console.log("Error in connection to DB");
                    reject (err);
                }
                else{
                    console.log("Connection Established...");
                    resolve (mongoCon);
                }
            });
        });
        return dbPromise;
    }

    async insertProduct(prd){
        let mongoCon= await this.connectToDB();
        const dbCon = mongoCon.db("testDB");
        dbCon.collection("product").insertOne(JSON.parse(prd), (err, res) => {
            if(err)
                return err;
            else{
                console.log("Product Inserted...");
                mongoCon.close();
                return "Product Inserted...";
            }
        });
    }

   async getAllProducts(){
        return new Promise((resolve, reject) =>{
            this.connectToDB().then((mongoCon) =>{
                const dbCon = mongoCon.db("testDB");
                dbCon.collection("product").find().toArray((err, result) => {
                    if(err){
                        console.log("Error in getAllProducts..");
                        reject(err);
                    }
                    else{
                        console.log("getAllProducts successfully..")
                        mongoCon.close();
                        resolve(result);
                    }
                })
            }).catch((err)=>{reject(err)});
        });
    }


   async removeProduct(name){
        return new Promise((resolve, reject) =>{
            this.connectToDB().then((mongoCon) =>{
                const dbCon = mongoCon.db("testDB");
                dbCon.collection("product").deleteOne({ name : name },(err, result) => {
                    if(err){
                        console.log("Error in remove Product..");
                        reject(err);
                    }
                    else{
                        console.log("remove product successfully..")
                        mongoCon.close();
                        resolve(result);
                    }
                })
            }).catch((err)=>{reject(err)});
            
        });
    }
    


  async getProduct(name){
        return new Promise((resolve, reject) =>{
            this.connectToDB().then((mongoCon) =>{
                const dbCon = mongoCon.db("testDB");
                dbCon.collection("product").find({ name : name }).toArray((err, result) => {
                    if(err){
                        console.log("Error in getProduct..");
                        reject(err);
                    }
                    else{
                        console.log("getProduct successfully..")
                        mongoCon.close();
                        resolve(result);
                    }
                })
            }).catch((err)=>{reject(err)});
        });
    }
    

   async updateProduct(obj){
        return new Promise((resolve, reject) =>{
            this.connectToDB().then((mongoCon) =>{
                const dbCon = mongoCon.db("testDB");
                var editObj=JSON.parse(obj);
              //  console.log(editObj);
                dbCon.collection("product").updateOne({ name : editObj.name }, { $set: { 
                     color : editObj.color  , model : editObj.model
                     , price : editObj.price , details : editObj.details , quantity : editObj.quantity
                    , brand : editObj.brand ,weight : editObj.weight } },(err, result) => {
                        if(err){
                            console.log("Error in update product..");
                            reject(err);
                        }
                        else{
                            console.log(" update product successfully..")
                            mongoCon.close();
                            resolve(result);
                        }
                    })
            
            }).catch((err)=>{reject(err)});
        });
    }


   async updateProductQuantity(name,quantity){
        return new Promise((resolve, reject) =>{
            this.connectToDB().then((mongoCon) =>{
                const dbCon = mongoCon.db("testDB");
                dbCon.collection("product").updateOne({ name : name }, { $set: {  quantity : quantity } }
                    ,(err, result) => {
                        if(err){
                            console.log("Error in updateProductQuantity ..");
                            reject(err);
                        }
                        else{
                            console.log(" updateProductQuantity successfully..")
                            mongoCon.close();
                            resolve(result);
                        }
                    })
            
            }).catch((err)=>{reject(err)});
        });
    }



    
}

module.exports=ProductController;