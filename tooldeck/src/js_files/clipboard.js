const output = document.getElementById("clipboardOutput");
let allSelected = false;

function loadClipboardHistory() {
  const history = JSON.parse(localStorage.getItem("clipboardHistory") || "[]");
  output.innerHTML = "";

  if (history.length === 0) {
    output.textContent = "Clipboard history is empty.";
    return;
  }

  history.slice().reverse().forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "clipboardItem";

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "clipboardCheckbox";
    checkbox.dataset.index = history.length - 1 - index; // Store original index

    // Content display
    const contentDiv = document.createElement("div");
    contentDiv.className = "clipboardContent";

    if (item.type === "text") {
      contentDiv.textContent = item.content;
    } else if (item.type === "image") {
      const img = new Image();
      img.src = item.content;
      img.alt = "Clipboard Image";
      img.style.maxWidth = "300px";
      contentDiv.appendChild(img);
    }

    // Buttons container
    const btnContainer = document.createElement("div");
    btnContainer.className = "clipboardButtonsPosition";

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    copyBtn.className = "clipboardActionButtons";
    copyBtn.onclick = () => {
      if (item.type === "text") {
        navigator.clipboard.writeText(item.content);
      } else if (item.type === "image") {
        const img = new Image();
        img.src = item.content;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => {
            navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob })
            ]);
          });
        };
      }
    };

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "clipboardActionButtons";
    deleteBtn.onclick = () => {
      history.splice(history.length - 1 - index, 1);
      localStorage.setItem("clipboardHistory", JSON.stringify(history));
      loadClipboardHistory(); // Reload view
    };

    btnContainer.appendChild(copyBtn);
    btnContainer.appendChild(deleteBtn);

    // Assemble
    wrapper.appendChild(checkbox);
    wrapper.appendChild(contentDiv);
    wrapper.appendChild(btnContainer);

    output.appendChild(wrapper);
  });
}

document.addEventListener("DOMContentLoaded", loadClipboardHistory);

document.getElementById("deleteSelectedBtn").addEventListener("click", () => {
  const checkboxes = document.querySelectorAll(".clipboardCheckbox:checked");
  if (checkboxes.length === 0) {
    alert("Please select at least one item to delete.");
    return;
  }

  const history = JSON.parse(localStorage.getItem("clipboardHistory") || "[]");

  // Get indexes to delete
  const indexesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
  
  // Filter out selected items
  const updatedHistory = history.filter((_, i) => !indexesToDelete.includes(i));

  localStorage.setItem("clipboardHistory", JSON.stringify(updatedHistory));
  loadClipboardHistory();
});

document.getElementById("clearAllBtn").addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to clear all clipboard items?");
  if (confirmed) {
    localStorage.removeItem("clipboardHistory");
    loadClipboardHistory();
  }
});

document.getElementById("toggleSelectAllBtn").addEventListener("click", () => {
  const checkboxes = document.querySelectorAll(".clipboardCheckbox");
  checkboxes.forEach(cb => cb.checked = !allSelected);
  allSelected = !allSelected;
  document.getElementById("toggleSelectAllBtn").textContent = allSelected ? "Deselect All" : "Select All";
});


document.getElementById("searchClipboard").addEventListener("input", (e) => {
  loadClipboardHistory(e.target.value);
});
