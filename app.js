document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("eventForm");
  const steps = document.querySelectorAll(".step-panel");
  const stepIcons = document.querySelectorAll(".steps .step");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");
  const previewArea = document.getElementById("previewArea");
  const savedEventsDiv = document.getElementById("savedEvents");
  const progress = document.getElementById("progress");

  let currentStep = 0;

  // ================= MODE & ONLINE LINK =================
  const modeSelect = document.getElementById("modeOfEvent");
  const onlineLinkRow = document.getElementById("onlineLinkRow");
  const onlineLinkInput = document.getElementById("onlineLink");

  modeSelect.addEventListener("change", () => {
    const isOnline = modeSelect.value === "Online";
    onlineLinkRow.style.display = isOnline ? "flex" : "none";
    onlineLinkInput.required = isOnline;
    if (!isOnline) onlineLinkInput.value = "";
  });

  // ================= VALIDATION =================
  function isEventDetailsValid() {
    const requiredFields = steps[0].querySelectorAll("[required]");
    for (let field of requiredFields) {
      if (!field.value.trim()) {
        field.focus();
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  // ================= STEP NAVIGATION =================
  function showStep(step) {
    steps.forEach((panel, i) => (panel.style.display = i === step ? "block" : "none"));

    stepIcons.forEach((icon, i) => {
      icon.classList.toggle("active", i === step);
      icon.classList.toggle("completed", i < step);
    });

    progress.style.width = ((step + 1) / steps.length) * 100 + "%";
    prevBtn.style.display = step === 0 ? "none" : "inline-block";
    nextBtn.style.display = step === steps.length - 1 ? "none" : "inline-block";
    submitBtn.style.display = step === steps.length - 1 ? "inline-block" : "none";

    if (step === steps.length - 1) generatePreview();
  }

  nextBtn.onclick = () => {
    if (currentStep === 0 && !isEventDetailsValid()) return alert("Complete Event Details");
    currentStep++;
    showStep(currentStep);
  };

  prevBtn.onclick = () => {
    currentStep--;
    showStep(currentStep);
  };

  stepIcons.forEach(icon => {
    icon.addEventListener("click", () => {
      const target = parseInt(icon.dataset.step);
      if (target > 0 && !isEventDetailsValid()) {
        alert("Please complete Event Details first.");
        return;
      }
      currentStep = target;
      showStep(currentStep);
    });
  });

  // ================= PREVIEW =================
  function generatePreview() {
    const data = new FormData(form);
    let html = "<table class='preview-table'>";

    data.forEach((value, key) => {
      let display = "-";

      if (value instanceof File && value.name) {
        const fileURL = URL.createObjectURL(value);
        display = `<a href="${fileURL}" download="${value.name}">Download ${value.name}</a>`;
      } else if (value) {
        display = value;
      }

      html += `
        <tr>
          <td><strong>${key.replace(/([A-Z])/g, " $1").toUpperCase()}</strong></td>
          <td>${display}</td>
        </tr>`;
    });

    html += "</table>";
    previewArea.innerHTML = html;
  }

  // ================= PDF =================
  document.getElementById("downloadPdf").onclick = () => {
    const rows = Array.from(previewArea.querySelectorAll("tr")).map(row => ({
      label: row.children[0].innerText,
      value: row.children[1].innerText
    }));
    generateTablePDF("EVENT PREVIEW REPORT", rows);
  };

  function generateTablePDF(title, rows) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 105, 15, { align: "center" });
    doc.line(15, 22, 195, 22);

    let y = 30;
    const labelW = 65, valueW = 115, rowH = 8;

    rows.forEach(row => {
      if (y > 270) { doc.addPage(); y = 25; }

      doc.setFont("helvetica", "bold");
      doc.rect(15, y - rowH + 2, labelW, rowH);
      doc.text(row.label, 17, y);

      doc.setFont("helvetica", "normal");
      doc.rect(15 + labelW, y - rowH + 2, valueW, rowH);
      doc.text(row.value.toString(), 17 + labelW, y, { maxWidth: valueW - 4 });

      y += rowH;
    });

    doc.setFontSize(9);
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Event Portal`,
      105, 290, { align: "center" });

    doc.save(`${title.replace(/ /g, "_")}.pdf`);
  }

  showStep(0);
  renderSavedEvents();

  // ================= FUNDING =================
  const fundingSection = document.getElementById("fundingSection");
  const financialRadios = document.querySelectorAll("input[name='financialSupport']");
  const addFundingBtn = document.getElementById("addFunding");

  function toggleFunding() {
    const selected = document.querySelector("input[name='financialSupport']:checked")?.value;
    if (selected === "yes") {
      fundingSection.style.display = "flex";
      fundingSection.querySelectorAll("input").forEach(input => input.required = true);
    } else {
      fundingSection.style.display = "none";
      fundingSection.querySelectorAll("input").forEach(input => { input.required = false; input.value = ""; });
    }
  }

  financialRadios.forEach(radio => radio.addEventListener("change", toggleFunding));
  toggleFunding();

  addFundingBtn.onclick = () => {
    const newRow = fundingSection.cloneNode(true);
    newRow.querySelectorAll("input").forEach(input => input.value = "");
    fundingSection.parentNode.insertBefore(newRow, addFundingBtn.parentNode.nextSibling);
  };

  // ================= SAVE EVENTS =================
  form.onsubmit = e => {
    e.preventDefault();
    const eventObj = {};
    new FormData(form).forEach((v, k) => { eventObj[k] = v instanceof File ? v.name : v; });

    const events = JSON.parse(localStorage.getItem("events") || "[]");
    events.push(eventObj);
    localStorage.setItem("events", JSON.stringify(events));

    alert("Event saved successfully");
    form.reset();
    currentStep = 0;
    showStep(0);
    renderSavedEvents();
  };

  function renderSavedEvents() {
    const events = JSON.parse(localStorage.getItem("events") || "[]");
    savedEventsDiv.innerHTML = "";

    if (!events.length) {
      savedEventsDiv.innerText = "No events saved.";
      return;
    }

    events.forEach((ev, i) => {
      const div = document.createElement("div");
      div.className = "saved-event";
      div.innerHTML = `
        <strong>${ev.title || "Untitled Event"}</strong><br>
        <small>${ev.startDate || ""} - ${ev.endDate || ""}</small><br>
        <small>Coordinator: ${ev.coordinator || "N/A"}</small>
        <div style="margin-top:8px">
          <button class="btn blue small" onclick="downloadSavedPDF(${i})">PDF</button>
          <button class="btn red small" onclick="deleteEvent(${i})">Delete</button>
        </div>`;
      savedEventsDiv.appendChild(div);
    });
  }

  window.deleteEvent = index => {
    const events = JSON.parse(localStorage.getItem("events") || "[]");
    events.splice(index, 1);
    localStorage.setItem("events", JSON.stringify(events));
    renderSavedEvents();
  };

  window.downloadSavedPDF = index => {
    const events = JSON.parse(localStorage.getItem("events") || "[]");
    const rows = Object.entries(events[index]).map(([k, v]) => ({ label: k.replace(/([A-Z])/g, " ").toUpperCase(), value: v || "-" }));
    generateTablePDF("EVENT REPORT", rows);
  };
});
