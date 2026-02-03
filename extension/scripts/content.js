let intervalId;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "startScrolling") {
    clearInterval(intervalId);
    const { scrollPixels, scrollSeconds } = message;

    function autoScroll() {
      const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const bottomOffset = pageHeight - windowHeight - scrollY;

      if (bottomOffset > 0) {
        window.scrollTo({
          top: scrollY + parseInt(scrollPixels),
          behavior: "smooth",
        });
      } else {
        // Send message to background script to stop scrolling and remove badge
        chrome.runtime.sendMessage({ action: "stopScrollingAndRemoveBadge" });
        clearInterval(intervalId);
      }
    }

    intervalId = setInterval(autoScroll, scrollSeconds * 1000);
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
