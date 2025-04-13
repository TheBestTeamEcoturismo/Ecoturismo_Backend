const { isAuth } = require('../../middlewares/isAuth');
const { newReservation, deleteReservation, getReservations } = require('../controllers/reservation');

const reservationsRouter = require('express').Router();

reservationsRouter.get('/:id', isAuth, getReservations);
reservationsRouter.post('/newReservation', isAuth, newReservation);
reservationsRouter.delete('/deleteReservation/:id', isAuth, deleteReservation);

module.exports = reservationsRouter;
