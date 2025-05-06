const { clipboard, nativeImage } = window.electronAPI;

function checkClipboard() {
  const text = clipboard.readText();
  const image = clipboard.readImage();
  const history = JSON.parse(localStorage.getItem("clipboardHistory") || "[]");

  const alreadyExists = (newItem) =>
    history.some(item => item.type === newItem.type && item.content === newItem.content);

  if (text && !alreadyExists({ type: "text", content: text })) {
    history.push({
      type: "text",
      content: text,
      timestamp: new Date().toISOString()
    });
  }

  if (!image.isEmpty()) {
    const dataUrl = image.toDataURL();
    if (!alreadyExists({ type: "image", content: dataUrl })) {
      history.push({
        type: "image",
        content: dataUrl,
        timestamp: new Date().toISOString()
      });
    }
  }

  localStorage.setItem("clipboardHistory", JSON.stringify(history));
}

setInterval(checkClipboard, 2000);
