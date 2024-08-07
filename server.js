const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://thota:Abc123@cluster0.ndcdzaa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});


// Define schemas and models
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const messageSchema = new mongoose.Schema({
  user: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// API routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.send({ message: 'User registered successfully' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ username }, 'secret');
    res.send({ token });
  } else {
    res.status(401).send({ message: 'Invalid credentials' });
  }
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Send all previous messages to the newly connected user
  Message.find().then((messages) => {
    socket.emit('init', messages);
  });

  socket.on('message', async (msg) => {
    const message = new Message({ user: msg.user, message: msg.message });
    await message.save();  // Save the message to the database
    io.emit('message', msg);  // Broadcast the message to all users
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3001, () => {
  console.log('Server is running on port 3001');
});
