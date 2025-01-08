const mongoose = require("mongoose");

const labelSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique:true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    listProduct: {
      type:Array,
      required:false,
      trim:true,
    }
  },
  { timestamps: true }
);

// productSchema.post('save', function (error, doc, next) {
//   if (error.name === 'MongoError' && error.code === 11000) {
//     next(new Error('The product existed'));
//   } else {
//     next();
//   }
// });

module.exports = mongoose.model("Label", labelSchema);
