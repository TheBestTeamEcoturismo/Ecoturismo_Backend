const { sendEmail } = require('../../utils/email/sendEmail');
const Accommodation = require('../models/accommodation');
const Activity = require('../models/activity');
const Reservation = require('../models/reservation');
const User = require('../models/user');

async function getReservations(req, res) {
  try {
    const { id } = req.params;

    const reservations = await Reservation.find().populate({ path: 'activityId', select: 'idAuthor name -_id' }).populate({ path: 'accommodationId', select: 'idAuthor name -_id' }).populate({ path: 'userId', select: 'name -_id' }).select('entryDate exitDate hour -_id');

    const filteredReservations = reservations.filter((r) => (r.activityId && r.activityId.idAuthor.toString() === id) || (r.accommodationId && r.accommodationId.idAuthor.toString() === id));

    return res.status(200).json({
      reservations: filteredReservations
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
}

async function newReservation(req, res) {
  try {
    const newReservation = new Reservation(req.body);
    console.log(newReservation);

    const { _id } = req.user;

    // if (newReservation.typeReservation === 'Actividad') {
    //   const activities = await Activity.find({ idAuthor: _id });
    //   console.log(activities);

    //   if (activities) {
    //     return res.status(400).json({
    //       message: 'No puedes reservar una actividad creada por ti'
    //     });
    //   }
    // }

    // if (newReservation.typeReservation === 'Alojamiento') {
    //   const accommodations = await Accommodation.find({ idAuthor: _id });
    //   console.log(accommodations);

    //   if (accommodations) {
    //     return res.status(400).json({
    //       message: 'No puedes reservar una alojamiento creado por ti'
    //     });
    //   }
    // }

    const findUser = await User.findById(_id).populate('reservations');
    const newReservationDate = newReservation.entryDate;

    const reservationUser = findUser.reservations;
    let alreadyReservedActivity = false;
    let alreadyReservedAccommodation = false;

    if (newReservation.typeReservation === 'Alojamiento') {
      const accommodation = await Accommodation.findById(newReservation.accommodationId);

      if (accommodation.idAuthor.toString() === newReservation.userId.toString()) {
        return res.status(400).json({
          message: 'No puedes reservar una alojamiento creado por ti'
        });
      }
      const reservationAccomodation = newReservation.accommodationId.toString();
      const findReservations = reservationUser.filter((reservation) => reservation.accommodationId);
      alreadyReservedAccommodation = findReservations.some((reservation) => {
        const reservationDate = reservation.entryDate;
        return reservation.accommodationId.toString() === reservationAccomodation && reservationDate === newReservationDate;
      });
    } else {
      const activitie = await Activity.findById(newReservation.activityId);

      if (activitie.idAuthor.toString() === newReservation.userId.toString()) {
        return res.status(400).json({
          message: 'No puedes reservar una actividad creada por ti'
        });
      }
      const reservationActivity = newReservation.activityId.toString();
      const findReservations = reservationUser.filter((reservation) => reservation.activityId);
      alreadyReservedActivity = findReservations.some((reservation) => {
        const reservationDate = reservation.entryDate;
        return reservation.activityId.toString() === reservationActivity && reservationDate === newReservationDate;
      });
    }

    if (alreadyReservedActivity) {
      return res.status(400).json({
        message: 'Ya tienes una reserva de esa actividad para ese mismo día'
      });
    } else if (alreadyReservedAccommodation) {
      return res.status(400).json({
        message: 'Ya tienes una reserva de ese alojamiento para ese mismo día'
      });
    } else {
      const user = await User.findByIdAndUpdate(
        _id,
        {
          $push: {
            reservations: newReservation._id
          }
        },
        { new: true }
      );

      const reservation = await newReservation.save();
      sendEmail(user, newReservation, newReservation.typeReservation);

      return res.status(201).json({
        message: 'Reserva realizada correctamente, revisa tu correo para poder verla.',
        reservation
      });
    }
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
}

async function deleteReservation(req, res) {
  try {
    const { id } = req.params;
    const { _id } = req.user;

    const reservation = await Reservation.findByIdAndDelete(id, { new: true });
    await User.findByIdAndUpdate(
      _id,
      {
        $pull: { reservations: id }
      },
      { new: true }
    );
    const { user } = req;
    sendEmail(user, reservation, 'Cancelar');
    return res.status(200).json({
      message: 'Reserva eliminada correctamente, te hemos enviado un mensaje con la reserva cancleada',
      reservation
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
}

module.exports = { getReservations, newReservation, deleteReservation };
