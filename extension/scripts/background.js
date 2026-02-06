chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "stopScrollingAndRemoveBadge") {
    setBadgeText(false);
  }
});

chrome.commands.onCommand.addListener(function (command) {
  if (command === "toggle-scroll") {
    toggleScroll();
  } else if (command === "toggle-scroll-to-top") {
    returnToStart();
  }
});

function toggleScroll() {
  chrome.storage.local.get(["scrollPixels", "scrollSeconds", "scrolling", "scrollDirection"], function (data) {
    const { scrollPixels, scrollSeconds, scrolling, scrollDirection } = data;
    if (scrollPixels && scrollSeconds) {
      if (scrolling === "0") {
        startScrolling(scrollPixels, scrollSeconds, scrollDirection);
      } else {
        stopScrolling(scrollPixels, scrollSeconds);
      }
    }
  });
}

function returnToStart() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.storage.local.get(["returnPosition"], function (data) {
      const returnPosition = data.returnPosition || { x: 0, y: 0 };
      chrome.tabs.sendMessage(tabs[0].id, { action: "returnToStart", returnPosition });
    });
  });
}

function setBadgeText(isScrolling) {
  const text = isScrolling ? "ON" : "";
  chrome.action.setBadgeText({ text });
}

function startScrolling(scrollPixels, scrollSeconds, scrollDirection) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.storage.local.set(
      {
        scrolling: "1",
        scrollPixels,
        scrollSeconds,
        scrollDirection: scrollDirection || "bottom",
      },
      function () {
        console.log("Settings saved");
      }
    );

    chrome.tabs.sendMessage(tabs[0].id, {
      action: "startScrolling",
      scrollPixels,
      scrollSeconds,
      scrollDirection: scrollDirection || "bottom",
    });
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
