const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const objectIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const validateObjectId = (req, res, next) => {
  const { error } = objectIdSchema.validate({ id: req.params.id });
  if (error) {
    return next(new ApiError(400, 'Invalid ID format'));
  }
  next();
};

module.exports = validateObjectId;
