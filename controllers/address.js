const Address = require("../models/address");
const {
  ServerError,
  Create,
  Update,
  Get,
  Delete,
  NotFound,
} = require("../ulti/response");

exports.add = (req, res) => {
  const { address } = req.body;
  Address.findOneAndUpdate(
    { user: req.user._id },
    {
      $push: {
        address,
      },
    },
    { new: true, upsert: true }
  ).exec((error, userAddress) => {
    if (error) return ServerError(res, error.message);
    if (userAddress) return Create(res, { userAddress });
  });
};

exports.update = (req, res) => {
  const { address } = req.body;
  Address.findOneAndUpdate(
    { user: req.user._id, "address._id": address._id },
    {
      $set: {
        "address.$": address,
      },
    },
    { new: true }
  ).exec((error, userAddress) => {
    if (error) return ServerError(res, error.message);
    if (userAddress) return Update(res, { userAddress });
  });
};

exports.deleteAddress = async (req, res) => {
  const { address } = req.body;
  Address.findOneAndUpdate(
    { user: req.user._id, "address._id": address._id },
    {
      $pull: {
        address: { _id: address._id },
      },
    },
    { new: true }
  ).exec((error, userAddress) => {
    if (error) return ServerError(res, error.message);
    if (userAddress) return Update(res, { userAddress });
  });
};

exports.get = (req, res) => {
  Address.findOne({ user: req.user._id }).exec((error, userAddress) => {
    if (error) return ServerError(res, error.message);
    if (userAddress) return Get(res, { userAddress });
  });
};
