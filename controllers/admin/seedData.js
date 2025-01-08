const fs = require("fs");
const path = require("path");

const Cart = require("../../models/cart");
const Order = require("../../models/order");
const Address = require("../../models/address");
const Product = require("../../models/product");
const Category = require("../../models/category");
const {
  ServerError,
  Create,
  Response,
  Delete,
  Get,
  Update,
  NotFound,
  BadRequest,
} = require("../../ulti/response");

//http://localhost:8000/api/seed/product
exports.seedDataProduct = async (req, res) => {
  const productData = path.join(__dirname, "..", "..", "data", "mobile.json");

  fs.readFile(productData, "utf8", function (err, data) {
    if (err) throw err;
    obj = JSON.parse(data);

    Product.insertMany(obj)
      .then(function (mongooseDocuments) {
        console.log(mongooseDocuments);
      })
      .catch(function (err) {
        console.log(err);
      });
  });

  return Get(res, { stop: 1 });
};

exports.seedDataOrder = (req, res) => {
  const orderData = path.join(__dirname, "..", "..", "data", "order.json");

  fs.readFile(
    orderData,
    "utf8",
    function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);

      Order.insertMany(obj)
        .then(function (mongooseDocuments) {
          console.log(mongooseDocuments);
        })
        .catch(function (err) {
          console.log(err);
        });
    }
  );

  // Order.deleteMany({ }, function (err) { console.log(err) })
  // Order.updateMany({addressId:'60ffc3bdb60e13260c448b14' }, function (err) { console.log(err) })
  return Get(res, { stop: 1 });
};
