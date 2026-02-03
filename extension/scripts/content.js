let intervalId;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "startScrolling") {
    clearInterval(intervalId);
    const { scrollPixels, scrollSeconds } = message;
    const safePixels = Math.max(1, parseInt(scrollPixels, 10) || 100);
    const safeSeconds = Math.max(0.1, parseFloat(scrollSeconds) || 1);

    function autoScroll() {
      const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const bottomOffset = pageHeight - windowHeight - scrollY;

      if (bottomOffset > 0) {
        window.scrollTo({
          top: scrollY + safePixels,
          behavior: "smooth",
        });
      } else {
        // Send message to background script to stop scrolling and remove badge
        chrome.runtime.sendMessage({ action: "stopScrollingAndRemoveBadge" });
        clearInterval(intervalId);
      }
    }

    intervalId = setInterval(autoScroll, safeSeconds * 1000);
  } else if (message.action === "stopScrolling") {
    clearInterval(intervalId);
  } else if (message.action === "scrollToTop") {
    clearInterval(intervalId);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
});
