const express = require('express');
const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const { authenticateUser } = require('../../middleware/authMiddleware'); 
const { authorizeRole } = require('../../middleware/authorizeRole');

const router = express.Router();

router.post('/pay',
  authenticateUser,             
  authorizeRole(['patient']),  
  async (req, res) => {
    const { appointmentId, amount, paymentMethod } = req.body;

    if (!appointmentId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId, amount, and paymentMethod are required',
      });
    }

    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      const patient = await User.findById(req.user._id);
      if (!patient.selectedDoctor || patient.selectedDoctor.toString() !== appointment.doctorId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You can only make payments for appointments with your selected doctor',
        });
      }

      const newPayment = new Payment({
        appointmentId,
        amount,
        paymentMethod,
        paymentStatus: 'pending',
      });

      await newPayment.save();

      res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        payment: newPayment,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
);

router.get('/payment-status/:paymentId',
  authenticateUser,             
  authorizeRole(['patient']),   
  async (req, res) => {
    const { paymentId } = req.params;

    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      res.status(200).json({
        success: true,
        paymentStatus: payment.paymentStatus,
        paymentDetails: payment,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment status',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
);

router.post('/update-payment-status',
  authenticateUser,             
  authorizeRole(['patient']),  
  async (req, res) => {
    const { paymentId, status } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({
        success: false,
        message: 'paymentId and status are required',
      });
    }

    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      payment.paymentStatus = status;
      await payment.save();

      res.status(200).json({
        success: true,
        message: 'Payment status updated successfully',
        payment: payment,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
);

module.exports = router;

