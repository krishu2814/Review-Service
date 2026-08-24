const express = require("express");
const ReviewController = require("../../controller/review-controller");
const AuthenticUser = require("../../middleware/authentication");

const router = express.Router();
const reviewController = new ReviewController();

// Public routes for product reviews
router.get("/product/:productId", reviewController.getProductReviews.bind(reviewController));
router.get("/product/:productId/summary", reviewController.getProductRatingSummary.bind(reviewController));

// Protected routes
router.post("/", AuthenticUser, reviewController.createReview.bind(reviewController));
router.patch("/:id/vote", AuthenticUser, reviewController.voteReview.bind(reviewController));
router.delete("/:id", AuthenticUser, reviewController.deleteReview.bind(reviewController));
router.get("/user/my-reviews", AuthenticUser, reviewController.getMyReviews.bind(reviewController));

module.exports = router;
