(function() {
  var chatContainer = document.createElement('div');
  chatContainer.style.position = 'fixed';
  chatContainer.style.bottom = '10px';
  chatContainer.style.right = '10px';
  chatContainer.style.width = '300px';
  chatContainer.style.height = '400px';
  chatContainer.style.border = '1px solid #ccc';
  chatContainer.style.backgroundColor = '#f9f9f9';
  chatContainer.style.userSelect = 'none';
  chatContainer.style.cursor = 'move';

  var isDragging = false;
  var initialX = 0;
  var initialY = 0;

  chatContainer.addEventListener('mousedown', function(event) {
    isDragging = true;
    initialX = event.clientX;
    initialY = event.clientY;
  });

  chatContainer.addEventListener('mousemove', function(event) {
    if (isDragging) {
      var deltaX = event.clientX - initialX;
      var deltaY = event.clientY - initialY;
      var newX = parseInt(chatContainer.style.right) - deltaX;
      var newY = parseInt(chatContainer.style.bottom) - deltaY;
      chatContainer.style.right = newX + 'px';
      chatContainer.style.bottom = newY + 'px';
      initialX = event.clientX;
      initialY = event.clientY;
    }
  });

  chatContainer.addEventListener('mouseup', function() {
    isDragging = false;
  });

  var chatHeader = document.createElement('div');
  chatHeader.style.padding = '10px';
  chatHeader.style.backgroundColor = '#333';
  chatHeader.style.color = '#fff';
  chatHeader.style.fontWeight = 'bold';
  chatHeader.textContent = 'Chat Room';

  var settingsIcon = document.createElement('div');
  settingsIcon.style.position = 'absolute';
  settingsIcon.style.top = '10px';
  settingsIcon.style.right = '10px';
  settingsIcon.style.width = '20px';
  settingsIcon.style.height = '20px';
  settingsIcon.style.backgroundImage = 'url("settings.png")';
  settingsIcon.style.backgroundSize = 'contain';
  settingsIcon.style.backgroundRepeat = 'no-repeat';
  settingsIcon.style.backgroundPosition = 'center';
  settingsIcon.style.cursor = 'pointer';

  var chatMessages = document.createElement('div');
  chatMessages.style.overflowY = 'scroll';
  chatMessages.style.height = 'calc(100% - 60px)';
  chatMessages.style.padding = '10px';

  var chatInput = document.createElement('input');
  chatInput.style.width = '100%';
  chatInput.style.padding = '5px';

  chatContainer.appendChild(chatHeader);
  chatContainer.appendChild(settingsIcon);
  chatContainer.appendChild(chatMessages);
  chatContainer.appendChild(chatInput);
  document.body.appendChild(chatContainer);

  // Chat room logic
  var socket;

  function receiveMessage(message) {
    var messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
  }

  function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      console.log('Error: Not connected to the server.');
    }
  }

  function connectToServer(serverURL) {
    socket = new WebSocket(serverURL);
    socket.onopen = function() {
      console.log('Connected to server');
    };
    socket.onmessage = function(event) {
      var message = event.data;
      receiveMessage(message);
    };
    socket.onclose = function(event) {
      console.log('Disconnected from server');
    };
    socket.onerror = function(event) {
      console.log('WebSocket error:', event);
    };
  }

  function promptForServerURL() {
    var serverURL = prompt('Enter the chat server URL:');
    if (serverURL) {
      connectToServer(serverURL);
      localStorage.setItem('chatServerURL', serverURL);
    }
  }

  function logout() {
    chatContainer.style.display = 'none';
    localStorage.removeItem('chatUsername');
    promptForServerURL();
  }

  settingsIcon.addEventListener('click', function() {
    var option = prompt('Choose an option:\n1. Logout\n2. Change chat server');
    if (option === '1') {
      logout();
    } else if (option === '2') {
      promptForServerURL();
    }
  });

  chatInput.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) {
      var message = chatInput.value;
      sendMessage(message);
      chatInput.value = '';
    }
  });

  // Check if chat server URL is already stored in local storage
  var storedServerURL = localStorage.getItem('chatServerURL');
  if (storedServerURL) {
    connectToServer(storedServerURL);
  } else {
    promptForServerURL();
  }

  // End of chat room logic

})();
