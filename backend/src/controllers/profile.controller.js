const Problem = require('../models/problem.model');
const Submission = require('../models/submission.model');

const getProfileStats = async (req, res) => {
    try {
        const userId = req.result._id;

        // 1. Total Problems by difficulty
        const totalProblems = await Problem.aggregate([
            { $group: { _id: "$difficulty", count: { $sum: 1 } } }
        ]);

        const totalCounts = { easy: 0, medium: 0, hard: 0 };
        totalProblems.forEach(p => { totalCounts[p._id] = p.count; });

        // 2. User's Accepted Submissions (Unique Problems by difficulty)
        const solvedProblems = await Submission.aggregate([
            { $match: { userId: userId, status: 'accepted' } },
            { $group: { _id: "$problemId" } },
            { $lookup: {
                from: 'problems',
                localField: '_id',
                foreignField: '_id',
                as: 'problem'
            }},
            { $unwind: "$problem" },
            { $group: { _id: "$problem.difficulty", count: { $sum: 1 } } }
        ]);

        const solvedCounts = { easy: 0, medium: 0, hard: 0 };
        solvedProblems.forEach(p => { solvedCounts[p._id] = p.count; });

        res.status(200).json({
            success: true,
            totalCounts,
            solvedCounts,
        });

    } catch (err) {
        console.error("Profile Stats Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { getProfileStats };
