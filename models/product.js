const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    sale: {
      type: String,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    quantitySold: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    productPictures: {
      type: Array,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categoryInfo: [
      {
        name: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    labels: {
      type: Array,
      required: false
    },
  },
  { timestamps: true }
);

productSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('The product existed'));
  } else {
    next();
  }
});

module.exports = mongoose.model("Product", productSchema);
