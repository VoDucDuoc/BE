const mongoose = require("mongoose");

const commentSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
    },
    comment: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          trim: true,
        },
        userName: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
        },
        createdAt: {
          type: Date,
          required: true,
        },
        subComment: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
              trim: true,
            },
            userName: {
              type: String,
              required: true,
            },
            content: {
              type: String,
              required: true,
            },
            createdAt: {
              type: Date,
              required: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
