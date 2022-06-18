const db = require('../config/connection')
const collections = require('../config/collections')
const objectid = require('mongodb').ObjectId
module.exports = {

    addProduct: (product, callback) => {

        db.get().collection('product').insertOne(product).then((data) => {

            console.log(data)
            callback(data.insertedId)


        })
    },

    getAllPtoducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },


    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: objectid(proId) }).then((response) => {
                resolve(response)
            })

        })

    },

    getProductDetails(proId) {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectid(proId) }).then((response) => {
                resolve(response)
            })

        })


    },
    updateProduct(proId, proDetails) {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: objectid(proId) },
                {
                    $set: {
                        Name: proDetails.Name,
                        Description: proDetails.Description,
                        Price: proDetails.Price,
                        Category: proDetails.Category
                    }
                }
            ).then((response) => {
                resolve()
            })
        })
    }
}