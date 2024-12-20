import express from "express";
import { Booking, Restaurant, Tables } from "../../configs/dbConfig.js";
import { authenticate } from "../../middleware/auth.js";
import { Op, where } from "sequelize";

let router = express.Router({ mergeParams: true });

router.get("/", authenticate, async (req, res) => {
  let userId = req.user.id;
  let bookings = await Booking.findAll({
    where: {
      UserId: userId,
    },
    include: [
      {
        model: Restaurant,
        // as: 'restaurant',
        attributes: ["id", "title", "location", "images"],
        hooks: {
          afterFind: true,
        },
      },
    ],
  });

  bookings.forEach((booking) => {
    if (booking.Restaurant) {
      booking.Restaurant.images = `${process.env.BASE_URL}/public/${booking.Restaurant.images[0]}`;
    }
  });

  console.log(bookings);

  return res.json(bookings);
});

router.post("/", authenticate, async (req, res) => {
  try {
    let booking = req.body;
    console.log(booking);

    // booking.customer = JSON.parse(booking.customer);
    booking.specialAccomodations = {};
    booking.UserId = req.user.id;

    let optimalTable = await Tables.findOne({
      group: ["id"],
      having: {
        seats: {
          [Op.gte]: booking.guests,
        },
      },
      order: [["seats", "ASC"]],
    });

    console.log(optimalTable);

    booking.TableId = optimalTable.id;

    // let prebookedCount = Booking.count({
    //   where: {
    //     TableId: optimalTable.id,

    // })

    console.log(`Booking:  ${JSON.stringify(booking)}`);

    let bookingData = await Booking.create(booking);

    res.status(201).json(bookingData);
  } catch (error) {
    console.error("Error booking restaurant", error);
    res.status(400).json({ message: "Failed to create booking data" });
  }
});

export default router;
