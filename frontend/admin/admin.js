const socket = io("http://localhost:4000");

const queueList = document.getElementById("queueList");
const countersDiv = document.getElementById("counters");

function renderQueue(queue) {
  queueList.innerHTML = "";
  queue.forEach((student, i) => {
    const roomInfo = student.RoomNo ? `Room No: ${student.RoomNo}` : "To be allotted";
    const li = document.createElement("li");
    li.innerHTML = `<i class='fa-solid fa-user'></i> <b>${student.Name}</b> (${student.RegNo}) - ${roomInfo}`;
    queueList.appendChild(li);
  });
}

function renderCounters(counters) {
  countersDiv.innerHTML = "";
  counters.forEach((counter) => {
    const div = document.createElement("div");
    div.className = `counter ${counter.status}`;
    div.innerHTML = `
      <div class="status ${counter.status}">
        <i class="fa-solid fa-${counter.status === "available" ? "circle-check" : "circle-dot"}"></i>
        Counter ${counter.id} - ${counter.status.charAt(0).toUpperCase() + counter.status.slice(1)}
      </div>
      <div class="student">
        ${counter.student ? `<i class='fa-solid fa-user-graduate'></i> <b>${counter.student.Name}</b> (${counter.student.RegNo})` : "<span style='color:#aaa'>No student assigned</span>"}
      </div>
      <div style="display:flex;gap:0.5rem;justify-content:center;">
        <button ${counter.status === "available" ? "disabled" : ""} data-id="${counter.id}" class="done-btn">
          <i class="fa-solid fa-check"></i> Done
        </button>
        <button ${counter.status === "available" ? "disabled" : ""} data-id="${counter.id}" class="skip-btn" style="background:#f39c12;color:#fff;">
          <i class="fa-solid fa-forward"></i> Skip
        </button>
      </div>
    `;
    div.querySelector(".done-btn").addEventListener("click", async () => {
      await fetch("http://localhost:4000/api/done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterId: counter.id })
      });
    });
    div.querySelector(".skip-btn").addEventListener("click", async () => {
      await fetch("http://localhost:4000/api/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterId: counter.id })
      });
    });
    countersDiv.appendChild(div);
  });
}

document.getElementById("setCountersBtn").addEventListener("click", async () => {
  const count = parseInt(document.getElementById("counterCount").value, 10);
  await fetch("http://localhost:4000/api/set-counters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count })
  });
});

// Real-time updates
socket.on("update", ({ queue, counters }) => {
  renderQueue(queue);
  renderCounters(counters);
});

// Initial fetch (in case socket event is missed)
fetch("http://localhost:4000/api/queue").then(r => r.json()).then(renderQueue);
fetch("http://localhost:4000/api/counters").then(r => r.json()).then(renderCounters); 