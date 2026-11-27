const { Schema, model } = require('mongoose');

const star = { type: Number, required: true, min: 1, max: 5, validate: { validator: Number.isInteger } };

const guestSurveySchema = new Schema(
  {
    reservation_id: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, unique: true },
    guest_name: { type: String, required: true, trim: true },
    room_number: { type: String, required: true, trim: true },
    room_type: { type: String, default: null },
    check_in_date: { type: String, default: null },
    check_out_date: { type: String, default: null },
    ratings: {
      cleanliness: star,
      staff: star,
      speed: star,
      room_quality: star,
      check_in: star,
      check_out: star,
      stay_again: star,
      recommend: star,
    },
    had_problem: { type: Boolean, required: true },
    problem_details: { type: String, default: null },
    suggestions: { type: String, default: null },
    overall_rating: star,
    status: { type: String, enum: ['COMPLETED', 'PENDING_REVIEW'], default: 'COMPLETED' },
    staff_id: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    shift_id: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

guestSurveySchema.index({ created_at: -1 });

module.exports = model('GuestSurvey', guestSurveySchema);
