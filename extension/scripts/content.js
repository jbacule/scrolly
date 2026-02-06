let rafId = null;
let isScrolling = false;
let speedPxPerSec = 0;
let lastTimestamp = null;
let scrollDirection = "bottom";

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "startScrolling") {
    const { scrollPixels, scrollSeconds, scrollDirection: direction } = message;
    const safePixels = Math.max(1, parseInt(scrollPixels, 10) || 100);
    const safeSeconds = Math.max(0.1, parseFloat(scrollSeconds) || 1);
    speedPxPerSec = safePixels / safeSeconds;
    scrollDirection = direction || "bottom";

    stopScrollingLocal();
    isScrolling = true;
    lastTimestamp = null;

    chrome.storage.local.set({ returnPosition: { x: window.scrollX, y: window.scrollY } });

    if (!canScrollInDirection(scrollDirection)) {
      chrome.runtime.sendMessage({ action: "stopScrollingAndRemoveBadge" });
      stopScrollingLocal();
      return;
    }

    rafId = requestAnimationFrame(autoScrollFrame);
  } else if (message.action === "stopScrolling") {
    stopScrollingLocal();
  } else if (message.action === "returnToStart") {
    stopScrollingLocal();
    const returnPosition = message.returnPosition;
    if (returnPosition && typeof returnPosition.x === "number" && typeof returnPosition.y === "number") {
      scrollToPosition(returnPosition);
      return;
    }
    chrome.storage.local.get(["returnPosition"], function (data) {
      scrollToPosition(data.returnPosition || { x: 0, y: 0 });
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

  const bounds = getScrollBounds();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  if (isAtScrollEdge(scrollDirection, bounds, scrollX, scrollY)) {
    chrome.runtime.sendMessage({ action: "stopScrollingAndRemoveBadge" });
    stopScrollingLocal();
    return;
  }

  const nextPosition = getNextPosition(scrollDirection, bounds, scrollX, scrollY, distance);
  window.scrollTo(nextPosition);
  rafId = requestAnimationFrame(autoScrollFrame);
}

function getScrollBounds() {
  const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  const pageWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const maxScrollTop = Math.max(0, pageHeight - windowHeight);
  const maxScrollLeft = Math.max(0, pageWidth - windowWidth);
  return { maxScrollTop, maxScrollLeft };
}

function canScrollInDirection(direction) {
  const bounds = getScrollBounds();
  if (direction === "left" || direction === "right") {
    return bounds.maxScrollLeft > 0;
  }
  return bounds.maxScrollTop > 0;
}

function isAtScrollEdge(direction, bounds, scrollX, scrollY) {
  if (direction === "top") {
    return scrollY <= 0;
  }
  if (direction === "bottom") {
    return scrollY >= bounds.maxScrollTop - 1;
  }
  if (direction === "left") {
    return scrollX <= 0;
  }
  return scrollX >= bounds.maxScrollLeft - 1;
}

function getNextPosition(direction, bounds, scrollX, scrollY, distance) {
  if (direction === "top") {
    return { top: Math.max(0, scrollY - distance), left: scrollX };
  }
  if (direction === "bottom") {
    return { top: Math.min(bounds.maxScrollTop, scrollY + distance), left: scrollX };
  }
  if (direction === "left") {
    return { top: scrollY, left: Math.max(0, scrollX - distance) };
  }
  return { top: scrollY, left: Math.min(bounds.maxScrollLeft, scrollX + distance) };
}

function scrollToPosition(position) {
  const safeX = typeof position.x === "number" ? position.x : 0;
  const safeY = typeof position.y === "number" ? position.y : 0;
  window.scrollTo({
    top: safeY,
    left: safeX,
    behavior: "smooth",
  });
}
