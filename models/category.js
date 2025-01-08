const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
    },
    categoryImage: { type: String },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    normalField: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        // type: {
        //   type: String,
        //   enum: ['single', 'multiply'],
        //   required: true,
        //   trim: true,
        // },
        // valueType: {
        //   type: String,
        //   enum: ["text", "number"],
        //   required: true,
        //   trim: true,
        // },
      },
    ],
    filterField: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: Array,
          required: true,
          trim: true,
        },
        // type: {
        //   type: String,
        //   enum: ["single", "multiply"],
        //   required: true,
        //   trim: true,
        // },
        // valueType: {
        //   type: String,
        //   enum: ["string", "number"],
        //   required: true,
        //   trim: true,
        // },
      },
    ],
  },
  { timestamps: true }
);


categorySchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("The category existed"));
  } else {
    next();
  }
});

module.exports = mongoose.model("Category", categorySchema);
