
const DEFAULTS = {
  mailhogUrl: "http://127.0.0.1:8025/api/v2/messages",
  autoOtpFilling: false,
  pollingInterval: 5000,
  otpRegex: "\\b(\\d{4,8})\\b",
  autoCreditCardFilling: false,
  autoEmailFilling: false,
  emailPlaceholder: "test-$@email.com"
};

// Load settings when popup opens
chrome.storage.local.get(DEFAULTS, (cfg) => {
  document.getElementById("mailhogUrl").value = cfg.mailhogUrl;
  document.getElementById("otpRegex").value = cfg.otpRegex;
  document.getElementById("pollingInterval").value = cfg.pollingInterval;
  document.getElementById("autoOtpFilling").checked = cfg.autoOtpFilling;
  document.getElementById("autoCreditCardFilling").checked = cfg.autoCreditCardFilling;
  document.getElementById("autoEmailFilling").checked = cfg.autoEmailFilling;
  document.getElementById("emailPlaceholder").value = cfg.emailPlaceholder;
});

const fetchOtp = async () => {
  const otp = await chrome.runtime.sendMessage({ action: "fetchOtpDirect" });
  if (otp) {
    document.getElementById("otpDisplay").innerText = otp;
    // Copy to clipboard
    await navigator.clipboard.writeText(otp);
    document.getElementById("otpDisplay").innerText = otp + " (Copied!)";
    setTimeout(() => {
      document.getElementById("otpDisplay").innerText = otp;
    }, 1500);
  } else {
    document.getElementById("otpDisplay").innerText = "No OTP found";
  }
};

document.getElementById("otpDisplay").onclick = fetchOtp;

document.getElementById("fillBtn").onclick = async () => {
  const result = await chrome.runtime.sendMessage({ action: "fetchAndAutofill" });
  if (result) {
    document.getElementById("otpDisplay").innerText = "OTP autofilled!";
  } else {
    document.getElementById("otpDisplay").innerText = "Failed to autofill OTP.";
  }
};

document.getElementById("fillCreditCardBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "fillCreditCard" });
  document.getElementById("otpDisplay").innerText = "Credit Card filled!";
};

document.getElementById("fillEmailBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "fillEmail" });
  document.getElementById("otpDisplay").innerText = "Email filled!";
};

document.getElementById("saveBtn").onclick = () => {
  chrome.storage.local.set({
    mailhogUrl: document.getElementById("mailhogUrl").value,
    otpRegex: document.getElementById("otpRegex").value,
    pollingInterval: parseInt(document.getElementById("pollingInterval").value),
    autoOtpFilling: document.getElementById("autoOtpFilling").checked,
    autoCreditCardFilling: document.getElementById("autoCreditCardFilling").checked,
    autoEmailFilling: document.getElementById("autoEmailFilling").checked,
    emailPlaceholder: document.getElementById("emailPlaceholder").value
  });
  const toast = document.createElement("div");
  toast.innerText = "Settings saved!";
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.right = "20px";
  toast.style.background = "#222";
  toast.style.color = "#fff";
  toast.style.padding = "10px 15px";
  toast.style.borderRadius = "6px";
  toast.style.zIndex = 99999999;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
};
