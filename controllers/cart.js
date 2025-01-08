const Cart = require("../models/cart");
const {
  ServerError,
  Create,
  Response,
  Delete,
  Get,
  NotFound,
  BadRequest,
} = require("../ulti/response");
const runUpdate = (condition, update) => {
  return new Promise((resolve, reject) => {
    Cart.findOneAndUpdate(condition, update, { upsert: true, new: true })
      .populate(
        "cartItems.product",
        "_id name salePrice productPictures quantity"
      )
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};
const createCartItems = (cart) => {
  let cartItems = {};
  cart.cartItems.forEach((item, index) => {
    const { product, quantity } = item;
    const { _id, name, salePrice, productPictures } = product;
    cartItems[_id.toString()] = {
      _id,
      name,
      price: salePrice,
      quantity,
      img: productPictures[0],
      stock: product.quantity,
    };
  });
  return cartItems;
};
exports.add = (req, res) => {
  Cart.findOne({ user: req.user._id }).exec((error, cart) => {
    if (error) return ServerError(res, error.message);
    if (cart) {
      let promises = [];
      req.body.cartItems.forEach((cartItem) => {
        const product = cartItem.product;
        const item = cart.cartItems.find((c) => c.product == product);
        let condition, update;
        if (item) {
          condition = {
            user: req.user._id,
            "cartItems.product": product,
          };
          update = {
            $set: {
              "cartItems.$": cartItem,
            },
          };
        } else {
          condition = { user: req.user._id };
          update = { $push: { cartItems: cartItem } };
        }
        promises.push(runUpdate(condition, update));
      });
      Promise.all(promises)
        .then((cart) => {
          const cartItems = createCartItems(...cart);
          return Create(res, { cartItems });
        })
        .catch((error) => ServerError(res, error.message));
    } else {
      const newCart = new Cart({
        user: req.user._id,
        cartItems: req.body.cartItems,
      });
      newCart.save(async (error, cart) => {
        if (error) return ServerError(res, error.message);
        const cartPopulated = await Cart.findById({ _id: cart._id }).populate(
          "cartItems.product",
          "_id name salePrice productPictures quantity"
        );
        const cartItems = createCartItems(cartPopulated);

        return Get(res, { cartItems });
      });
    }
  });
};
exports.get = (req, res) => {
  Cart.findOne({ user: req.user._id })
    .populate(
      "cartItems.product",
      "_id name salePrice productPictures quantity"
    )
    .exec((error, cart) => {
      if (error) return ServerError(res, error.message);
      if (cart) {
        let cartItems = createCartItems(cart);
        return Get(res, { cartItems });
      }
      return BadRequest(res, "Empty cart");
    });
};

exports.removeItem = (req, res) => {
  const { productId } = req.body;
  if (!productId) return NotFound(res, productId);
  Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: {
        cartItems: {
          product: productId,
        },
      },
    },
    { new: true }
  )
    .populate(
      "cartItems.product",
      "_id name salePrice productPictures quantity"
    )
    .exec((error, cart) => {
      if (error) return ServerError(res, error.message);
      if (cart) {
        let cartItems = createCartItems(cart);
        return Delete(res, { cartItems });
      }
    });
};
