chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "stopScrollingAndRemoveBadge") {
    setBadgeText(false);
  }
});

chrome.commands.onCommand.addListener(function (command) {
  if (command === "toggle-scroll") {
    toggleScroll();
  } else if (command === "toggle-scroll-to-top") {
    scrollToTop();
  }
});

function toggleScroll() {
  chrome.storage.local.get(["scrollPixels", "scrollSeconds", "scrolling"], function (data) {
    const { scrollPixels, scrollSeconds, scrolling } = data;
    if (scrollPixels && scrollSeconds) {
      if (scrolling === "0") {
        startScrolling(scrollPixels, scrollSeconds);
      } else {
        stopScrolling(scrollPixels, scrollSeconds);
      }
    }
  });
}

function scrollToTop() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "scrollToTop" });
  });
}

function setBadgeText(isScrolling) {
  const text = isScrolling ? "ON" : "";
  chrome.action.setBadgeText({ text });
}

function startScrolling(scrollPixels, scrollSeconds) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.storage.local.set({ scrolling: "1", scrollPixels, scrollSeconds }, function () {
      console.log("Settings saved");
    });

    chrome.tabs.sendMessage(tabs[0].id, { action: "startScrolling", scrollPixels, scrollSeconds });
    setBadgeText(true);
  });
}

function stopScrolling(scrollPixels, scrollSeconds) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.storage.local.set({ scrolling: "0", scrollPixels, scrollSeconds }, function () {
      console.log("Settings saved");
    });

    chrome.tabs.sendMessage(tabs[0].id, { action: "stopScrolling", scrollPixels, scrollSeconds });
    setBadgeText(false);
  });
}
