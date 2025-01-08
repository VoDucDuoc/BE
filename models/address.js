const mongoose = require("mongoose");
const address = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  ward: {
    type: String,
    required: true,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  alternativePhone: {
    type: String,
  },
  type: {
    type: String,
    required: true,
    enum: ["home", "work"],
  },
});

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: "User"
    },
    address: [address]
}, {timestamps: true})

module.exports = mongoose.model("Address", addressSchema)
