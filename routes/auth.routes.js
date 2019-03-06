const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const passport = require('passport');

// GET /signup -> muestra formulario de registro
router.get('/signup', (req, res) => {
  res.render('auth/signup');
});

// POST /signup -> procesa registro
router.post('/signup', (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('auth/signup', { errorMessage: 'Indica usuario y contraseña' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPass = bcrypt.hashSync(password, salt);

  User.findOne({ username })
    .then(existing => {
      if (existing) {
        return res.render('auth/signup', { errorMessage: 'El usuario ya existe' });
      }
      return User.create({ username, password: hashPass });
    })
    .then(() => res.redirect('/login'))
    .catch(err => next(err));
});

// GET /login -> muestra login
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// POST /login -> autentica con estrategia local
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/private-page',
    failureRedirect: '/login'
  })
);

// GET /logout -> cierra sesión (Passport 0.6+ usa callback)
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

// GET /private-page -> página protegida
router.get('/private-page', (req, res) => {
  if (!req.user) return res.redirect('/login');
  // Renderizamos la vista correcta situada en views/auth/private.hbs
  res.render('auth/private', { user: req.user });
});

module.exports = router;
