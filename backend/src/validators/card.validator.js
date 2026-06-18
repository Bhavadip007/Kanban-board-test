const Joi = require('joi');
const { PRIORITIES } = require('../models/Card');

const createCardSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().trim().max(5000).allow('').optional(),
  assignee: Joi.string().hex().length(24).allow(null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  position: Joi.number().integer().min(0).optional(),
});

const updateCardSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).optional(),
  description: Joi.string().trim().max(5000).allow('').optional(),
  assignee: Joi.string().hex().length(24).allow(null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  position: Joi.number().integer().min(0).optional(),
}).min(1);

const moveCardSchema = Joi.object({
  columnId: Joi.string().hex().length(24).required(),
  position: Joi.number().integer().min(0).required(),
});

module.exports = { createCardSchema, updateCardSchema, moveCardSchema };
