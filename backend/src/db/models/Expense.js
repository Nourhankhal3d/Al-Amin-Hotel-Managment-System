const { Schema, model } = require('mongoose');

const EXPENSE_CATEGORIES = [
  'electricity',
  'water',
  'maintenance_supplies',
  'cleaning_supplies',
  'internet',
  'emergency',
  'other',
];

const expenseSchema = new Schema(
  {
    staff_id: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    shift_id: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // integer in piastres, always positive
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    expense_datetime: {
      type: Date,
      required: true,
    },
    idempotency_key: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

expenseSchema.statics.CATEGORIES = EXPENSE_CATEGORIES;

expenseSchema.index({ shift_id: 1 });
expenseSchema.index(
  { staff_id: 1, idempotency_key: 1 },
  { unique: true, partialFilterExpression: { idempotency_key: { $type: 'string' } } }
);

// Append-only, same rule as Payment: a mistake is corrected from the Manager system.
const blocked = (op) => async function () {
  throw new Error(`Expenses are append-only: ${op} is not allowed`);
};

[
  'updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndDelete',
  'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany',
].forEach((op) => expenseSchema.pre(op, blocked(op)));

expenseSchema.pre('save', async function () {
  if (!this.isNew) throw new Error('Expenses are append-only: save on an existing expense is not allowed');
});

module.exports = model('Expense', expenseSchema);