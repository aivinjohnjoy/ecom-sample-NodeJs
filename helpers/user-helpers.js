const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { USER_COLLECTION } = require('../config/collections')
const { response } = require('express')
const { Collection } = require('mongodb')
const objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const res = require('express/lib/response')
const { reject } = require('bcrypt/promises')
const { resolve } = require('path')
var instance = new Razorpay({ key_id: 'rzp_test_ESl6bw4QESz3CO', key_secret: '2Ar1z8colgVp5zFAiRSJVGay', });

module.exports = {
    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {

            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                console.log(data)
                resolve(data)


            })



        })


    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })


            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((state) => {
                    if (state) {
                        console.log('log in successful')
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('log in failed')
                    }
                    resolve({ status: false })
                })
            } else {
                console.log('log in failed no email found')
                resolve({ status: false })
            }

        })
    },



    AddToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let usercart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (usercart) {
                let proExist = usercart.products.findIndex(proIndex => proIndex.item == proId);
                console.log("pro exist ", proExist)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then((response) => { resolve() })
                } else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: {
                                products: proObj
                            }
                        }
                    ).then((response) => {
                        resolve()
                    })
                }



            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }


                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(cartItems)

        })
    },






    changequantity: (data) => {

        let count = parseInt(data.count)
        let quantity = parseInt(data.quantity)

        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(data.cart) }, {

                    $pull: {
                        products: { item: objectId(data.product) }
                    }
                }).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(data.cart), 'products.item': objectId(data.product) },
                        {
                            $inc: { 'products.$.quantity': count }
                        }).then((response) => {

                            resolve(true)
                        })
            }



        })

    },


    removeBtn: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(data.cart) }, {

                $pull: {
                    products: { item: objectId(data.product) }
                }

            }).then((response) => {
                resolve({ removeProduct: true })
            })


        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }


                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.Price', to: 'int' } }] } }
                    }
                }

            ]).toArray()
            console.log('cart total **', total)

            if (total.length === 0) {

                resolve(total = 0)

            } else {
                resolve(total[0].total)

            }



        })
    },


    getItemTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItemTotal = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }


                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] },
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: 1, itemTotal: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.Price', to: 'int' } }] } }
                    }

                },
                {
                    $project: {
                        item: 1, quantity: 1, product: 1, itemTotal: 1
                    }

                }


            ]).toArray()

            resolve(cartItemTotal)

        })

    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log('place order', order, products, total)
            let status = order.paymentMethod === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                delivery: {
                    fname: order.Firstname,
                    lname: order.Lastname,
                    phone: order.Phone,
                    adrs1: order.Country,
                    adrs2: order.State,
                    date: new Date(),
                },
                userId: objectId(order.userId),
                paymentMethod: order.paymentMethod,
                products: products,
                total: total,
                status: status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response)
                console.log('response if plce order', response.insertedId)
            })
        })

    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },

    getOrders: (userId) => {

        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()

            resolve(orders)
        })

    },


    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        total: '$total'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, total: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },
    generateRazorpay: (orderId, total) => {

        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: 'INR',
                receipt: '' + orderId.insertedId
            };
            instance.orders.create(options, function (err, order) {
                console.log('order razorpay', order);
                resolve(order)
            });
        })
    },

    verifyPayemnt: (details) => {
        return new Promise((resolve, reject) => {
            var crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', '2Ar1z8colgVp5zFAiRSJVGay');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')

            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }



        })

    },

    changePaymentstatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            staus: "place"
                        }
                    }
                ).then(() => {
                    resolve()
                })
        })
    },

    productSearch: (word) => {
        return new Promise(async (resolve, reject) => {
            let key1 = word.searhKey
            let key = String(key1)
            console.log('key', key)
            // let searchResult= await db.get().collection(collection.PRODUCT_COLLECTION).
            //  aggregate([{$match : { Name: { '$regex':word.searhKey} }
            // }]).toArray()
            let searchResult = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Name: { '$regex': word, '$options': 'i' } }).toArray()
            console.log('search result', searchResult)
            resolve(searchResult)
        })

    },

    cartcountCheck: (user) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            if (user) {
                let cart = await db.get().collection(collection.CART_COLLECTION)
                    .aggregate([
                        {
                            $match: { user: objectId(user._id) }
                        },
                        {
                            $unwind: '$products'
                        }, {
                            $project: {

                                quantity: '$products.quantity',

                            }

                        }, {
                            $group: {
                                _id: null,
                                totalcount: { $sum: '$quantity' }

                            }
                        }
                    ]).toArray();
                console.log('cart count', cart)

                count1 = cart[0];
                count=count1.totalcount

                console.log('count', count)
                resolve(count)
            }
            resolve(count)

        })
    }




}