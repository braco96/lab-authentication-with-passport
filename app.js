require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');
// Requerimos las librerías necesarias para la autenticación
const session = require('express-session'); // Maneja las sesiones de usuario
const passport = require('passport'); // Middleware principal de Passport
const LocalStrategy = require('passport-local').Strategy; // Estrategia basada en usuario/contraseña
const bcrypt = require('bcryptjs'); // Encriptación de contraseñas
const User = require('./models/User.model'); // Modelo de usuarios para consultar la base de datos

const app_name = require('./package.json').name;

mongoose
  .connect('mongodb://localhost/auth-with-passport')
  .then(x => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
  .catch(err => console.error('Error connecting to mongo', err));


const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// Configuramos la sesión para poder guardar datos del usuario entre peticiones
app.use(session({
  secret: process.env.SECRET, // Clave almacenada en .env para firmar la sesión
  resave: true, // Fuerza el guardado de la sesión en cada petición
  saveUninitialized: false // Evita guardar sesiones vacías
}));
// Inicializamos Passport y lo vinculamos con la sesión
app.use(passport.initialize()); // Inicializa Passport
app.use(passport.session()); // Passport gestionará la sesión del usuario

// Indicamos a Passport cómo serializar (guardar) el usuario en la sesión
passport.serializeUser((user, done) => {
  // Almacena únicamente el ID del usuario para mantener la sesión ligera
  done(null, user._id);
});

// Indicamos a Passport cómo recuperar la información del usuario a partir del ID
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => done(null, user)) // Inyectamos el usuario en req.user
    .catch(err => done(err));
});

// Definimos la estrategia local utilizando nombre de usuario y contraseña
passport.use(new LocalStrategy((username, password, done) => {
  // Buscamos el usuario por su nombre
  User.findOne({ username })
    .then(user => {
      if (!user) {
        // No existe un usuario con ese nombre
        return done(null, false, { message: 'Nombre de usuario incorrecto' });
      }
      // Comprobamos que la contraseña introducida coincide con el hash almacenado
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: 'Contraseña incorrecta' });
      }
      // Todo correcto, devolvemos el usuario
      return done(null, user);
    })
    .catch(err => done(err));
}));

// Express View engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';

// Routes middleware goes here
const index = require('./routes/index.routes');
app.use('/', index);
const authRoutes = require('./routes/auth.routes');
app.use('/', authRoutes);

module.exports = app;
