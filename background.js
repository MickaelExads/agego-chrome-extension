
const DEFAULTS = {
  mailhogUrl: "http://127.0.0.1:8025/api/v2/messages",
  autoOtpFilling: false,
  pollingInterval: 5000,
  otpRegex: "\\b(\\d{4,8})\\b",
  autoCreditCardFilling: false,
  autoEmailFilling: false,
  emailPlaceholder: "test-$@email.com"
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set(DEFAULTS);
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

async function fetchOtp() {
  const cfg = await chrome.storage.local.get(DEFAULTS);
  try {
    const resp = await fetch(cfg.mailhogUrl, { cache: "no-store" });
    const data = await resp.json();
    if (!data.items || data.items.length === 0) return null;

    const subject = data.items[0].Content.Headers.Subject[0];
    const re = new RegExp(cfg.otpRegex);
    const match = subject.match(re);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

async function fillOtpIntoPage(tabId, otp) {
    // Enumerate all frames in the tab and send the message to each
    chrome.webNavigation.getAllFrames({ tabId }, (frames) => {
      if (!frames || frames.length === 0) return;
      frames.forEach((frame) => {
        chrome.tabs.sendMessage(tabId, { action: "fillOtp", code: otp }, { frameId: frame.frameId });
      });
    });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "fill-otp") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const otp = await fetchOtp();
    if (otp) fillOtpIntoPage(tab.id, otp);
  }
});

chrome.alarms.onAlarm.addListener(async () => {
  const cfg = await chrome.storage.local.get(DEFAULTS);
  if (!cfg.autoOtpFilling) return;
  const otp = await fetchOtp();
  if (!otp) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  fillOtpIntoPage(tab.id, otp);
});


chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoOtpFilling || changes.pollingInterval) {
    chrome.storage.local.get(DEFAULTS, (cfg) => {
      chrome.alarms.clearAll();
      if (cfg.autoOtpFilling) {
        chrome.alarms.create("mailhogPolling", { periodInMinutes: cfg.pollingInterval / 60000 });
      }
    });
  }
  
  // Trigger credit card autofill when setting is enabled
  if (changes.autoCreditCardFilling && changes.autoCreditCardFilling.newValue) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        // Try multiple times with delays to ensure fields are present
        const tryFill = (attempt = 0) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "fillCreditCard" });
          if (attempt < 5) {
            setTimeout(() => tryFill(attempt + 1), 1000);
          }
        };
        tryFill();
      }
    });
  }
});

// Message listener for popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchOtpDirect") {
    fetchOtp().then(sendResponse);
    return true;
  }
  if (message.action === "fetchAndAutofill") {
    fetchOtp().then((otp) => {
      if (!otp) {
        sendResponse(false);
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          fillOtpIntoPage(tabs[0].id, otp);
          sendResponse(true);
        } else {
          sendResponse(false);
        }
      });
    });
    return true;
  }
});
