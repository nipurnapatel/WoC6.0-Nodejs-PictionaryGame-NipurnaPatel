import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

var users = [];
let connections = [];
let gameStarted = false;
let userScores = {};

function getUsersInRoom(roomId) {
    return users.filter(user => user.roomId === roomId);
}

function generateRandomWord(){
    return words[Math.floor(Math.random() * words.length)];
}

io.on("connection", function (socket) {
    console.log("A user connected...");

    socket.on("joinRoom", function ({ username, roomId }) {
        console.log(username, roomId);

        users.push({ username, roomId, socketId: socket.id });
        socket.join(roomId);

        io.to(roomId).emit('updateUsersList', { userList: getUsersInRoom(roomId) });
        socket.emit('message', { username:'', text: `Welcome, ${username}!` });
        socket.broadcast.to(roomId).emit('message', { username:'', text: `${username} has joined the room.` });


        socket.on('start', () => {
             gameStarted = true;
            const randomWord = generateRandomWord();
            socket.emit('word', randomWord); 
            socket.broadcast.emit('maxLength', randomWord.length);  
        });

        connections.push(socket);
        console.log(`${socket.id} has connected.`);

        socket.on('startDrawing', (pos) => {
            connections.forEach(con => {
                if(con.id != socket.id){
                    console.log('Start drawing:', pos);
                    con.emit('startDrawing', pos);
                }
            });
           
        });
    
        socket.on('draw', (pos) => {
            connections.forEach(con => {
                if(con.id != socket.id){
                    //console.log('Drawing:', pos);
                con.emit('draw', pos);
                }
            });
           
        });
    
        socket.on('erase', (pos) => {
            connections.forEach(con => {
                if(con.id != socket.id){
                    console.log('Erasing:', pos);
                    con.emit('erase', pos);
                }
            });
           
        });

        socket.on('endDrawing', () => {
            connections.forEach(con => {
                if(con.id != socket.id){
                    console.log('End drawing');
                con.emit('endDrawing');
                }
            });
        });
    
        function emitRandomWord(socket) {
            const randomWord = generateRandomWord();
            socket.emit('randomWord', randomWord);
        }
        
        socket.on('displayGray',function(data){
            io.emit('displayGray', data);
        });
        
        socket.on('userWon', function(data) {
            io.emit('userWon', { winMessage: data.winMessage, username: data.winner});
            io.emit('displayGray', {winMessage: data});
            io.emit('stopTimerForAll'); 
        
            const scoreIncrement = 100;
            io.emit('updateScores', { winner:data.winner,userScores: scoreIncrement });
        });


        socket.on('canvasCleared', () => {
            socket.broadcast.emit('canvasCleared');
        }); 

});
    
socket.on("message", function (data) {
    io.emit("message", { username: data.username, text: data.text });
    console.log(data);
});

socket.on("disconnect", function () {
        console.log(`A user disconnected...`);
        const userIndex = users.findIndex(u => u.socketId === socket.id);
        if (userIndex !== -1) {
            const { username, roomId } = users[userIndex];
            users.splice(userIndex, 1);

            io.to(roomId).emit('updateUsersList', { userList: getUsersInRoom(roomId) });
            socket.emit('message', { text: `${username} has left the room.` });
        }
    });
});


server.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});

getUsersInRoom = (roomId) => {
    return users.filter(user => user.roomId === roomId);
};


