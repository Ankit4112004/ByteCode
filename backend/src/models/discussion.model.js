const mongoose = require('mongoose');
const { Schema } = mongoose;

const discussionSchema = new Schema({
  problemId: {
    type: Schema.Types.ObjectId,
    ref: 'problem',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000,
  },
  // null = top-level comment; otherwise the comment this is a reply to
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'discussion',
    default: null,
  },
  upvotes: [{
    type: Schema.Types.ObjectId,
    ref: 'user',
  }],
}, {
  timestamps: true,
});

const Discussion = mongoose.model('discussion', discussionSchema);

module.exports = Discussion;
