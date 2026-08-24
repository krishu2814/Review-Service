const ReviewRepository = require("../repository/review-repository");
const axios = require("axios");
const {
  ORDER_SERVICE_URL,
  PRODUCT_SERVICE_URL,
} = require("../config/serverConfig");
const { publishEvent } = require("../config/rabbitmq");
const { getCorrelationId } = require("../middleware/correlation-middleware");

class ReviewService {
  constructor() {
    this.reviewRepository = new ReviewRepository();
  }

  async verifyPurchase(userId, productId, token) {
    try {
      if (!token) return false;

      const correlationId = getCorrelationId();
      const response = await axios.get(`${ORDER_SERVICE_URL}/api/v1`, {
        headers: {
          Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
          "x-correlation-id": correlationId,
        },
        timeout: 4000,
      });

      const orders = response.data?.data || [];
      const purchased = orders.some((order) => {
        const isCompleted =
          order.paymentStatus === "SUCCESS" ||
          order.orderStatus === "CONFIRMED" ||
          order.orderStatus === "DELIVERED" ||
          order.orderStatus === "READY_FOR_PAYMENT";
        if (!isCompleted) return false;

        return order.items?.some(
          (item) => String(item.productId?._id || item.productId) === String(productId),
        );
      });

      return purchased;
    } catch (error) {
      console.warn(
        `[ReviewService] Purchase verification fallback for user ${userId}:`,
        error.message,
      );
      return false;
    }
  }

  async createReview(data, user, token) {
    const { productId, rating, title, comment } = data;
    const userId = user.id || user.userId;
    const userName = user.name || user.email?.split("@")[0] || "Shopper";
    const userEmail = user.email;

    if (!productId) {
      throw new Error("Product ID is required");
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      throw new Error("Rating must be an integer between 1 and 5 stars");
    }

    if (!comment || comment.trim().length === 0) {
      throw new Error("Review comment cannot be empty");
    }

    // Check duplicate review
    const existing = await this.reviewRepository.findReviewByUserAndProduct(
      userId,
      productId,
    );
    if (existing) {
      throw new Error("You have already reviewed this product");
    }

    // Check verified purchase badge
    const isVerifiedPurchase = await this.verifyPurchase(userId, productId, token);

    const correlationId = getCorrelationId();

    const review = await this.reviewRepository.createReview({
      userId: String(userId),
      userName,
      userEmail,
      productId: String(productId),
      rating: numRating,
      title: title ? title.trim() : "",
      comment: comment.trim(),
      isVerifiedPurchase,
      correlationId,
    });

    // Compute updated rating summary and broadcast event
    const summary = await this.reviewRepository.getProductRatingSummary(productId);
    await publishEvent("PRODUCT_RATING_UPDATED", {
      event: "PRODUCT_RATING_UPDATED",
      productId: String(productId),
      averageRating: summary.averageRating,
      totalReviews: summary.totalReviews,
      timestamp: new Date().toISOString(),
    });

    return review;
  }

  async getProductReviews(productId, options) {
    if (!productId) {
      throw new Error("Product ID is required");
    }
    return await this.reviewRepository.findReviewsByProductId(productId, options);
  }

  async getProductRatingSummary(productId) {
    if (!productId) {
      throw new Error("Product ID is required");
    }
    return await this.reviewRepository.getProductRatingSummary(productId);
  }

  async voteReview(reviewId, userId, voteType) {
    if (!["HELPFUL", "UNHELPFUL"].includes(voteType)) {
      throw new Error("Vote type must be HELPFUL or UNHELPFUL");
    }
    return await this.reviewRepository.voteReview(reviewId, userId, voteType);
  }

  async deleteReview(reviewId, userId, userRole) {
    const review = await this.reviewRepository.findReviewById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (String(review.userId) !== String(userId) && userRole !== "admin") {
      throw new Error("Unauthorized: You can only delete your own reviews");
    }

    const productId = review.productId;
    await this.reviewRepository.deleteReview(reviewId);

    // Refresh and broadcast rating update
    const summary = await this.reviewRepository.getProductRatingSummary(productId);
    await publishEvent("PRODUCT_RATING_UPDATED", {
      event: "PRODUCT_RATING_UPDATED",
      productId: String(productId),
      averageRating: summary.averageRating,
      totalReviews: summary.totalReviews,
      timestamp: new Date().toISOString(),
    });

    return { message: "Review deleted successfully" };
  }

  async getUserReviews(userId) {
    return await this.reviewRepository.findUserReviews(userId);
  }
}

module.exports = ReviewService;
