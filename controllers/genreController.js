const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const {body, validationResult} = require('express-validator');

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) {
        next(err);
      } else {
        res.render('genre_list.pug',
        {
          title: "Genre List",
          genre_list: list_genres,
        })
      }
    })
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel({
    genre(callback) {
      Genre.findById(req.params.id).exec(callback);
    },
    genre_books(callback) {
      Book.find({genre: req.params.id}).exec(callback);
    }
  },
  (err, result) => {
    if (err) {
      next(err);
    } 
    
    if (result === null) {
      const err = new Error("Genre not found!");
      err.status = 404;
      next(err);
    }
    
    res.render('genre_detail',
    {
      title: "Genre Detail",
      genre: result.genre,
      genre_books: result.genre_books
    })
  })
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
  body('name', 'Genre named required')
    .trim()
    .isLength({min: 1})
    .escape()
  ,
  (req, res, next) => {
    const errors = validationResult(req);
    
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      res.render('genre_form', {title: 'Create Genre', genre, errors: error.array()});
      return;
    } else {
      Genre
        .findOne({ name: req.body.name})
        .exec((err, found_genre) => {
          if (err) {
            return next(err);
          }

          if(found_genre) {
            res.redirect(found_genre);
          } else {
            genre.save((err) => {
              if (err) {
                return next(err);
              }
              res.redirect(genre.url);
            })
          }
        })
    }
  }
]

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.genre === null) {
        res.redirect('/catalog/genres');
      }

      res.render('genre_delete', {
        title: 'Delete Genre',
        genre: results.genre,
        genres_books: results.genres_books,
      });
    },
  )
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genres_books(callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        next(err);
      }

      if (results.genres_books.length > 0) {
        res.render('genre_delete', {
          title: 'Delete Genre',
          genre: results.genre,
          genres_books: results.genres_books,
        });
      }

      Genre.findByIdAndDelete(req.body.genreid, (err) => {
        res.redirect('/catalog/genres')
      })
    }
  )
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res) => {
  Genre.findById(req.params.id)
  .exec((err, genre) => {
    if (err) {
      next(err);
    }

    if (genre === null) {
      res.redirect('/catalog/genres');
    }

    res.render('genre_form', {
      title: 'Update Genre',
      genre,
    })
  })
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body('name', 'Genre named required')
    .trim()
    .isLength({min: 1})
    .escape()
  ,
  (req, res, next) => {
    const errors = validationResult(req);
    
    const genre = new Genre({ _id: req.params.id, name: req.body.name });

    if (!errors.isEmpty()) {
      res.render('genre_form', {title: 'Update Genre', genre, errors: error.array()});
      return;
    } else {
      Genre.findByIdAndUpdate(req.params.id, genre, (err) => {
        if (err) {
          next(err);
        }

        res.redirect('/catalog/genres')
      })
    }
  }
]