// Input validation utilities

// Validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Validate date string (ISO 8601)
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Validate slot creation input
const validateSlotInput = (body) => {
  const errors = [];
  const { title, startTime, endTime } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }
  if (title && title.length > 100) {
    errors.push('Title cannot exceed 100 characters');
  }

  if (!startTime) {
    errors.push('startTime is required');
  } else if (!isValidDate(startTime)) {
    errors.push('startTime must be a valid ISO 8601 date');
  }

  if (!endTime) {
    errors.push('endTime is required');
  } else if (!isValidDate(endTime)) {
    errors.push('endTime must be a valid ISO 8601 date');
  }

  if (startTime && endTime && isValidDate(startTime) && isValidDate(endTime)) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      errors.push('endTime must be after startTime');
    }
  }

  return errors;
};

// Validate booking ID parameter
const validateSlotId = (id) => {
  if (!id) {
    return 'Slot ID is required';
  }
  if (!isValidObjectId(id)) {
    return 'Invalid slot ID format';
  }
  return null;
};

module.exports = {
  isValidObjectId,
  isValidDate,
  validateSlotInput,
  validateSlotId,
};