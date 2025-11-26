
function fillCreditCardFields() {
    // Get current month and next year
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear() + 1).slice(-2);
    
    let filled = false;
    
    const cardNumberInput = document.querySelector('#input-card-number');
    if (cardNumberInput) {
        cardNumberInput.value = '4242424242424242';
        cardNumberInput.dispatchEvent(new Event("input", { bubbles: true }));
        cardNumberInput.dispatchEvent(new Event("change", { bubbles: true }));
        filled = true;
    }
    
    const cvcInput = document.querySelector('#input-card-cvc');
    if (cvcInput) {
        cvcInput.value = '123';
        cvcInput.dispatchEvent(new Event("input", { bubbles: true }));
        cvcInput.dispatchEvent(new Event("change", { bubbles: true }));
        filled = true;
    }
    
    const expiryInput = document.querySelector('#input-card-expires');
    if (expiryInput) {
        expiryInput.value = `${month}${year}`;
        expiryInput.dispatchEvent(new Event("input", { bubbles: true }));
        expiryInput.dispatchEvent(new Event("change", { bubbles: true }));
        filled = true;
    }
    
    const checkbox = document.querySelector('.mdc-checkbox__native-control');
    if (checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        checkbox.dispatchEvent(new Event("click", { bubbles: true }));
        filled = true;
    }
    
    if (filled) {
        const toast = document.createElement("div");
        toast.innerText = "Credit Card Autofilled ✔";
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
    }
    
    return filled;
}

// Continuous listener for credit card fields
let creditCardObserver = null;

function startCreditCardObserver() {
    if (creditCardObserver) return; // Already observing
    
    creditCardObserver = new MutationObserver(() => {
            const cardNumberInput = document.querySelector('#input-card-number');
            if (cardNumberInput && !cardNumberInput.value) {
               fillCreditCardFields()
                    
            
        }
    });
    
    creditCardObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function stopCreditCardObserver() {
    if (creditCardObserver) {
        creditCardObserver.disconnect();
        creditCardObserver = null;
    }
}

// Initialize observer based on setting
chrome.storage.local.get(['autoCreditCardFilling'], (cfg) => {
    if (cfg.autoCreditCardFilling) {
        startCreditCardObserver();
    }
});

// Email filling functionality
let emailObserver = null;

function fillEmailField(emailPlaceholder) {
    const emailInput = document.querySelector('.email-input > input');
    if (emailInput && !emailInput.value) {
        // Generate a random string to replace the $ placeholder
        const timestampNow = Date.now();
        const email = emailPlaceholder.replace('$', timestampNow);
        
        emailInput.value = email;
        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
        emailInput.dispatchEvent(new Event("change", { bubbles: true }));
        
        const toast = document.createElement("div");
        toast.innerText = "Email Autofilled ✔";
        toast.style.position = "fixed";
        toast.style.top = "60px";
        toast.style.right = "20px";
        toast.style.background = "#222";
        toast.style.color = "#fff";
        toast.style.padding = "10px 15px";
        toast.style.borderRadius = "6px";
        toast.style.zIndex = 99999999;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
        
        return true;
    }
    return false;
}

function startEmailObserver(emailPlaceholder) {
    if (emailObserver) return; // Already observing
    
    emailObserver = new MutationObserver(() => {
        const emailInput = document.querySelector('.email-input > input');
        if (emailInput && !emailInput.value) {
            fillEmailField(emailPlaceholder);
        }
    });
    
    emailObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function stopEmailObserver() {
    if (emailObserver) {
        emailObserver.disconnect();
        emailObserver = null;
    }
}

// Initialize email observer based on setting
chrome.storage.local.get(['autoEmailFilling', 'emailPlaceholder'], (cfg) => {
    if (cfg.autoEmailFilling && cfg.emailPlaceholder) {
        startEmailObserver(cfg.emailPlaceholder);
    }
});

// Listen for setting changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.autoCreditCardFilling) {
        if (changes.autoCreditCardFilling.newValue) {
            startCreditCardObserver();
        } else {
            stopCreditCardObserver();
        }
    }
    
    if (changes.autoEmailFilling || changes.emailPlaceholder) {
        chrome.storage.local.get(['autoEmailFilling', 'emailPlaceholder'], (cfg) => {
            if (cfg.autoEmailFilling && cfg.emailPlaceholder) {
                stopEmailObserver();
                startEmailObserver(cfg.emailPlaceholder);
            } else {
                stopEmailObserver();
            }
        });
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "fillOtp") {
        const digits = msg.code.split("");
        let filled = false;
        digits.forEach((digit, idx) => {
            const input = document.querySelector(`#exo-otp-input-${idx}`);
            if (input) {
                input.value = digit;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
                filled = true;
            }
        });
        if (filled) {
            const toast = document.createElement("div");
            toast.innerText = "OTP Autofilled ✔";
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
        }
    }
    
    if (msg.action === "fillCreditCard") {
        fillCreditCardFields();
    }
    
    if (msg.action === "fillEmail") {
        chrome.storage.local.get(['emailPlaceholder'], (cfg) => {
            if (cfg.emailPlaceholder) {
                fillEmailField(cfg.emailPlaceholder);
            }
        });
    }
});
