const socket = io("http://localhost:3000");

let currentUsername;

$("#join-btn").on("click", function () {
        var username = $("#usrname").val();
        var roomId = $("#roomId").val();

        if (username.trim() === "" || roomId.trim() === "") {
            alert("Please enter both your username and room ID before joining.");
            return false; 
        }
    joinRoom();
});

function joinRoom() {
    currentUsername = $("#usrname").val();
    const roomId = $("#roomId").val();

    $("#RI").val("Room ID: " + roomId);
    $("#game-page-1").hide();
    $("#game-page-2").show();

    socket.emit("joinRoom", {  username: currentUsername, roomId: roomId});

}

socket.on("message", function (data) {
    const messageText = data.text.trim().toLowerCase();
    const randomWord = $("#display").text().trim().toLowerCase();

    if (data.username === '') {
        const message = `<p class="server-message">${data.text}</p>`;
        $(".message-box").append(message);
    } else if (messageText === randomWord) {
        const winner = data.username;
        const winMessage = `${winner} has won by guessing the word "${randomWord}"!`;
        const guessMessage = `<p><span class="username">${data.username}:</span> ${data.text}</p>`;
         
         // console.log(winner);
        $(".message-box").append(guessMessage);
        dispGrayDiv(winMessage); 
        socket.emit("userWon", { winner: winner,winMessage: winMessage }); 
       // console.log(winner);
        socket.emit('updateScore', {username: winner});
        $('.message-box').scrollTop($('.message-box')[0].scrollHeight);
    } else {
        const message = `<p><span class="username">${data.username}:</span> ${data.text}</p>`;
        $(".message-box").append(message);
        $('.message-box').scrollTop($('.message-box')[0].scrollHeight);
    }
});

// Listen for 'updateScores' event from the server
socket.on('updateScores', function(data) {
    console.log(data);
    const gameWinner = data.winner;
    const userScores = data.userScores;
    // console.log(data);
    updateScoreUI( gameWinner, userScores);
});

// Function to update the score UI
let userScores = {};

function updateScoreUI(userScores, gameWinner) {
    console.log(userScores);
    console.log(gameWinner);
    const scoreDiv = $("#score");
    const winner = gameWinner;
    const winnerScoreHTML = `<div class="user-score winner">${winner}: ${userScores} (Winner)</div>`;
    scoreDiv.append(winnerScoreHTML);
   
}


function updateScoreDiv() {
    $("#score").empty(); 

    Object.keys(userScores).forEach(username => {
        const scoreHTML = `<div class="user-score">${username}: ${userScores[username]}</div>`;
        $("#score").append(scoreHTML);
    });
}


//Function to display gray overlay with win message
function dispGrayDiv(winMessage) {
    if (!$("#gray-overlay").is(":visible")) { 
        $("#gray-overlay").html(`<div class="win-message">${winMessage}</div>`);
        $("#gray-overlay").fadeIn(); 
        setTimeout(function(){
            $("#gray-overlay").fadeOut(); 
        }, 3000);
    }
}


socket.on('displayGray',function(data){
    dispGrayDiv(data.winMessage);
});

socket.on('userWon', function(data) {
    console.log(data);
    $(".message-box").append(`<li class="message win">${data.winMessage}</li>`);
    dispGrayDiv(data.winMessage); 
    stopTimer();
    socket.emit('setInitiatorTimerToZero');
});

socket.on('stopTimerForAll', function(){
    stopTimer();
});

function stopTimer() {
    clearInterval(timerInterval); 
    $("#timer").text("0:00");
    timeLeft = 0; 
}

// Update user list with scores
socket.on("updateUsersList", function (data) {
    $("#user-names").empty();
    data.userList.forEach(user => {
        const userDiv = $(`
            <div class="userlogo-box" id="${user.username}">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" id="user-logo" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                    <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                </svg>
                <span class="username user-name-style">${user.username}</span></br></br>
            </div>`
        );
        $("#user-names").append(userDiv);
    });
});

$("#send-button").on("click", function () {
    sendMessage();
    var sendButton = $(this);
    sendButton.fadeOut(500, function() {
        $(this).fadeIn(500);
    });
});

$("#chat-input").on("keypress", function (event) {
    if (event.which === 13) {
        sendMessage();
    }
});

function sendMessage() {
    const message = $("#chat-input").val().trim();
    if (message !== "") {
        socket.emit("message", { username: currentUsername, text: message });
        $("#chat-input").val("");
    }
}

//drawing functionalitty 
const canvas = $("#game-canvas")[0];
const context = canvas.getContext('2d');
let isDrawing = false;
let eraseMode = false;
let brushMode = false;
let userColor = '#000';
let pencilSize = 1;
let eraserSize = 5;
let brushSize = 5;
let mouseDown = false;

$('#brush-size').on('input', function() {
    if (eraseMode) {
        eraserSize = $(this).val();
    } else if (brushMode) {
        brushSize = $(this).val();
    } else {
        pencilSize = $(this).val();
    }
});

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
   
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY; 

    console.log(x, y);

    return{
        x: x,
        y: y
    };
 
       
}

function draw(pos) {
    if (isDrawing) {
        if (eraseMode) {
            context.clearRect(pos.x - eraserSize / 2, pos.y - eraserSize / 2, eraserSize, eraserSize);
        } else if (brushMode) {
            context.beginPath();
            context.fillStyle = userColor;
            context.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
            context.fill();
        } else {
            context.lineTo(pos.x, pos.y);
            context.stroke();
        }
    }
}

