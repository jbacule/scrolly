document.addEventListener("DOMContentLoaded", function () {
  const scrollControlButton = document.querySelector("#scrollControl");
  const returnToStartButton = document.querySelector("#returnToStart");
  const statusText = document.querySelector("#statusText");

  scrollControlButton.addEventListener("click", onScrollControl);
  returnToStartButton.addEventListener("click", returnToStart);

  chrome.storage.local.get(["scrollPixels", "scrollSeconds", "scrolling", "scrollDirection"], function (data) {
    const { scrollPixels, scrollSeconds, scrolling, scrollDirection } = data;
    if (scrollPixels && scrollSeconds) {
      // set the input values
      document.getElementById("scrollPixels").value = scrollPixels;
      document.getElementById("scrollSeconds").value = scrollSeconds;
      document.getElementById("scrollDirection").value = scrollDirection || "bottom";
    } else {
      chrome.storage.local.set(
        {
          scrolling: "0",
          scrollPixels: 100,
          scrollSeconds: 1,
          scrollDirection: "bottom",
        },
        function () {
          console.log("Scrolly Settings setup complete!");
        }
      );
    }

    if (statusText) {
      applyScrollingState(scrolling);
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
  const scrollPixelsInput = document.getElementById("scrollPixels").value;
  const scrollSecondsInput = document.getElementById("scrollSeconds").value;
  const scrollDirectionInput = document.getElementById("scrollDirection").value;
  const scrollPixels = Math.max(1, parseInt(scrollPixelsInput, 10) || 100);
  const scrollSeconds = Math.max(0.1, parseFloat(scrollSecondsInput) || 1);
  const scrollDirection = scrollDirectionInput || "bottom";
  chrome.storage.local.set(
    {
      scrolling: "1",
      scrollPixels: scrollPixels,
      scrollSeconds: scrollSeconds,
      scrollDirection: scrollDirection,
    },
    function () {
      console.log("Settings saved");
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tabId = tabs[0]?.id;
        if (!tabId) return;
        chrome.tabs.sendMessage(tabId, {
          action: "startScrolling",
          scrollPixels,
          scrollSeconds,
          scrollDirection,
        });
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

function returnToStart() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    updateScrollingStatus("0");
    setStatusText("Ready");

    chrome.storage.local.get(["returnPosition"], function (data) {
      const returnPosition = data.returnPosition || { x: 0, y: 0 };
      chrome.tabs.sendMessage(tabs[0].id, { action: "returnToStart", returnPosition });
    });
  });
}

function updateScrollingStatus(status) {
  chrome.storage.local.get(["scrollPixels", "scrollSeconds", "scrollDirection", "returnPosition"], function (data) {
    const { scrollPixels, scrollSeconds, scrollDirection, returnPosition } = data;
    chrome.storage.local.set(
      { scrolling: status, scrollPixels, scrollSeconds, scrollDirection, returnPosition },
      function () {
      console.log("Settings saved");
      }
    );
  });
}

function setStatusText(text) {
  const statusText = document.querySelector("#statusText");
  if (statusText) {
    statusText.textContent = text;
  }
}

function applyScrollingState(scrolling) {
  const button = document.querySelector("#scrollControl");
  const isScrolling = scrolling === "1";
  if (button) {
    button.value = isScrolling ? "Stop" : "Start";
  }
  setStatusText(isScrolling ? "Scrolling" : "Ready");
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "stopScrollingAndRemoveBadge") {
    setBadgeText(false);
    updateScrollingStatus("0");
    applyScrollingState("0");
  }
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === "local" && changes.scrolling) {
    applyScrollingState(changes.scrolling.newValue);
  }
});
