// Initialize local persistent memory array for the cache state history
let searchHistory = JSON.parse(localStorage.getItem("studyHistory")) || [];

// Runs immediately on startup window mount 
window.onload = function() {
    renderHistory();
    changeTheme(); // Sets initial selection
    changeMotion(); // Sets initial dynamic backdrop
};

async function generateMaterial() {
    const topicInput = document.getElementById("topic");
    const difficultyInput = document.getElementById("difficulty");
    const resultDiv = document.getElementById("result");
    const button = document.getElementById("generateBtn");
    const actionButtons = document.getElementById("action-buttons");
    
    const topic = topicInput.value.trim();
    const difficulty = difficultyInput.value;

    if (!topic) {
        alert("Please enter a topic first!");
        return;
    }

    button.disabled = true;
    button.innerText = "Generating... ⏳";
    resultDiv.style.display = "block";
    actionButtons.style.display = "none";
    resultDiv.innerHTML = "<p style='text-align: center;'>Consulting AI Engine via Groq Cloud Core...</p>";

    try {
        const response = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic, difficulty })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.content || "Server execution tracking error");
        }

        // Render response content 
        displayResults(data.content);

        // Feature: Push tracking data directly into persistent storage structures
        saveToHistory(topic, difficulty, data.content);

    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red; text-align: center;">Error: ${error.message}</p>`;
    } finally {
        button.disabled = false;
        button.innerText = "Generate Study Material";
    }
}

function displayResults(content) {
    const resultDiv = document.getElementById("result");
    const actionButtons = document.getElementById("action-buttons");
    resultDiv.innerHTML = marked.parse(content);
    resultDiv.style.display = "block";
    actionButtons.style.display = "flex";
}

/* --- THEME CONTROLLER ENGINES --- */
function changeTheme() {
    const selectedTheme = document.getElementById("themeSelect").value;
    document.documentElement.setAttribute("data-theme", selectedTheme);
}

function changeMotion() {
    const motionMode = document.getElementById("motionSelect").value;
    const bgContainer = document.getElementById("motionBg");
    
    // Wipe class attributes clean and reassess dynamic motion bounds
    bgContainer.className = "motion-bg"; 
    bgContainer.classList.add(`motion-${motionMode}`);
}

/* --- LOCAL CHAT STORAGE HISTORY UTILITIES --- */
function saveToHistory(topic, difficulty, content) {
    // Prevent duplicated index values by removing any matching topic
    searchHistory = searchHistory.filter(item => item.topic.toLowerCase() !== topic.toLowerCase());
    
    // Add raw record context directly to start of line array array
    searchHistory.unshift({ topic, difficulty, content });
    
    // Lock history container capacity at max 10 temporary sessions
    if (searchHistory.length > 10) searchHistory.pop();
    
    localStorage.setItem("studyHistory", JSON.stringify(searchHistory));
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";
    
    if(searchHistory.length === 0) {
        historyList.innerHTML = "<li style='cursor:default; text-align:center;'>No history yet</li>";
        return;
    }

    searchHistory.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerText = `${item.topic} (${item.difficulty})`;
        li.onclick = () => {
            document.getElementById("topic").value = item.topic;
            document.getElementById("difficulty").value = item.difficulty;
            displayResults(item.content);
        };
        historyList.appendChild(li);
    });
}

function clearHistory() {
    searchHistory = [];
    localStorage.removeItem("studyHistory");
    renderHistory();
    document.getElementById("result").style.display = "none";
    document.getElementById("action-buttons").style.display = "none";
}

// Global scope actions utilities for document control mapping pipeline
function copyContent() {
    const resultText = document.getElementById("result").innerText;
    navigator.clipboard.writeText(resultText).then(() => alert("Copied to clipboard!"));
}

function downloadPDF() {
    const element = document.getElementById("result");
    const topic = document.getElementById("topic").value || "StudyNotes";
    const opt = {
        margin: 1,
        filename: `${topic.replace(/\s+/g, '_')}_Notes.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}