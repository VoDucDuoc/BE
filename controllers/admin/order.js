const Address = require("../../models/address");
const Order = require("../../models/order");
const { BadRequest, ServerError, Get } = require("../../ulti/response");

exports.update = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.body._id },
    {
      $set: {
        process: req.body.process,
      },
    },
    { new: true }
  ).populate("items.productId", "name productPictures");

  const orderWithAddress = await populateAddress([order]);

  if (order) return res.status(201).json({ order: orderWithAddress });
};

const populateAddress = async (orders) => {
  let orderPromises = [];
  orders.forEach((order) => {
    const newPromise = new Promise((resolve, reject) => {
      Address.findOne({ "address._id": order.addressId })
        .populate("user", "firstName lastName email")
        .exec((error, userAddress) => {
          if (error) reject({ error });
          userAddress.address.forEach((adr) => {
            if (adr._id.toString() === order.addressId.toString()) {
              order.address = adr;
            }
          });
          resolve(order);
        });
    });
    orderPromises.push(newPromise);
  });
  const newOrders = await Promise.all(orderPromises)
    .then((response) => response)
    .catch((error) => error);
  return newOrders;
};

exports.getAll = async (req, res) => {
  const orders = await Order.find({}).populate("items.productId", "name");
  return res.json({ orders });
};

exports.getById = (req, res) => {
  const { _id } = req.params;
  Order.findOne({ _id })
    .populate("items.productId", "_id name productPictures")
    .lean()
    .exec((error, order) => {
      if (error) return ServerError(res, error);
      if (!order) return BadRequest(res, "Order does not exist");
      Address.findOne({ user: order.user }).exec((error, userAddress) => {
        if (error) return ServerError(res, error);
        if (!userAddress) return BadRequest(res, "User address does not exist");
        order.address = userAddress.address.find(
          (adr) => adr._id.toString() === order.addressId.toString()
        );
        return Get(res, { order });
      });
    });
};
