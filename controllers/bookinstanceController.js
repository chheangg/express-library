const BookInstance = require("../models/bookinstance");
const async = require('async');
const Book = require("../models/book");
const {body, validationResult} = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find()
    .populate("book")
    .exec(function(err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      res.render("bookinstance_list", {title: "Book Instance List", bookinstance_list: list_bookinstances});
    })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res) => {
  Book.find({}, 'title')
    .exec((err, books) => {
      if (err) {
        return next(err);
      }
      
      res.render('bookinstance_form', {
        title: 'Create BookInstance',
        book_list: books,
      })
    })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status")
    .escape(),
  body('due_back', "invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    })

    if (!errors.isEmpty()) {
      Book.find({}, 'title')
        .exec((err, books) => {
          if (err) {
            return next(err);
          }
          res.render("bookinstance_form", {
            title: "Create BookInstance",
            book_list: books,
            selected_book: bookinstance.book._id,
            errors: errors.array(),
            bookinstance,
        });
      });

      return;
    } 

    bookinstance.save((err) => {
      if (err) {
        next(err);
      }

      res.redirect(bookinstance.url);
    })

  }
]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }

      if (bookinstance === null) {
        res.redirect('/catalog/bookinstances');
      }

      res.render('bookinstance_delete', {
        title: "Delete BookInstance",
        bookinstance,
      })
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res) => {
  BookInstance.findById(req.body.bookinstanceid)
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }

      if (bookinstance === null) {
        res.redirect('/catalog/bookinstances');
      }

      BookInstance.findByIdAndDelete(req.body.bookinstanceid, (err) => {
        if (err) {
          return next(err);
        }

        res.redirect('/catalog/bookinstances');
      })

    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.params.id).exec(callback);
      },
      books(callback) {
        Book.find().exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.bookinstance === null) {
        res.redirect('/catalog/bookinstances');
      }

      res.render('bookinstance_form', {
        title: "Edit BookInstance",
        book_list: results.books,
        selected_book: results.bookinstance.book,
        bookinstance: results.bookinstance,
      })
    } 
  )
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status")
    .escape(),
  body('due_back', "invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    })

    if (!errors.isEmpty()) {
      Book.find({}, 'title')
        .exec((err, books) => {
          if (err) {
            return next(err);
          }
          res.render("bookinstance_form", {
            title: "Create BookInstance",
            book_list: books,
            selected_book: bookinstance.book._id,
            errors: errors.array(),
            bookinstance,
        });
      });

      return;
    } 

    BookInstance.findByIdAndUpdate(req.params.id, bookinstance, (err) => {
      if (err) {
        return next(err);
      }

      res.redirect('/catalog/bookinstances')
    })

  }
]
