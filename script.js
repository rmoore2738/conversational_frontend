conversation = [];
aboutme = "";

window.SpeechRecognition = window.SpeechRecognition
|| window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.interimResults = true;
const recordedVoice = document.querySelector('#recordedVoice');
// textbox
const input = document.querySelector('#input');

recognition.addEventListener('result', e => {
    const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('')

    recordedVoice.innerHTML = transcript;
    console.log("recorded voice", transcript);
});

// when startButton is clicked, start recognition
const startButton = document.querySelector('#startButton');
startButton.addEventListener('click', () => {
    recognition.start();
    // hide start button
    startButton.hidden = true;
    // show stop button
    stopButton.hidden = false;
});

// when stopButton is clicked, stop recognition
const stopButton = document.querySelector('#stopButton');
stopButton.addEventListener('click', () => {
    recognition.stop();
    // add to conversation list    
    conversation.push(["them",recordedVoice.innerHTML]);
    displayConversation();
    getNextWordSuggestions();
    getResponseSuggestions();
    // hide stop button
    stopButton.hidden = true;
    // show start button
    startButton.hidden = false;
});

// when send button is clicked, add to conversation list and say the sentence
const sendButton = document.querySelector('#sendButton');
sendButton.addEventListener('click', () => {
    // add to conversation list
    addToConversation(input.value);
    // conversation.push(["me",input.value]);
    displayConversation();
    // say the sentence
    saySentence(input.value);
    // clear input
    input.value = "";
});

// function to display conversation list in conversationHistory
function displayConversation() {
    var conversationHistory = document.getElementById("conversationHistory");
    conversationHistory.innerHTML = "";
    for (i = 0; i < conversation.length; i++) {
        var newDiv = document.createElement("div");
        if (conversation[i][0] == "me") {
            newDiv.className = "me";
        } else {
            newDiv.className = "them";
        }
        newDiv.innerHTML = conversation[i][0] + ": " + conversation[i][1];
        conversationHistory.appendChild(newDiv);
    }
    var objDiv = document.getElementById("convContainer");
    objDiv.scrollTop = objDiv.scrollHeight;
}

// function to add to conversation list
function addToConversation(sentence) {
    conversation.push(["me",sentence]);    
}

// function to say the sentence
function saySentence(sentence) {
    var msg = new SpeechSynthesisUtterance(sentence);
    window.speechSynthesis.speak(msg);
}

// function for placing the buttons in a circle
function placeButtons(x,y) {
    // for all the children on options div
    var options = document.getElementById("options");
    var children = options.children;
    var numChildren = children.length;
    var radius = 12;
    var angle = 0;
    var angleIncrement = 2*Math.PI/numChildren;
    for (i = 0; i < numChildren; i++) {
        var child = children[i];
        child.style.position = "absolute";                
        child.style.left = (x + radius*Math.cos(angle)) + "rem";
        child.style.top = (y + radius*Math.sin(angle)) + "rem";
        angle += angleIncrement;
    }
}

// function to form a sentence from the buttons clicked
function formSentence(element)
{                
    // add a space if not there
    if (input.value != "" && input.value.slice(-1) != " " && element.innerHTML.slice(0,1) != " ") {
        input.value += " " + element.innerHTML;
    }
    else {
        input.value += element.innerHTML;
    }
    getNextWordSuggestions();
}

// function to call POST API with conversation list as json paylod to get suggestions
function getNextWordSuggestions() {
    // show loader    
    var xhttp = new XMLHttpRequest();
    // populate buttons with loader
    loaderHtml = 'loading...';
    g_1_1_button = document.getElementById("g_1_1");
    g_1_1_button.innerHTML = loaderHtml;    
    g_1_2_button = document.getElementById("g_1_2");
    g_1_2_button.innerHTML = loaderHtml;    
    g_2_1_button = document.getElementById("g_2_1");
    g_2_1_button.innerHTML = loaderHtml;
    g_2_2_button = document.getElementById("g_2_2");    
    g_2_2_button.innerHTML = loaderHtml;
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // parse json response to list of suggestions
            const suggestions = JSON.parse(this.responseText);
            var specialChars = "!@#$^&%*()+=-[]\/{}|:<>?,.\"\\n";            
            for(i = 0; i < suggestions.length; i++) {
                for (var j = 0; j < specialChars.length; j++) {
                    suggestions[i] = suggestions[i].replace(new RegExp("\\" + specialChars[j], "gi"), "");
                }                 
            }
            // populate buttons with suggestions            
            g_1_1_button.innerHTML = suggestions[0];            
            g_1_2_button.innerHTML = suggestions[1];            
            g_2_1_button.innerHTML = suggestions[2];            
            g_2_2_button.innerHTML = suggestions[3];
            // hide loader
            document.getElementsByClassName("genloader").hidden = true;
        }
    };
    xhttp.open("POST", "http://localhost:8000/suggest_next_word", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    // allow cros origin requests    
    xhttp.setRequestHeader("Access-Control-Allow-Origin", "*");    
    // deep copy of conversation list
    tempConv = JSON.parse(JSON.stringify(conversation));
    if (input.value != "") {
        // add input to conversation list
        tempConv.push(["me",input.value]);
    }
    body = {
        "conversation": tempConv,
        "suggestion_sizes": [1, 1, 2, 2, 4]
    }        
    console.log("body", body);
    xhttp.send(JSON.stringify(body));
}
// function to call POST API with conversation list as json paylod to get suggestions
function getResponseSuggestions() {
    c_button = document.getElementById("c");
    c_button.innerHTML = "loading...";
    qa_button = document.getElementById("qa");
    qa_button.innerHTML = "loading...";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // parse json response to list of suggestions
            var suggestions = JSON.parse(this.responseText);
            // populare c button with converational response            
            c_button.innerHTML = suggestions['conv'];
            // populate qa button with qa response            
            qa_button.innerHTML = suggestions['qa'];
        }
    };
    xhttp.open("POST", "http://localhost:8000/suggest_from_response", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    // allow cros origin requests
    xhttp.setRequestHeader("Access-Control-Allow-Origin", "*");    
    body = {
        "conversation": conversation,
        "aboutme": aboutme
    }
    // alert(JSON.stringify(body))
    // body = '{"conversation": [["them","what is your name?"]],"aboutme": "My name is Bob. I am 24 years old."}'
    xhttp.send(JSON.stringify(body));
}

// function to clear the conversation
function clearConversation() {
    conversation = [];
    displayConversation();
}

// function to fill about me div with about me text
function fillAboutMe() {

    var aboutMe = document.getElementById("aboutme");
    aboutMe.value = aboutme;
}

// function to update about me text
function updateAboutMe() {
    var aboutMe = document.getElementById("aboutme");
    aboutme = aboutMe.value;
}

// function to refresh suggestions
function refreshSuggestions() {
    getNextWordSuggestions();
    getResponseSuggestions();
}

placeButtons(15,15);
displayConversation();
fillAboutMe();
