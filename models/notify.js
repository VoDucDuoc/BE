const mongoose = require("mongoose");

const notifySchema = mongoose.Schema(
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
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            trim: true,
        },
        userName: {
            type: String,
            required: true,
            trim: true,
        },
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["new", "old"],
            required: true,
            default: "new",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notify", notifySchema);
