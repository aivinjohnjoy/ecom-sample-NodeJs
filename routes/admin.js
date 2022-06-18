var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const { check, validationResult } = require('express-validator');
var alert = false

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelper.getAllPtoducts().then((products) => {
    res.render('admin/View Products', { products, admin: true })

  })


});

router.get('/add-product', function (req, res) {

  res.render('admin/add-product', { admin: true, alert })
  alert = false;
}),

  router.post('/add-product', (req, res) => {

    if (req.body == null || req.files == null) {
      alert = 'please fill the fields'
      return res.redirect('/admin/add-product')


    } else {
      productHelper.addProduct(req.body, (id) => {

        image = req.files.image
        console.log('id =', id)
        image.mv('./public/product-image/' + id + '.jpg', (err, done) => {
          if (!err) {
            res.render('admin/add-product', { admin: true })

          } else console.log('error is   ', err)
        })

      })

    }





  })

router.get('/productdelete/:id', (req, res) => {
  let proId = req.params.id
  productHelper.deleteProduct(proId).then((response) => {
    res.redirect('/admin/')
  })

})

router.get('/productedit/:id', async (req, res) => {
  let proDetails = await productHelper.getProductDetails(req.params.id).then((response) => {
    console.log(response)
    res.render('admin/edit-product', response)
  })

})

router.post('/productedit/:id', (req, res) => {
  productHelper.updateProduct(req.params.id, req.body).then(() =>{
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-image/' + req.params.id + '.jpg')
    }
  })
})


module.exports = router;