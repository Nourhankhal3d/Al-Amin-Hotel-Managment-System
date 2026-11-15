// Two routers, mounted by manager/index.js as settings.hotel and settings.shifts
const express = require('express');
const controller = require('./settings.controller');

const hotel = express.Router();
hotel.get('/', controller.getHotel);
hotel.patch('/', controller.patchHotel);

const shifts = express.Router();
shifts.get('/', controller.getShifts);
shifts.patch('/', controller.patchShifts);

module.exports = { hotel, shifts };