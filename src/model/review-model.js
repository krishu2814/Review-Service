const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      default: "Anonymous Customer",
    },
    userEmail: {
      type: String,
    },
    productId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Review comment cannot exceed 2000 characters"],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    unhelpfulVotes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        userId: {
          type: String,
          required: true,
        },
        voteType: {
          type: String,
          enum: ["HELPFUL", "UNHELPFUL"],
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["PUBLISHED", "FLAGGED", "HIDDEN"],
      default: "PUBLISHED",
      index: true,
    },
    correlationId: {
      type: String,
    },
  },
  { timestamps: true },
);

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, helpfulVotes: -1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
