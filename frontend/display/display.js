const socket = io("http://localhost:4000");
const displayCounters = document.getElementById("displayCounters");

// Insert queue display after header
let queueDiv = document.getElementById("displayQueue");
if (!queueDiv) {
  queueDiv = document.createElement("div");
  queueDiv.id = "displayQueue";
  queueDiv.style.margin = "2rem auto 2rem auto";
  queueDiv.style.maxWidth = "900px";
  const header = document.querySelector("header");
  if (header) header.after(queueDiv);
}

// Track last announced students per counter
let lastAnnounced = {};
let announceTimeouts = {};

// --- Voice selection logic ---
let selectedVoice = null;

function setBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  // Prefer Google US English
  selectedVoice = voices.find(v => v.name === "Google US English");
  // Fallback to Microsoft Zira
  if (!selectedVoice) selectedVoice = voices.find(v => v.name.includes("Zira"));
  // Fallback to any en-US voice
  if (!selectedVoice) selectedVoice = voices.find(v => v.lang === "en-US");
  // Fallback to first available
  if (!selectedVoice) selectedVoice = voices[0];
}

if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = setBestVoice;
} else {
  setBestVoice();
}
// --- End voice selection logic ---

function announceStudent(counterId, studentName, regNo) {
  if (!studentName || !regNo) return;
  const message = `${studentName}, Registration Number ${regNo}, please proceed to Counter ${counterId}`;
  // Cancel any previous timeouts for this counter
  if (announceTimeouts[counterId]) {
    clearTimeout(announceTimeouts[counterId]);
    announceTimeouts[counterId] = null;
  }

  const audio = document.getElementById('attention-audio');

  // Helper to play attention sound and return a Promise that resolves when done
  function playAttention() {
    return new Promise(resolve => {
      if (audio) {
        audio.currentTime = 0;
        audio.play();
        let done = false;
        const onAudioEnded = () => {
          if (done) return;
          done = true;
          audio.removeEventListener('ended', onAudioEnded);
          resolve();
        };
        audio.addEventListener('ended', onAudioEnded);
        setTimeout(() => {
          if (!done) onAudioEnded();
        }, 3000);
      } else {
        resolve();
      }
    });
  }

  // Helper to speak and return a Promise that resolves when done
  function speak() {
    return new Promise(resolve => {
      const utter = new window.SpeechSynthesisUtterance(message);
      if (selectedVoice) utter.voice = selectedVoice;
      utter.onend = resolve;
      window.speechSynthesis.speak(utter);
    });
  }

  // Sequence: sound -> speech -> [delay] -> sound -> speech
  (async () => {
    await playAttention();
    await speak();
    await new Promise(res => setTimeout(res, 7000)); 
    await playAttention();
    await speak();
  })();
}

function renderCountersAndQueue(counters, queue) {
  // Show only the first 4 students in the queue
  const nextUp = queue.slice(0, 4);
  let queueHtml = '<h2 style="color:#4f8cff;text-align:center;"><i class="fa-solid fa-list-ol"></i> Queue</h2>';
  if (nextUp.length === 0) {
    queueHtml += '<div style="color:#aaa;text-align:center;">No students in queue</div>';
  } else {
    queueHtml += '<ul style="display:flex;gap:2.5rem;list-style:none;padding:0;margin:0;justify-content:center;">';
    nextUp.forEach(student => {
      queueHtml += `<li style="background:#232526;padding:0.7rem 1.2rem;border-radius:8px;font-size:1.08rem;display:flex;align-items:center;gap:0.7rem;box-shadow:0 1px 4px rgba(44,62,80,0.04);color:#fff;min-width:220px;">
        <i class='fa-solid fa-user'></i> <b>${student.Name}</b> (${student.RegNo}) - Next in line
      </li>`;
    });
    queueHtml += '</ul>';
  }
  queueDiv.innerHTML = queueHtml;

  // Remove marquee style if present
  const styleId = "queue-marquee-style";
  const oldStyle = document.getElementById(styleId);
  if (oldStyle) oldStyle.remove();

  // Render counters in rows of 3
  displayCounters.innerHTML = "";
  const countersPerRow = 3;
  for (let i = 0; i < counters.length; i += countersPerRow) {
    const rowDiv = document.createElement("div");
    rowDiv.style.display = "flex";
    rowDiv.style.gap = "2rem";
    rowDiv.style.justifyContent = "center";
    rowDiv.style.marginBottom = "2rem";
    const rowCounters = counters.slice(i, i + countersPerRow);
    rowCounters.forEach((counter) => {
      const div = document.createElement("div");
      div.className = `display-counter ${counter.status}`;
      div.style.flex = "1 1 0";
      let content = `
        <div class="icon">
          <i class="fa-solid fa-${counter.status === "available" ? "circle-check" : "circle-dot"}"></i>
        </div>
        <div class="status ${counter.status}">
          Counter ${counter.id} - ${counter.status.charAt(0).toUpperCase() + counter.status.slice(1)}
        </div>
      `;
      if (counter.status === "busy" && counter.student) {
        content += `<div class="student">
          <i class='fa-solid fa-user-graduate'></i> <b>${counter.student.Name}</b> (${counter.student.RegNo})
        </div>`;
        // Announce if new student assigned
        if (
          !lastAnnounced[counter.id] ||
          lastAnnounced[counter.id] !== `${counter.student.Name}|${counter.student.RegNo}`
        ) {
          announceStudent(counter.id, counter.student.Name, counter.student.RegNo);
          lastAnnounced[counter.id] = `${counter.student.Name}|${counter.student.RegNo}`;
        }
      } else if (counter.status === "available" && counter.nextStudent) {
        content += `<div class="student" style="color:#4f8cff; font-weight:600;">
          Available for: <b>${counter.nextStudent.Name}</b> (${counter.nextStudent.RegNo})
        </div>`;
        // Reset lastAnnounced for this counter so next assignment will trigger
        lastAnnounced[counter.id] = null;
      } else {
        content += `<div class="student" style="color:#aaa">No student assigned</div>`;
        lastAnnounced[counter.id] = null;
      }
      div.innerHTML = content;
      rowDiv.appendChild(div);
    });
    displayCounters.appendChild(rowDiv);
  }
}

// Real-time updates
socket.on("update", ({ counters, queue }) => {
  renderCountersAndQueue(counters, queue);
});

// Initial fetch (in case socket event is missed)
Promise.all([
  fetch("http://localhost:4000/api/counters").then(r => r.json()),
  fetch("http://localhost:4000/api/queue").then(r => r.json())
]).then(([counters, queue]) => renderCountersAndQueue(counters, queue)); 