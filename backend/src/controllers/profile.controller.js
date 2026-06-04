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

        // 2. User's Accepted Submissions (Unique Problems)
        // We need to join with Problem to get difficulty and tags
        const solvedProblems = await Submission.aggregate([
            { $match: { userId: userId, status: 'accepted' } },
            // Group by problemId to get unique solved problems
            { $group: { _id: "$problemId" } },
            // Lookup problem details
            { $lookup: {
                from: 'problems',
                localField: '_id',
                foreignField: '_id',
                as: 'problem'
            }},
            { $unwind: "$problem" },
            // Group by difficulty and tag
            { $facet: {
                byDifficulty: [
                    { $group: { _id: "$problem.difficulty", count: { $sum: 1 } } }
                ],
                byTag: [
                    { $unwind: "$problem.tags" },
                    { $group: { _id: "$problem.tags", count: { $sum: 1 } } }
                ]
            }}
        ]);

        const solvedCounts = { easy: 0, medium: 0, hard: 0 };
        const solvedByTag = {};
        
        if (solvedProblems.length > 0) {
            solvedProblems[0].byDifficulty.forEach(p => { solvedCounts[p._id] = p.count; });
            solvedProblems[0].byTag.forEach(p => { solvedByTag[p._id] = p.count; });
        }

        // 3. Recent Submissions (Last 10)
        const recentSubmissions = await Submission.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('problemId', 'title difficulty tags')
            .select('status language runtime createdAt problemId');

        // 4. Activity Calendar (Submissions per day over the last year)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const activity = await Submission.aggregate([
            { $match: { userId: userId, createdAt: { $gte: oneYearAgo } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            totalCounts,
            solvedCounts,
            solvedByTag,
            recentSubmissions,
            activity
        });

    } catch (err) {
        console.error("Profile Stats Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { getProfileStats };
