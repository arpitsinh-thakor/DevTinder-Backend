const cron = require('node-cron');
const {subdays, startOfDay, endOfDay} = require('date-fns');
const sendEmail = require('./utils/sesClient');
const ConnectionRequest = require('./models/connectionRequest'); 

cron.schedule('0 8 * * *', async () => {
    try {

        const yesterday = subdays(new Date(), 0);
        const yesterdayStart = startOfDay(yesterday);
        const yesterdayEnd = endOfDay(yesterday);

        const pendingRequests = await ConnectionRequest.find({
            status: 'interested',
            createdAt: {
                $gte: yesterdayStart,
                $lte: yesterdayEnd
            }
        }).populate('sender receiver');

        //unique emails of users who sent requests
        const listOfEmails = [
            ...new Set(pendingRequests.map(request => request.sender.email))
        ]

        if (listOfEmails.size === 0) {
            console.log('No pending requests found for yesterday.');
            return;
        }

        for (const email of listOfEmails) {
            const emailRes = await sendEmail.run(
                "Reminder!! Pending Connection Requests",
                `You have pending connection requests from yesterday. Please check your DevTinder app. 
                If you have already reviewed them, please ignore this email. ${email}`,
                email
            );
            console.log(`Email sent to ${email}:`, emailRes);
        }

    } catch (error) {
        console.error('Error running daily task:', error);
    }
})