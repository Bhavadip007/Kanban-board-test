const Joi = require('joi');

const createColumnSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  position: Joi.number().integer().min(0).optional(),
});

const updateColumnSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  position: Joi.number().integer().min(0).optional(),
}).min(1);

module.exports = { createColumnSchema, updateColumnSchema };
