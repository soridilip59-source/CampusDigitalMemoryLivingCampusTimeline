const { body } = require("express-validator");

const memoryValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Memory title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("story")
    .trim()
    .notEmpty()
    .withMessage("Memory story is required")
    .isLength({ max: 5000 })
    .withMessage("Story cannot exceed 5000 characters"),

  body("year")
  .trim()
  .notEmpty()
  .withMessage("Year is required")
  .bail()
  .isInt({ min: 2018, max: new Date().getFullYear() })
  .withMessage("Please enter a valid memory year")
  .toInt(),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "event",
      "achievement",
      "culture",
      "workshop",
      "campus-life",
      "other"
    ])
    .withMessage("Invalid memory category")
];

module.exports = memoryValidator;