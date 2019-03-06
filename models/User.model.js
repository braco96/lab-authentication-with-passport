const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

// Definimos la estructura del usuario que se almacenará en MongoDB
const userSchema = new Schema({
  username: String,
  // Nombre de usuario único para cada cuenta
  username: { type: String, unique: true },
  // Contraseña encriptada del usuario
  password: String
}, {
  timestamps: true
});
 
const User = mongoose.model("User", userSchema); // Creamos el modelo de usuario
module.exports = User;
