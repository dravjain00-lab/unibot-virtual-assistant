const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const crumb = document.getElementById("crumb");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

const pageNames = {
  home: "Home & Chat",
  faqs: "Explore FAQs",
  about: "About Project"
};

function switchPage(pageId) {
  pages.forEach(page => page.classList.remove("active-page"));
  document.getElementById(pageId + "Page").classList.add("active-page");

  navLinks.forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  crumb.textContent = pageNames[pageId] || "Home & Chat";
  sidebar.classList.remove("open");
}

navLinks.forEach(link => {
  link.addEventListener("click", () => switchPage(link.dataset.page));
});

document.querySelector(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  switchPage("home");
});

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const messages = document.getElementById("messages");
const clearChat = document.getElementById("clearChat");
const chatPanel = document.getElementById("chatPanel");

const welcomeMessage = messages.innerHTML;

async function sendMessage(question) {
  if (!question.trim()) return;

  messages.innerHTML += `
    <div class="message user-message">
      <div class="bubble">
        <p>${question}</p>
        <span class="message-time">Just now</span>
      </div>
    </div>`;
  chatInput.value = "";
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question })
    });
    const data = await response.json();

    messages.innerHTML += `
      <div class="message bot-message">
        <div class="message-avatar">✦</div>
        <div class="bubble">
          <p>${data.answer}</p>
          <span class="message-time">${data.category} · ${data.confidence}% match</span>
        </div>
      </div>`;
  } catch (error) {
    messages.innerHTML += `
      <div class="message bot-message">
        <div class="message-avatar">✦</div>
        <div class="bubble">
          <p>Could not connect to Python server. Make sure server.py is running!</p>
        </div>
      </div>`;
  }

  messages.scrollTop = messages.scrollHeight;
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(chatInput.value);
});

clearChat.addEventListener("click", () => {
  messages.innerHTML = welcomeMessage;
});

document.querySelectorAll("[data-question]").forEach(btn => {
  btn.addEventListener("click", () => {
    switchPage("home");
    chatPanel.scrollIntoView({ behavior: "smooth" });
    sendMessage(btn.dataset.question);
  });
});

document.getElementById("sidebarAsk").addEventListener("click", () => {
  switchPage("home");
  chatPanel.scrollIntoView({ behavior: "smooth" });
  chatInput.focus();
});

document.getElementById("heroChat").addEventListener("click", () => {
  chatPanel.scrollIntoView({ behavior: "smooth" });
  chatInput.focus();
});

const faqList = document.getElementById("faqList");
const faqSearch = document.getElementById("faqSearch");
const categoryFilter = document.getElementById("categoryFilter");
const emptyFaq = document.getElementById("emptyFaq");

let allFaqs = [];

async function loadFaqs() {
  try {
    const response = await fetch("/api/faqs");
    allFaqs = await response.json();

    const categories = [...new Set(allFaqs.map(f => f.category))];
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });

    renderFaqs(allFaqs);
  } catch (error) {
    faqList.innerHTML = "<p>Start server.py to load FAQs.</p>";
  }
}

function renderFaqs(list) {
  if (list.length === 0) {
    faqList.innerHTML = "";
    emptyFaq.hidden = false;
    return;
  }

  emptyFaq.hidden = true;
  faqList.innerHTML = list.map(faq => `
    <div class="faq-item">
      <small>${faq.category}</small>
      <h3>${faq.question}</h3>
      <p>${faq.answer}</p>
    </div>
  `).join("");
}

function filterFaqs() {
  const keyword = faqSearch.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = allFaqs.filter(faq => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesText = faq.question.toLowerCase().includes(keyword) ||
                        faq.answer.toLowerCase().includes(keyword);
    return matchesCategory && matchesText;
  });

  renderFaqs(filtered);
}

faqSearch.addEventListener("input", filterFaqs);
categoryFilter.addEventListener("change", filterFaqs);

loadFaqs();