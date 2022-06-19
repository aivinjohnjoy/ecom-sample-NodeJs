
var express = require('express');
const response = require('../app');
var express = require('express');
var router = express.Router();
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers');

const varifyLogin = (req, res, next) => {
  if (req.session.userloggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}



/* GET home page. */
router.get('/', async function (req, res, next) {

  let user = req.session.user
  let cartCount = await userHelpers.cartcountCheck(req.session.user)


  productHelper.getAllPtoducts().then((products) => {

    res.render('User/view-products', { products, user, cartCount })
  })

});

router.get('/login', (req, res) => {
  if (req.session.userloggedIn) {
    res.redirect('/')

  } else {
    res.render('User/login', { 'loginErr': req.session.userloginErr })
    req.session.userloginErr = false
  }

})
router.post('/login', (req, res) => {
  console.log('log', req.body)

  userHelpers.doLogin(req.body).then((response) => {

    if (response.status) {

      req.session.user = response.user
      req.session.userloggedIn = true
      res.redirect('/')

    } else {
      req.session.userloginErr = "Invalid Username or Password"
      res.redirect('/login')

    }

  })
})

router.get('/signup', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')

  } else {
    res.render('User/signup')
  }

})

router.post('/signup', (req, res) => {

  var user = {
    Email: req.body.Email,
    Password: req.body.Password
  }

  userHelpers.doSignup(req.body).then((data) => {
    userHelpers.doLogin(user).then((response) => {



      req.session.user = response.user
      req.session.userloggedIn = true
      res.redirect('/')

    })
  })

})
router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userloggedIn = false
  res.redirect('/')
})

router.get('/cart', varifyLogin, async (req, res) => {
  let ItemTotal = await userHelpers.getItemTotal(req.session.user._id)
  let products = await userHelpers.getCartProduct(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)

  console.log('to cart prtoducts', total)





  res.render('user/cart', { ItemTotal, user: req.session.user, total })

})

router.get('/add-to-cart/:id', (req, res) => {
  console.log('api call for cart received out side if')
  if (req.session.user) {
    console.log('api call for cart received in side if')
    userHelpers.AddToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true })
    })
  } else {
    console.log('api call for cart received in side else')
    res.redirect('/login')
  }


})


router.post('/change-product-quantity', (req, res, next) => {


  userHelpers.changequantity(req.body).then(async (response) => {
    let total = await userHelpers.getTotalAmount(req.session.user._id)



    res.json({ status: true, total })
  })
})


router.post('/remove-btn', (req, res, next) => {



  userHelpers.removeBtn(req.body).then((response) => {

    res.json(response)
  })
})



router.get('/place-order', varifyLogin, async (req, res, next) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('User/CheckOut', { total, user: req.session.user })
})

router.post('/place-order', async (req, res) => {
  console.log('payment method post boday', req.body)
  let products = await userHelpers.getCartProductList(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  userHelpers.placeOrder(req.body, products, total).then((orderId) => {
    if (req.body['paymentMethod'] == 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json(response)
      })
    }

  })
})

router.get('/orderSuccess', (req, res) => {
  res.render('User/orderSuccess',)
})

router.get('/view-order', varifyLogin, async (req, res) => {
  var order = await userHelpers.getOrders(req.session.user._id)

  res.render('User/Orders', { user: req.session.user, order })
})


router.get('/order-details/:id', async (req, res) => {
  console.log('order get', req.params.id)
  let product = await userHelpers.getOrderDetails(req.params.id)
  console.log('order Items ', product)
  res.render('User/order-details', { product })
})

router.post('/verify-payment', (req, res) => {

  userHelpers.verifyPayemnt(req.body).then(() => {
    userHelpers.changePaymentstatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false, errMsg: '' })
  })
})


router.get('/search-result/:q', async (req, res) => {
  console.log(req.params.q)

  let SearchResults = await userHelpers.productSearch(req.params.q)
  let cartCount = await userHelpers.cartcountCheck(req.session.user)
  res.render('User/searchResult', { SearchResults, user: req.session.user, cartCount })

})


module.exports = router;

