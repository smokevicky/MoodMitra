// 1. Create a variable to "remember" the name
let currentUsername = ""; 

function setName() {
    const nameInput = document.getElementById('username');
    if(nameInput.value) {
        currentUsername = nameInput.value; // SAVE the name here
        document.getElementById('name-step').style.display = 'none';
        document.getElementById('story-step').style.display = 'block';
        document.getElementById('greeting').innerText = `Hello, ${currentUsername}! What's on your heart?`;
    }
}

async function uploadStory() {
    const storyInput = document.getElementById('story');
    const content = storyInput.value;

    // Ensure currentUsername is defined globally in your script
    const username = currentUsername; 

    if (!username || !content) {
        alert("Please make sure you entered a name and a story!");
        return;
    }

    try {
        // Pointing to the specific port where the server is running
        const response = await fetch('http://localhost:3000/api/stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, content: content })
        });

        if (response.ok) {
            displayStory(username, content);
            storyInput.value = ''; // Clear text area
        } else {
            alert("Server error: Unable to save the story.");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Connection failed. Ensure 'node server.js' is running.");
    }
}
function displayStory(username, content) {
    const feed = document.getElementById('feed');
    
    // Create the div container
    const box = document.createElement('div');
    box.className = 'story-box';

    // Set the HTML structure: Name first, then the content
    box.innerHTML = `
        <h3 class="story-name">${username}</h3>
        <p class="story-content">${content}</p>
    `;

    // Use 'prepend' so the newest stories appear at the top!
    feed.prepend(box);
}

async function loadStories() {
    const response = await fetch('http://localhost:3000/api/stories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username, content: content })
});
    const stories = await response.json();
    stories.forEach(s => displayStory(s.username, s.content));
}
async function loadStories() {
    try {
        const response = await fetch('http://localhost:3000/api/stories');
        const stories = await response.json();
        
        // This clears the current feed so we don't duplicate items
        document.getElementById('feed').innerHTML = ''; 
        
        // Loop through the data and put it on screen
        stories.forEach(s => displayStory(s.username, s.content));
    } catch (error) {
        console.error("Could not load stories:", error);
    }
}

// This makes sure the function runs automatically when the page loads
window.onload = loadStories;
