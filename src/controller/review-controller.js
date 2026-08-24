const ReviewService = require("../service/review-service");

class ReviewController {
  constructor() {
    this.reviewService = new ReviewService();
  }

  async createReview(req, res) {
    try {
      const user = req.user;
      const token = req.headers.authorization;
      const review = await this.reviewService.createReview(req.body, user, token);

      return res.status(201).json({
        success: true,
        data: review,
        message: "Review submitted successfully",
        error: {},
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "Failed to submit review",
        error: error.message,
      });
    }
  }

  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { page, limit, sortBy } = req.query;

      const result = await this.reviewService.getProductReviews(productId, {
        page,
        limit,
        sortBy,
      });

      return res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: result.pagination,
        message: "Product reviews retrieved successfully",
        error: {},
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: "Failed to retrieve reviews",
        error: error.message,
      });
    }
  }

  async getProductRatingSummary(req, res) {
    try {
      const { productId } = req.params;
      const summary = await this.reviewService.getProductRatingSummary(productId);

      return res.status(200).json({
        success: true,
        data: summary,
        message: "Product rating summary retrieved successfully",
        error: {},
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: {},
        message: "Failed to retrieve rating summary",
        error: error.message,
      });
    }
  }

  async voteReview(req, res) {
    try {
      const { id } = req.params;
      const { voteType } = req.body;
      const userId = req.user?.id || req.user?.userId;

      const updatedReview = await this.reviewService.voteReview(
        id,
        userId,
        voteType,
      );

      return res.status(200).json({
        success: true,
        data: updatedReview,
        message: "Vote recorded successfully",
        error: {},
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "Failed to record vote",
        error: error.message,
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.user?.userId;
      const userRole = req.user?.role || req.user?.userRole;

      const result = await this.reviewService.deleteReview(id, userId, userRole);

      return res.status(200).json({
        success: true,
        data: result,
        message: "Review deleted successfully",
        error: {},
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "Failed to delete review",
        error: error.message,
      });
    }
  }

  async getMyReviews(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const reviews = await this.reviewService.getUserReviews(userId);

      return res.status(200).json({
        success: true,
        data: reviews,
        message: "User reviews retrieved successfully",
        error: {},
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: "Failed to retrieve user reviews",
        error: error.message,
      });
    }
  }
}

module.exports = ReviewController;
