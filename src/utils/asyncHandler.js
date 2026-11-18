// In Express 5, async handlers automatically catch errors
// This wrapper is kept for compatibility but just passes through
const asyncHandler = (fn) => fn;

module.exports = asyncHandler;