const words = [
    'Apple',
    'Banana',
    'Carrot',
    'Dolphin',
    'Elephant',
    'Flower',
    'Giraffe',
    'Horse',
    'Igloo',
    'Jaguar',
    'Kangaroo',
    'Lion',
    'Monkey',
    'Nest',
    'Octopus',
    'Penguin',
    'Quilt',
    'Rabbit',
    'Sunflower',
    'Turtle',
    'Umbrella',
    'Violin',
    'Watermelon',
    'Xylophone',
    'Yacht',
    'Zebra',
    'Ant',
    'Bear',
    'Cat',
    'Dog',
    'Eagle',
    'Fish',
    'Hammer',
    'Ice Cream',
    'Jellyfish',
    'Kite',
    'Lemon',
    'Mango',
    'Ninja',
    'Owl',
    'Panda',
    'Queen',
    'Robot',
    'Sailboat',
    'Tiger',
    'Unicorn',
    'Vase',
    'Whale',
    'X-ray',
    'Yak',
    'Zoo',
    'Acorn',
    'Bee',
    'Caterpillar',
    'Elephant',
    'Firetruck',
    'Guitar',
    'Hamburger',
    'Igloo',
    'Jet',
    'Kite',
    'Lighthouse',
    'Moon',
    'Nurse',
    'Ostrich',
    'Pirate',
    'Quilt',
    'Rainbow',
    'Snowman',
    'Tree',
    'Umbrella',
    'Volcano',
    'Waterfall',
    'Xylophone',
    'Yo-yo',
    'Zebra',
    'Airplane',
    'Balloon',
    'Candy',
    'Dragon',
    'Eggplant',
    'Frog',
    'Garden',
    'Horse',
    'Island',
    'Jungle',
    'Kangaroo',
    'Lamp',
    'Map',
    'Nest',
    'Orange',
    'Penguin',
    'Queen',
    'Rain',
    'Sun',
    'Tent',
    'UFO',
    'Vampire',
    'Elephant', 
    'Bicycle',
    'Pizza', 'Guitar',
    'Sunflower',
    'Clock', 
    'Snowman', 
    'Dragon', 
    'Butterfly', 
    'Firetruck',
    'Rainbow', 
    'Banana', 
    'Pirate', 
    'Cupcake', 
    'Telescope', 
    'Unicorn', 
    'Mermaid', 
    'Kangaroo', 
    'Spaceship', 
    'Pineapple',
    'Scissors', 
    'Tornado', 
    'Lighthouse', 
    'Popcorn', 
    'Robot', 
    'Octopus', 
    'Astronaut', 
    'Cupid', 
    'T-rex', 
    'Spacesuit',
    'Volcano', 
    'Bathtub', 
    'Hotdog', 
    'Koala', 
    'Giraffe', 
    'Ladybug', 
    'Pumpkin', 
    'Jellyfish', 
    'Hammock', 
    'Seashell',
    'Cactus', 
    'Toothbrush', 
    'Crocodile', 
    'Beehive', 
    'Snowflake', 
    'Earthquake', 
    'Toothpaste', 
    'Watermelon', 
    'Kangaroo',
    'Fireworks', 
    'Penguin', 
    'Eiffel Tower', 
    'Birthday Cake', 
    'Tooth Fairy', 
    'Surfboard', 
    'Dragonfly', 
    'Mailbox', 
    'Bulldozer',
    'Crayons', 
    'Tugboat', 
    'Scarecrow', 
    'Squirrel', 
    'Sandcastle', 
    'Trampoline', 
    'Jack-o-lantern', 
    'Boomerang', 
    'Trombone',
    'Pajamas', 
    'Teapot', 
    'Bubble Bath', 
    'Lightning', 
    'Jellybean', 
    'Wheelbarrow', 
    'Toothpick', 
    'Dragonfly', 
    'Kangaroo',
    'Garden Hose', 
    'Slippers', 
    'Lemonade', 
    'Pretzel', 
    'Helicopter', 
    'Kangaroo', 
    'Spaceship', 
    'Pirate Ship', 
    'Seagull',
    'Ice Cream Cone', 
    'Jump Rope', 
    'Windmill', 
    'Tornado', 
    'Jackhammer', 
    'Sledgehammer', 
    'Toaster', 
    'Spacesuit', 
    'Lemonade',
    'Paper Airplane', 
    'Fruitcake', 
    'Donut', 
    'Lotus',
    'Rose',
]

