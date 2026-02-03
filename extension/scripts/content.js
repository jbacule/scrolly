let rafId = null;
let isScrolling = false;
let speedPxPerSec = 0;
let lastTimestamp = null;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "startScrolling") {
    const { scrollPixels, scrollSeconds } = message;
    const safePixels = Math.max(1, parseInt(scrollPixels, 10) || 100);
    const safeSeconds = Math.max(0.1, parseFloat(scrollSeconds) || 1);
    speedPxPerSec = safePixels / safeSeconds;

    stopScrollingLocal();
    isScrolling = true;
    lastTimestamp = null;
    rafId = requestAnimationFrame(autoScrollFrame);
  } else if (message.action === "stopScrolling") {
    stopScrollingLocal();
  } else if (message.action === "scrollToTop") {
    stopScrollingLocal();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
});

function stopScrollingLocal() {
  isScrolling = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTimestamp = null;
}

function autoScrollFrame(timestamp) {
  if (!isScrolling) return;

  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  const deltaSeconds = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  const distance = speedPxPerSec * deltaSeconds;

  const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  const windowHeight = window.innerHeight;
  const maxScrollTop = Math.max(0, pageHeight - windowHeight);
  const scrollY = window.scrollY;

  if (scrollY >= maxScrollTop - 1) {
    chrome.runtime.sendMessage({ action: "stopScrollingAndRemoveBadge" });
    stopScrollingLocal();
    return;
  }

  const nextScrollTop = Math.min(maxScrollTop, scrollY + distance);
  window.scrollTo({ top: nextScrollTop });
  rafId = requestAnimationFrame(autoScrollFrame);
}
