const express = require('express');
const { userAuth } = require('../middlewares/auth');
const paymentRouter = express.Router();
const razorpayInstance = require('../utils/razorpay');
const Payment  = require('../models/payment');
const User = require('../models/user');
const { membershipAmounts } = require('../utils/constants');
const {validateWebhookSignature} = require('razorpay/dist/utils/razorpay-utils');
const user = require('../models/user');

paymentRouter.post('/payment/create', userAuth, async (req, res) => {
    try {
        const user = req.user;
        if (!user) { throw new Error("User not found");}
        const {membershipType} = req.body;

        const order  = await razorpayInstance.orders.create({
            amount: membershipAmounts[membershipType] * 100, // Amount in paise (5000 paise = 50 INR)
            currency: "INR",
            receipt: `receipt_${user.email}`,
            notes: {
                userId: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                description: "Payment for DevTinder subscription",
                membershipType: membershipType 
            },
        });
        if (!order) {throw new Error("Failed to create order");}

        const payment = new Payment({
            orderId: order.id,
            userId: user._id,
            amount: order.amount    , // Amount in paise
            currency: order.currency,
            status: order.status,
            receipt: order.receipt,
            notes: {
                userId: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                description: `Payment for DevTinder subscription - ${membershipType}`,
                membershipType: membershipType
            },
        });
        if (!payment) {throw new Error("Failed to create payment record");}

        const savedPayment = await payment.save();
        if (!savedPayment) {throw new Error("Failed to save payment record");}

        res.json({
            ...savedPayment.toObject(),
            RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
        })

    } catch (err) {
        res.status(400).send("Error while creating payment: " + err.message);
    }
})

paymentRouter.post('/payment/webhook', async (req, res) => {
    try {
        const webhookBody = req.body;
        const webhookSignature = req.headers['x-razorpay-signature'];
        if (!webhookSignature) {
            return res.status(400).send("Missing webhook signature");
        }
        if (!webhookBody) {
            return res.status(400).send("Missing webhook body");
        }

        const isWebhookValid = validateWebhookSignature(
            JSON.stringify(webhookBody),
            webhookSignature,
            process.env.RAZORPAY_WEBHOOK_SECRET
        )
        if (!isWebhookValid) {
            return res.status(400).send("Invalid webhook signature");
        }

        const { event, payload } = webhookBody;

        if (event === 'payment.captured') {
            const paymentDetails = payload.payment.entity;
            const payment = await Payment.findOneAndUpdate(
                { orderId: paymentDetails.order_id },
                {
                    status: paymentDetails.status,
                    amount: paymentDetails.amount,
                    currency: paymentDetails.currency,
                    receipt: paymentDetails.receipt,
                    notes: paymentDetails.notes,
                },
                { new: true }
            );

            const user = await User.findById(payment.userId);       
            if (!user) {return res.status(404).send("User not found"); }
            if (!paymentDetails.notes || !paymentDetails.notes.membershipType) {
                return res.status(400).send("Missing membership type in payment notes");
            }
            if (!membershipAmounts[paymentDetails.notes.membershipType]) {
                return res.status(400).send("Invalid membership type in payment notes");
            }
            
            // Update user to premium
            if (user.isPremium) {
                return res.status(400).send("User is already a premium member");
            }

            user.isPremium = true;
            user.membershipType = payment.notes.membershipType;
            await user.save();

            if (!payment) {
                return res.status(404).send("Payment record not found");
            }
            res.status(200).send("Payment updated successfully");
        }
        else if (event === 'order.paid') {
            const orderDetails = payload.order.entity;
            const payment = await Payment.findOneAndUpdate(
                { orderId: orderDetails.id },
                {
                    status: orderDetails.status,
                    amount: orderDetails.amount,
                    currency: orderDetails.currency,
                    receipt: orderDetails.receipt,
                    notes: orderDetails.notes,
                },
                { new: true }
            );  
            if (!payment) {
                return res.status(404).send("Payment record not found");
            }
            res.status(200).send("Order updated successfully");
        }
        else {
            return res.status(400).send("Unhandled event type: " + event);
        }
        
        return res.status(200).send("Webhook processed successfully");

    } catch (err) {
        res.status(400).send("Error while processing payment success: " + err.message);
    }
});

paymentRouter.get('/payment/verify', userAuth, async (req, res) => {
    const user = req.user.toJSON();
    if (!user) {return res.status(404).send("User not found");}

    try {
        const payment = await Payment.findOne({ userId: user._id, status: 'captured' })
        
        if (!payment) {return res.status(404).send("No active payment found for user");}
        if (!payment.notes || !payment.notes.membershipType) {return res.status(400).send("Missing membership type in payment notes");}
        if (!membershipAmounts[payment.notes.membershipType]) {return res.status(400).send("Invalid membership type in payment notes");}
        
        if (!user.isPremium) {
            user.isPremium = true;
            user.membershipType = payment.notes.membershipType;
            await user.save();
        }
    
        res.status(200).json({
            ...user,
        });
    } catch (err) {
        res.status(400).send("Error while verifying payment: " + err.message);
    }
})

module.exports = paymentRouter;