function startDrawing(pos) {
    isDrawing = true;
    if (eraseMode) {
        context.clearRect(pos.x - eraserSize / 2, pos.y - eraserSize / 2, eraserSize, eraserSize);
    } else if (brushMode) {
        context.beginPath();
        context.fillStyle = userColor;
        context.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
        context.fill();
    } else {
        context.beginPath();
        context.moveTo(pos.x, pos.y);
    }
}

function endDrawing() {
    isDrawing = false;
    context.closePath();
}

$(canvas).on('mousedown', function (e) { 
    const pos = getMousePos(e);
    startDrawing(pos);
    socket.emit('startDrawing', pos);
});

$(canvas).on('mousemove', function (e) {
    const pos = getMousePos(e);
    draw(pos);
    socket.emit('draw', pos);
});


$(document).on('mouseup', function () {
    endDrawing();
    socket.emit('endDrawing');
});

socket.on('startDrawing', startDrawing);
socket.on('draw', draw);
socket.on('erase', (pos) =>{
    context.clearRect(pos.x - eraserSize / 2, pos.y - eraserSize / 2, eraserSize, eraserSize);
});
socket.on('endDrawing', endDrawing);

$('#pencil').on('click', function () {
    var pencilContainer = $('#pencil');
    eraseMode = false;
    brushMode = false;
    canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22currentColor%22 class=%22bi bi-pencil%22 viewBox=%220 0 16 16%22%3E%3Cpath d=%22M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325%22/%3E%3C/svg%3E") 0 0, auto';
    
    pencilContainer.addClass('tools_effect');

    setTimeout(function() {
        pencilContainer.removeClass('tools_effect');
    }, 500);


});

$('#eraser').on('click', function () {
    var eraser_container= $("#eraser");
    eraseMode = true;
    brushMode = false;
    canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22currentColor%22 class=%22bi bi-eraser%22 viewBox=%220 0 16 16%22%3E%3Cpath d=%22M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z%22/%3E%3C/svg%3E") 0 0, auto';
    eraser_container.addClass('tools_effect');

    setTimeout(function() {
        eraser_container.removeClass('tools_effect');
    }, 500);

});

$('#brush').on('click', function () {
    eraseMode = false;
    brushMode = true;
    canvas.style.cursor = 'crosshair';

});

$('#brush-container').on('click', function () {
    var brush = $('#brush-container');
    eraseMode = false;
    brushMode = true;
    canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22currentColor%22 class=%22bi bi-brush-fill%22 viewBox=%220 0 16 16%22%3E%3Cpath d=%22M15.825.12a.5.5 0 0 1 .132.584c-1.53 3.43-4.743 8.17-7.095 10.64a6.1 6.1 0 0 1-2.373 1.534c-.018.227-.06.538-.16.868-.201.659-.667 1.479-1.708 1.74a8.1 8.1 0 0 1-3.078.132 4 4 0 0 1-.562-.135 1.4 1.4 0 0 1-.466-.247.7.7 0 0 1-.204-.288.62.62 0 0 1 .004-.443c.095-.245.316-.38.461-.452.394-.197.625-.453.867-.826.095-.144.184-.297.287-.472l.117-.198c.151-.255.326-.54.546-.848.528-.739 1.201-.925 1.746-.896q.19.012.348.048c.062-.172.142-.38.238-.608.261-.619.658-1.419 1.187-2.069 2.176-2.67 6.18-6.206 9.117-8.104a.5.5 0 0 1 .596.04%22/%3E%3C/svg%3E") 0 0, auto';
    brush.addClass('tools_effect');
    setTimeout(function() {
        brush.removeClass('tools_effect');
    }, 500);
});

$('.color-pallet').on('click', function () {
    var colors = $('.color-pallet');

    userColor = $(this).css('background-color');
    brushMode = true;
    eraseMode = false;
    canvas.style.cursor = 'cell';

    colors.addClass('colors_effect');
    setTimeout(function(){
        colors.removeClass('colors_effect');
    });

});

$('#usr-clr').on('input', function () {
    userColor = $(this).val();
    brushMode = true;
    eraseMode = false;
    canvas.style.cursor = 'crosshair';
});

$('#Clear').on('click', function() {
    clearCanvas();
    socket.emit('canvasCleared');

    var clearButton = $(this);
    clearButton.fadeOut(500, function() {
        $(this).fadeIn(500);
    });
});

socket.on('canvasCleared', function() {
    clearCanvas();
});

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function dispGrayDiv(){
    $("#gray-overlay").css({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "40px",
    })
    $("#gray-overlay").fadeIn(); 
    setTimeout(function(){
        $("#gray-overlay").fadeOut(); 
    }, 2000);
    
   
};

//set timer
let timerInterval; 

function startTimer() {
    let timeLeft = 60; 
    updateTimerDisplay(timeLeft); 

    timerInterval = setInterval(() => {
        timeLeft--; 
        updateTimerDisplay(timeLeft); 

        if (timeLeft === 0) {
            clearInterval(timerInterval); 
            $("#display").text("Time's up!"); 
        }
    }, 1000);
}

function updateTimerDisplay(timeLeft) {
    if (timeLeft >= 0) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        $("#timer").text(formattedTime);
    } else {
        $("#timer").text("0:00");
    }
}

$('#start-button').on('click', function(){
    socket.emit('start');
    dispGrayDiv();
    startTimer();
});

socket.on('word', (randomWord) => {
    dispGrayDiv();
    $("#display").text(randomWord);
    startTimer();
});

socket.on('maxLength', (maxLength) =>{
    dispGrayDiv();
    $("#display").text("Maximum Length: " + maxLength);
    startTimer();
});


