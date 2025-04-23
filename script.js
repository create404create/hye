function checkStatus() {
  const phone = document.getElementById("phoneNumber").value.trim();
  if (!phone) {
    alert("Please enter a phone number");
    return;
  }

  const tcpaApi = `https://api.uspeoplesearch.net/tcpa/v1?x=${phone}`;
  const personApi = `https://api.uspeoplesearch.net/person/v3?x=${phone}`;

  document.getElementById("result").innerHTML = "Fetching data...";

  Promise.allSettled([
    fetch(tcpaApi).then(res => res.json()),
    fetch(personApi).then(res => res.json())
  ])
  .then(([tcpaResult, personResult]) => {
    let resultHTML = "";

    if (tcpaResult.status === "fulfilled") {
      const tcpaData = tcpaResult.value;
      resultHTML += `
📱 Phone: ${tcpaData.phone || phone}
✅ Status: ${tcpaData.status}
⚠️ Blacklist: ${tcpaData.listed}
👨‍⚖️ Litigator: ${tcpaData.type}
📍 State: ${tcpaData.state}
🛑 DNC National: ${tcpaData.ndnc}
🛑 DNC State: ${tcpaData.sdnc}
      `;
    }

    if (personResult.status === "fulfilled") {
      const personData = personResult.value;
      if (personData.status === "ok" && personData.count > 0) {
        const person = personData.person[0];
        const address = person.addresses && person.addresses.length > 0 ? person.addresses[0] : {};
        resultHTML += `

👤 Owner: ${person.name}
🎂 DOB: ${person.dob} (Age: ${person.age})
🏡 Address: ${address.home || ""}, ${address.city || ""}, ${address.state || ""} ${address.zip || ""}
        `;
      } else {
        resultHTML += `\n🔍 Owner info not available.`;
      }
    }

    if (!resultHTML) {
      resultHTML = "<p style='color:red;'>Error: No data returned from either API.</p>";
    }

    document.getElementById("result").innerHTML = resultHTML.trim();
  })
  .catch(error => {
    console.error("API Error:", error);
    document.getElementById("result").innerHTML = "<p style='color:red;'>Error fetching data</p>";
  });
}

function copyResult() {
  const text = document.getElementById("result").innerText;
  const popup = document.getElementById("copy-popup");
  if (!text) return alert("No result to copy!");
  navigator.clipboard.writeText(text)
    .then(() => {
      popup.style.display = 'block';
      setTimeout(() => {
        popup.style.display = 'none';
      }, 3000);
    })
    .catch(() => alert("Failed to copy result."));
}

document.getElementById("phoneNumber").addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    checkStatus();
  }
});

// Chat Widget Functionality
function toggleChat() {
  const body = document.getElementById("chat-body");
  body.style.display = body.style.display === "none" ? "flex" : "none";
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;

  const messagesContainer = document.getElementById("chat-messages");
  messagesContainer.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
  input.value = "";

  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const res = await fetch("https://gpt-3-5.apis-bj-devs.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: message }] })
    });

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "❌ Error fetching reply";

    messagesContainer.innerHTML += `<div><strong>GPT:</strong> ${reply}</div>`;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    messagesContainer.innerHTML += `<div><strong>GPT:</strong> ❌ Failed to get response</div>`;
  }
}
