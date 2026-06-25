const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
const path = require('path');

const app = express();
const port = 3000;

// Initialize Resend with the provided API key
const resend = new Resend('re_3m9RCT4u_CRXAXHzTHEv92Yo6K8oDi9Um');

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// API Endpoint to send email
app.post('/api/send-email', async (req, res) => {
    try {
        const { id, text, department, priority, location } = req.body;

        // Prepare email content
        let emailHtml = `
            <h2>New Grievance Report</h2>
            <p><strong>ID:</strong> ${id}</p>
            <p><strong>Issue:</strong> ${text}</p>
            <p><strong>Category:</strong> ${department}</p>
            <p><strong>Priority:</strong> <span style="text-transform: uppercase; font-weight: bold;">${priority}</span></p>
        `;

        if (location) {
            emailHtml += `<p><strong>Location:</strong> <a href="https://maps.google.com/?q=${location.lat},${location.lng}">View on Google Maps</a></p>`;
        }

        const data = await resend.emails.send({
            from: 'CivicAI <onboarding@resend.dev>',
            to: ['harishrathnakumar10@gmail.com'],
            subject: `Grievance ${id} - ${department}`,
            html: emailHtml,
        });

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Failed to send email:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start the server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Backend server running at http://localhost:${port}`);
    });
}

// Export the app for Vercel
module.exports = app;
