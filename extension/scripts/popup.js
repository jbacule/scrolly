document.addEventListener("DOMContentLoaded", function () {
  const scrollControlButton = document.querySelector("#scrollControl");
  const scrollToTopButton = document.querySelector("#scrollToTop");
  const statusText = document.querySelector("#statusText");

  scrollControlButton.addEventListener("click", onScrollControl);
  scrollToTopButton.addEventListener("click", scrollToTop);

  chrome.storage.local.get(["scrollPixels", "scrollSeconds", "scrolling"], function (data) {
    const { scrollPixels, scrollSeconds, scrolling } = data;
    if (scrollPixels && scrollSeconds) {
      // set the input values
      document.getElementById("scrollPixels").value = scrollPixels;
      document.getElementById("scrollSeconds").value = scrollSeconds;
    } else {
      chrome.storage.local.set(
        {
          scrolling: "0",
          scrollPixels: 100,
          scrollSeconds: 1,
        },
        function () {
          console.log("Scrolly Settings setup complete!");
        }
      );
    }

    if (statusText) {
      statusText.textContent = scrolling === "1" ? "Scrolling" : "Ready";
    }
  });
});

function onScrollControl() {
  const button = document.querySelector("#scrollControl");
  if (button.value === "Start") {
    button.value = "Stop";
    setStatusText("Scrolling");
    startScrolling();
  } else {
    button.value = "Start";
    setStatusText("Ready");
    stopScrolling();
  }
}

function startScrolling() {
  const scrollPixels = document.getElementById("scrollPixels").value;
  const scrollSeconds = document.getElementById("scrollSeconds").value;
  chrome.storage.local.set(
    {
      scrolling: "1",
      scrollPixels: scrollPixels,
      scrollSeconds: scrollSeconds,
    },
    function () {
      console.log("Settings saved");
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startScrolling", scrollPixels, scrollSeconds });
        setBadgeText(true);
      });
    }
  );
}

function stopScrolling() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    updateScrollingStatus("0");

    chrome.tabs.sendMessage(tabs[0].id, { action: "stopScrolling" });
    setBadgeText(false);
  });
}

function setBadgeText(isScrolling) {
  const text = isScrolling ? "ON" : "";
  chrome.action.setBadgeText({ text });
}

function scrollToTop() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    updateScrollingStatus("0");
    setStatusText("Ready");

    chrome.tabs.sendMessage(tabs[0].id, { action: "scrollToTop" });
  });
}

function updateScrollingStatus(status) {
  chrome.storage.local.get(["scrollPixels", "scrollSeconds"], function (data) {
    const { scrollPixels, scrollSeconds } = data;
    chrome.storage.local.set({ scrolling: status, scrollPixels, scrollSeconds }, function () {
      console.log("Settings saved");
    });
  });
}

function setStatusText(text) {
  const statusText = document.querySelector("#statusText");
  if (statusText) {
    statusText.textContent = text;
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "stopScrollingAndRemoveBadge") {
    setBadgeText(false);
    updateScrollingStatus("0");
    document.querySelector("#scrollControl").value = "Start";
    setStatusText("Ready");
  }
});
