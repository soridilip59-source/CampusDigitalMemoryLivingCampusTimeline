const REACTIONS = ["❤️", "😂", "😢", "🔥"];

const idOf = (value) => String(value?._id || value || "");

function presentMemory(memory, userId) {
  const author = memory.submittedBy || {};
  const likes = memory.likes || [];
  const reactions = Object.fromEntries(REACTIONS.map((emoji) => [emoji, []]));
  const comments = (memory.comments || []).map((comment) => {
    const user = comment.user || {};
    return {
      id: idOf(comment._id),
      userId: idOf(user._id || user),
      userName: user.name || comment.userName || "Campus member",
      text: comment.text,
      createdAt: comment.createdAt,
    };
  });

  let myReaction = null;
  for (const reaction of memory.reactions || []) {
    const reactionUserId = idOf(reaction.user);
    if (reactions[reaction.emoji]) reactions[reaction.emoji].push(reactionUserId);
    if (userId && reactionUserId === String(userId)) myReaction = reaction.emoji;
  }

  const images = (memory.media || []).map((item) => item.url).filter(Boolean);
  const reports = (memory.reports || []).map((report) => ({
    id: idOf(report._id),
    userId: idOf(report.user?._id || report.user),
    userName: report.user?.name || "Campus member",
    reason: report.reason,
    createdAt: report.createdAt,
  }));
  const output = {
    id: idOf(memory._id),
    title: memory.title,
    description: memory.story,
    year: memory.year,
    type: memory.category,
    batch: memory.batch || `Batch ${memory.year}`,
    eventDate: memory.eventDate,
    tags: memory.tags || [],
    related: memory.related || "",
    images,
    contributor: {
      id: idOf(author._id || author),
      name: author.name || "Campus member",
    },
    status: memory.status,
    likesCount: likes.length,
    liked: Boolean(userId && likes.some((like) => idOf(like) === String(userId))),
    reactions,
    reactionCounts: Object.fromEntries(REACTIONS.map((emoji) => [emoji, reactions[emoji].length])),
    myReaction,
    comments,
    featured: Boolean(memory.featured),
    reported: reports.length > 0,
    reports,
    duplicateOf: idOf(memory.duplicateOf) || null,
    duplicateScore: memory.duplicateScore ?? null,
    rejectReason: memory.rejectionReason || null,
    createdAt: memory.createdAt,
  };
  return output;
}

module.exports = { presentMemory, REACTIONS, idOf };
