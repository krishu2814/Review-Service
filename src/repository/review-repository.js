const Review = require("../model/review-model");

class ReviewRepository {
  async createReview(data) {
    try {
      return await Review.create(data);
    } catch (error) {
      console.error("Error creating review:", error.message);
      throw error;
    }
  }

  async findReviewByUserAndProduct(userId, productId) {
    try {
      return await Review.findOne({
        userId: String(userId),
        productId: String(productId),
      });
    } catch (error) {
      console.error("Error finding user review:", error.message);
      throw error;
    }
  }

  async findReviewById(id) {
    try {
      return await Review.findById(id);
    } catch (error) {
      console.error("Error finding review by id:", error.message);
      throw error;
    }
  }

  async findReviewsByProductId(productId, options = {}) {
    try {
      const page = parseInt(options.page, 10) || 1;
      const limit = parseInt(options.limit, 10) || 10;
      const skip = (page - 1) * limit;
      const sortBy = options.sortBy || "newest";

      let sortQuery = { createdAt: -1 };
      if (sortBy === "highest_rating") {
        sortQuery = { rating: -1, createdAt: -1 };
      } else if (sortBy === "lowest_rating") {
        sortQuery = { rating: 1, createdAt: -1 };
      } else if (sortBy === "most_helpful") {
        sortQuery = { helpfulVotes: -1, createdAt: -1 };
      }

      const query = {
        productId: String(productId),
        status: "PUBLISHED",
      };

      const [reviews, totalCount] = await Promise.all([
        Review.find(query).sort(sortQuery).skip(skip).limit(limit),
        Review.countDocuments(query),
      ]);

      return {
        reviews,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      };
    } catch (error) {
      console.error("Error fetching product reviews:", error.message);
      throw error;
    }
  }

  async getProductRatingSummary(productId) {
    try {
      const pipeline = [
        {
          $match: {
            productId: String(productId),
            status: "PUBLISHED",
          },
        },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ];

      const starCounts = await Review.aggregate(pipeline);

      let totalReviews = 0;
      let totalScore = 0;
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      for (const item of starCounts) {
        const rating = item._id;
        const count = item.count;
        if (distribution[rating] !== undefined) {
          distribution[rating] = count;
        }
        totalReviews += count;
        totalScore += rating * count;
      }

      const averageRating =
        totalReviews > 0
          ? Math.round((totalScore / totalReviews) * 10) / 10
          : 0;

      const percentageBreakdown = {};
      for (let star = 1; star <= 5; star++) {
        percentageBreakdown[star] =
          totalReviews > 0
            ? Math.round((distribution[star] / totalReviews) * 100)
            : 0;
      }

      return {
        productId: String(productId),
        averageRating,
        totalReviews,
        distribution,
        percentageBreakdown,
      };
    } catch (error) {
      console.error("Error aggregating rating summary:", error.message);
      throw error;
    }
  }

  async voteReview(reviewId, userId, voteType) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      const existingVoteIndex = review.voters.findIndex(
        (v) => String(v.userId) === String(userId),
      );

      if (existingVoteIndex !== -1) {
        const existingVote = review.voters[existingVoteIndex];
        if (existingVote.voteType === voteType) {
          // Retract vote
          review.voters.splice(existingVoteIndex, 1);
          if (voteType === "HELPFUL") review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
          if (voteType === "UNHELPFUL") review.unhelpfulVotes = Math.max(0, review.unhelpfulVotes - 1);
        } else {
          // Switch vote
          if (voteType === "HELPFUL") {
            review.helpfulVotes += 1;
            review.unhelpfulVotes = Math.max(0, review.unhelpfulVotes - 1);
          } else {
            review.unhelpfulVotes += 1;
            review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
          }
          review.voters[existingVoteIndex].voteType = voteType;
        }
      } else {
        // New vote
        review.voters.push({ userId: String(userId), voteType });
        if (voteType === "HELPFUL") review.helpfulVotes += 1;
        if (voteType === "UNHELPFUL") review.unhelpfulVotes += 1;
      }

      return await review.save();
    } catch (error) {
      console.error("Error voting on review:", error.message);
      throw error;
    }
  }

  async deleteReview(id) {
    try {
      return await Review.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting review:", error.message);
      throw error;
    }
  }

  async findUserReviews(userId) {
    try {
      return await Review.find({ userId: String(userId) }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error finding user reviews:", error.message);
      throw error;
    }
  }
}

module.exports = ReviewRepository;
