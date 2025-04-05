require('dotenv').config();
const express = require('express');
const { connectDB } = require('./src/config/db');

const app = express();

connectDB();

app.use(express.json());

app.listen(3000, () => {
  console.log('Servidor levantado en http://localhost:3000');
});
