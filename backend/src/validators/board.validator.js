const Joi = require('joi');

const createBoardSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  memberIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

const updateBoardSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  memberIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
}).min(1);

module.exports = { createBoardSchema, updateBoardSchema };
