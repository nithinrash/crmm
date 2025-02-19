const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const leadsRoutes = require('./routes/leadsRoutes'); // Import leadsRoutes
const uploadLeadsSource = require('./routes/uploadLeadsSource');
const uploadAuditSource = require('./routes/uploadAuditSource'); // Import uploadAuditSource
const pushDataRoutes = require('./routes/pushDataRoutes'); // Import pushDataRoutes



const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173', 
	'http://wingeritsolutionscrm.com:8439',


  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  credentials: true, // Allow cookies or authorization headers
}));






// Middleware to parse JSON requests
app.use(bodyParser.json({limit : '100mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit:'100mb' }));

// Default route for testing
app.get('/', (req, res) => {
  res.send('CORS-enabled server is working!');
});

// Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/leads', leadsRoutes); // Leads routes
app.use('/api/sourceleads', uploadLeadsSource); // Upload leads routes
app.use('/api/audit', uploadAuditSource); // Audit routes
app.use('/api/push', pushDataRoutes); // Push data routes

app.listen(process.env.PORT)

//app.listen(3000)