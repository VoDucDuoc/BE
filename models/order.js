const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        paidPrice: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    // status: {
    //   type: String,
    //   enum: ["pending", "completed", "cancelled", "refund"],
    // },
    paymentOption: {
      type: String,
      enum: ["cod", "zalo"],
      required: true,
    },
    process: [
      {
        type: {
          type: String,
          enum: ["in progress", "ordered", "shipped", "delivered"],
          required: true,
        },
        date: {
          type: Date,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);


module.exports = mongoose.model("Order", orderSchema);
