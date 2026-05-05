// ===================== STATE =====================
let currentEmotion = "Neutral";
let pendingEmotion = "Neutral";
let stableCount = 0;

const STABLE_THRESHOLD = 2; // emotion must repeat twice (anti-flicker)

// ===================== AUDIO =====================
const happyAudio = document.getElementById("happyAudio");
const sadAudio = document.getElementById("sadAudio");

function stopAllMusic() {
    happyAudio.pause();
    sadAudio.pause();
    happyAudio.currentTime = 0;
    sadAudio.currentTime = 0;
}

// ===================== POPUP ELEMENTS =====================
const popup = document.getElementById("emotionPopup");
const popupText = document.getElementById("popupText");
const closePopup = document.getElementById("closePopup");

const popupActions = document.getElementById("popupActions");
const breathText = document.getElementById("breathText");

// ===================== MOOD HISTORY =====================
const moodHistory = document.getElementById("moodHistory");

// ===================== MOOD SUMMARY =====================
let moodCounts = { Happy: 0, Neutral: 0, Sad: 0 };

const happyCountEl = document.getElementById("happyCount");
const neutralCountEl = document.getElementById("neutralCount");
const sadCountEl = document.getElementById("sadCount");
const mostMoodEl = document.getElementById("mostMood");

// ===================== HISTORY ACTION BUTTONS =====================
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const downloadReportBtn = document.getElementById("downloadReportBtn");

// Close popup (X button)
closePopup.onclick = () => {
    popup.classList.add("hidden");
};

// ===================== POPUP MESSAGE =====================
function showPopup(emotion) {
    if (emotion === "Happy") {
        popupText.innerText = "You seem happy 😊 Keep enjoying the moment!";
    } else if (emotion === "Sad") {
        popupText.innerText = "You seem a bit low 😔 It's okay to pause and breathe.";
    } else {
        popupText.innerText = "Just checking in 😐 How are you feeling right now?";
    }

    popup.classList.remove("hidden");
}

// ===================== DYNAMIC ACTION BUTTONS =====================
function setActionsForEmotion(emotion) {
    popupActions.innerHTML = ""; // remove old buttons
    breathText.innerText = "";   // clear action text

    function addBtn(label, onClick) {
        const btn = document.createElement("button");
        btn.innerText = label;
        btn.onclick = onClick;
        popupActions.appendChild(btn);
    }

    // ✅ HAPPY BUTTONS
    if (emotion === "Happy") {
        addBtn("🎉 Celebrate", () => {
            breathText.innerText = "WIN MOOD 😎 Keep shining today ✨";
        });

        addBtn("📝 Gratitude", () => {
            breathText.innerText = "Write 1 thing you're grateful for today 💛";
        });

        addBtn("🎯 Challenge", () => {
            breathText.innerText = "Mini challenge: Make someone smile today 😄";
        });
    }

    // ✅ SAD BUTTONS
    else if (emotion === "Sad") {
        addBtn("🧘 30s Breathing", () => {
            let timeLeft = 30;
            breathText.innerText = "Breathe in... 🌬️";

            const breathingInterval = setInterval(() => {
                timeLeft--;

                if (timeLeft % 6 === 0) {
                    breathText.innerText = "Breathe in... 🌬️";
                } else if (timeLeft % 6 === 3) {
                    breathText.innerText = "Breathe out... 😮‍💨";
                }

                if (timeLeft <= 0) {
                    clearInterval(breathingInterval);
                    breathText.innerText = "✅ Done! You got this 🤝";
                }
            }, 1000);
        });

        addBtn("🎧 Calm Mode", () => {
            stopAllMusic();
            sadAudio.play();
            breathText.innerText = "🎧 Calm sound playing...";
        });

        addBtn("💬 Support Tip", () => {
            breathText.innerText = "Small step: Drink water + breathe slowly 🫶";
        });
    }

    // ✅ NEUTRAL BUTTONS
    else {
        addBtn("🎯 Focus 25s", () => {
            let t = 25;
            breathText.innerText = "🎯 Focus started: 25s";

            const timer = setInterval(() => {
                t--;
                breathText.innerText = "🎯 Focus: " + t + "s";

                if (t <= 0) {
                    clearInterval(timer);
                    breathText.innerText = "✅ Nice! Small focus win 🏆";
                }
            }, 1000);
        });

        addBtn("🚶 Quick Stretch", () => {
            breathText.innerText = "Stand up & stretch your shoulders for 10 sec 🙆";
        });

        addBtn("💡 Quick Tip", () => {
            const tips = [
                "💧 Drink water.",
                "👀 Look away from screen for 20 sec.",
                "🌿 Take 1 deep breath.",
                "🧠 Small steps = big progress."
            ];
            breathText.innerText = tips[Math.floor(Math.random() * tips.length)];
        });
    }

    // ✅ CLOSE BUTTON ALWAYS
    addBtn("✅ Close", () => {
        popup.classList.add("hidden");
    });
}

