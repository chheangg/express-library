const async = require('async')
const Book = require("../models/book");
const Author = require("../models/author");
const BookInstance = require("../models/bookinstance");
const Genre = require("../models/genre");
const author = require('../models/author');
const { body, validationResult } = require("express-validator");

exports.index = (req, res) => {
  async.parallel(
    {
      book_count (callback) {
        Book.countDocuments({}, callback);
      },
      book_instance_count(callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count(callback) {
        BookInstance.countDocuments({ status: "Available" }, callback);
      },
      author_count(callback) {
        Author.countDocuments({}, callback);
      },
      genre_count(callback) {
        Genre.countDocuments({}, callback);
      },
    },
    (err, results) => {
      res.render('index', {
        title: "Local Library Home",
        error: err,
        data: results,
      })
    }
  )
};

// Display list of all books.
exports.book_list = (req, res, next) => {
 Book.find({}, {title: 1, author: 1})
  .sort({title: 1})
  .populate("author")
  .exec(function (err, list_books) {
    if (err) {
      return next(err);
    } else {
      res.render("book_list", {title: "Book List", book_list: list_books});
    }
  })
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
  async.parallel({
    book(callback) {
      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },
    book_instance(callback) {
      BookInstance.find({book: req.params.id})
        .exec(callback);
    }
  }, (err, results) => {
    if (err) {
      next(err);
    }
    if (results === null) {
      const err = new Error('Book not found')
      err.status(404);
      next(err);
    }
    res.render('book_detail', {title: results.book.title, book: results.book, book_instances: results.book_instance});
  })
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  async.parallel(
    {
      authors(callback) {
        Author.find().exec(callback);
      },
      genres(callback) {
        Genre.find().exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('book_form', {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres,
      })
    }
  )
};

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === undefined ? [] : [req.body.genre];
    }

    next()
  },
  body('title', 'Title must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    })

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors(callback) {
            Author.find().exec(callback);
          },
          genres(callback) {
            Genre.find().exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          for (const genre of results.genre) {
            if (book.genre.includes(genre)) {
              genre.checked = true;
            }
          }

          res.render('book_form', {
            title: "Create Book",
            authors: results.author,
            genres: results.genres,
            book,
            errors: errors.array(),
          })
        }
      )
    }

    book.save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect(book.url);
    });
  },
];

// Display book delete form on GET.
exports.book_delete_get = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id).exec(callback);
      },
      books_bookinstances(callback) {
        BookInstance.find({ book: req.params.id })
          .exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        next(err)
      }

      if (results.book === null) {
        res.redirect('/catalog/books');
      }

      res.render('book_delete', {
        title: "Delete Book",
        books_bookinstances: results.books_bookinstances,
        book: results.book,
      })
    }
  )
};

// Handle book update on POST.
exports.book_delete_post = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.body.bookid).exec(callback);
      },
      books_bookinstances(callback) {
        BookInstance.find({ book: req.body.bookid })
          .exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        next(err);
      }

      if (results.books_bookinstances > 0) {
        res.render('book_delete', {
          title: "Delete Book",
          books_bookinstances: results.books_bookinstances,
          book: results.book,
        })
      }
      Book.findByIdAndDelete(req.body.bookid, (err) => {
        res.redirect('/catalog/books');
      })
    }
  )
};

// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback);
      },
      authors(callback) {
        Author.find().exec(callback);
      },
      genres(callback) {
        Genre.find().exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book === null) {
        res.redirect('/catalog/books');
      }
      for (const genre of results.genres) {
        for (const bookGenre of results.book.genre) {
          if (genre._id.toString() === bookGenre._id.toString()) {
            genre.checked = true;
          }
        }
      }

      res.render('book_form', {
        title: "Update Book",
        genre_list: genres,
        author_list: authors,
        book: result_books,
      })
    }
  )
};

// Handle book update on POST.
exports.book_update_post = (req, res) => [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === undefinied ? [] : [req.body.genre];
    }

    next()
  },
  body('title', 'Title must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id,
    })

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors(callback) {
            Author.find().exec(callback);
          },
          genres(callback) {
            Genre.find().exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          for (const genre in results.genres) {
            for (const bookGenre in book.genre) {
              if (bookGenre._id === genre._id) {
                genre.checked = true;
              }
            }
          }

          res.render('author_form', {
            title: "Update Author",
            author_list: results.authors,
            genre_list: result.genres,
            book,
          })
        }
      )
    }

    Book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
      if (err) {
        return next(err);
      }
      res.redirect(thebook.url);
    })
  }
]