// ===================== HISTORY + SUMMARY UPDATE =====================
function addMoodToHistory(emotion) {
    if (!moodHistory) return;

    const now = new Date();
    const time = now.toLocaleTimeString();

    const li = document.createElement("li");
    li.innerText = `${time} - ${emotion}`;
    moodHistory.prepend(li);

    // keep only last 10
    if (moodHistory.children.length > 10) {
        moodHistory.removeChild(moodHistory.lastChild);
    }

    // ✅ Update summary counters
    moodCounts[emotion]++;

    if (happyCountEl) happyCountEl.innerText = moodCounts.Happy;
    if (neutralCountEl) neutralCountEl.innerText = moodCounts.Neutral;
    if (sadCountEl) sadCountEl.innerText = moodCounts.Sad;

    // ✅ Find most frequent mood
    let most = "Neutral 😐";

    if (moodCounts.Happy >= moodCounts.Neutral && moodCounts.Happy >= moodCounts.Sad) {
        most = "Happy 😊";
    } else if (moodCounts.Sad >= moodCounts.Happy && moodCounts.Sad >= moodCounts.Neutral) {
        most = "Sad 😔";
    } else {
        most = "Neutral 😐";
    }

    if (mostMoodEl) mostMoodEl.innerText = most;
}

// ===================== CLEAR HISTORY =====================
function clearHistory() {
    if (!moodHistory) return;

    // clear list
    moodHistory.innerHTML = "";

    // reset counts
    moodCounts = { Happy: 0, Neutral: 0, Sad: 0 };

    if (happyCountEl) happyCountEl.innerText = "0";
    if (neutralCountEl) neutralCountEl.innerText = "0";
    if (sadCountEl) sadCountEl.innerText = "0";
    if (mostMoodEl) mostMoodEl.innerText = "Neutral 😐";
}

// ===================== DOWNLOAD REPORT =====================
function downloadReport() {
    const now = new Date();
    const reportTime = now.toLocaleString();

    let report = "VibeSense AI - Mood Report\n";
    report += "Generated on: " + reportTime + "\n\n";

    report += "Mood Summary:\n";
    report += "Happy: " + moodCounts.Happy + "\n";
    report += "Neutral: " + moodCounts.Neutral + "\n";
    report += "Sad: " + moodCounts.Sad + "\n\n";

    report += "Mood History:\n";

    const items = moodHistory.querySelectorAll("li");
    if (items.length === 0) {
        report += "No mood history found.\n";
    } else {
        items.forEach(li => {
            report += li.innerText + "\n";
        });
    }

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "VibeSense_Mood_Report.txt";
    a.click();

    URL.revokeObjectURL(url);
}

// Button events
if (clearHistoryBtn) clearHistoryBtn.onclick = clearHistory;
if (downloadReportBtn) downloadReportBtn.onclick = downloadReport;

// ===================== MAIN UPDATE LOOP =====================
function updateEmotion() {
    fetch("/emotion")
        .then(response => response.json())
        .then(data => {
            const emotionRaw = data.emotion;

            const body = document.getElementById("pageBody");
            const emotionLabel = document.getElementById("emotionText");

            // Update emotion text immediately
            emotionLabel.innerText = "Emotion: " + emotionRaw;

            // Convert backend emotion to category
            let newEmotion = "Neutral";
            if (emotionRaw.includes("Happy")) {
                newEmotion = "Happy";
            } else if (emotionRaw.includes("Sad")) {
                newEmotion = "Sad";
            } else {
                newEmotion = "Neutral";
            }

            // ---------- DEBOUNCE ----------
            if (newEmotion === pendingEmotion) {
                stableCount++;
            } else {
                pendingEmotion = newEmotion;
                stableCount = 1;
            }

            // ---------- APPLY WHEN STABLE ----------
            if (stableCount >= STABLE_THRESHOLD && newEmotion !== currentEmotion) {

                // Background theme update
                body.classList.remove("happy", "neutral", "sad");
                body.classList.add(newEmotion.toLowerCase());

                // Music update
                stopAllMusic();
                if (newEmotion === "Happy") {
                    happyAudio.play();
                } else if (newEmotion === "Sad") {
                    sadAudio.play();
                }

                // Popup + Dynamic buttons
                showPopup(newEmotion);
                setActionsForEmotion(newEmotion);

                // Mood History + Summary
                addMoodToHistory(newEmotion);

                // Save state
                currentEmotion = newEmotion;
                spawnEmoji(newEmotion);
            }
        })
        .catch(err => console.error("Emotion fetch error:", err));
}

// Poll backend every 600ms
setInterval(updateEmotion, 600);
// ================= EMOJI EFFECT =================

function spawnEmoji(emotion){

    const container = document.getElementById("emojiContainer");
    if(!container) return;

    let emoji = "😐";
    let count = 15;   // 🔥 MORE EMOJIS

    if(emotion === "Happy") emoji = "🥳";
    if(emotion === "Sad") emoji = "😫";

    for(let i = 0; i < count; i++){

        const span = document.createElement("span");
        span.classList.add("floating-emoji");
        span.innerText = emoji;

        span.style.left = Math.random() * 100 + "vw";
        span.style.fontSize = (24 + Math.random()*26) + "px";
        span.style.animationDuration = (5 + Math.random()*3) + "s";

        container.appendChild(span);

        setTimeout(() => {
            span.remove();
        }, 8000);
    }
}
// ================= SHUTTER EFFECT =================

const shutter = document.getElementById("shutterOverlay");

if(shutter){
    shutter.addEventListener("click", () => {
        shutter.classList.add("open");

        setTimeout(() => {
            shutter.style.display = "none";
        }, 800);
    });

}