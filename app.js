/* add your code here */
// app.js

// ---------- Utilities ----------
/** Safe query helper */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/** Create an element with optional props and children */
const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k.startsWith("data-")) node.setAttribute(k, v);
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  });
  children.forEach((c) => node.appendChild(c));
  return node;
};

// ---------- Feature Functions (defined once, used inside DOMContentLoaded) ----------
/**
 * Loops through the users and renders a ul with li elements for each user
 * @param {Array} users
 */
function generateUserList(users) {
  const userList = $(".user-list");
  if (!userList) return;

  // clear out the list from previous render
  userList.innerHTML = "";

  users.forEach(({ user, id }) => {
    const li = el("li", { id: String(id), text: `${user.lastname}, ${user.firstname}` });
    userList.appendChild(li);
  });
}

/**
 * Populates the user edit form
 * @param {*} data
 */
function populateForm(data) {
  if (!data) return;
  const { user, id } = data;
  $("#userID").value = id ?? "";
  $("#firstname").value = user?.firstname ?? "";
  $("#lastname").value = user?.lastname ?? "";
  $("#address").value = user?.address ?? "";
  $("#city").value = user?.city ?? "";
  $("#email").value = user?.email ?? "";
}

/**
 * Renders the portfolio list for a given user
 * @param {*} user
 */
function renderPortfolio(user) {
  const container = $(".portfolio-list");
  if (!container || !user) return;

  const { portfolio = [] } = user;
  container.innerHTML = "";

  // Header row (optional, improves readability)
  const hdr = el("div", { class: "portfolio-row header" },
    el("p", { class: "symbol", text: "Symbol" }),
    el("p", { class: "shares", text: "Shares" }),
    el("p", { class: "actions", text: "Action" }),
  );
  container.appendChild(hdr);

  portfolio.forEach(({ symbol, owned }) => {
    const row = el("div", { class: "portfolio-row" },
      el("p", { class: "symbol", text: symbol }),
      el("p", { class: "shares", text: String(owned) }),
      el("button", { class: "view-btn", id: symbol, text: "View" })
    );
    container.appendChild(row);
  });
}

/**
 * Clears/initializes the stock info area
 */
function resetStockArea() {
  const stockArea = $(".stock-form");
  if (!stockArea) return;
  $("#stockName").textContent = "";
  $("#stockSector").textContent = "";
  $("#stockIndustry").textContent = "";
  $("#stockAddress").textContent = "";
  const logo = $("#logo");
  if (logo) logo.src = "";
}

/**
 * Renders the stock information for the given symbol
 * @param {string} symbol
 * @param {Array} stocks
 */
function viewStock(symbol, stocks) {
  const stockArea = $(".stock-form");
  if (!stockArea || !symbol) return;

  const stock = stocks.find((s) => s.symbol == symbol);
  if (!stock) {
    // Graceful fallback if symbol not found
    $("#stockName").textContent = "Not found";
    $("#stockSector").textContent = "-";
    $("#stockIndustry").textContent = "-";
    $("#stockAddress").textContent = "-";
    const logo = $("#logo");
    if (logo) logo.src = "";
    return;
  }

  $("#stockName").textContent = stock.name ?? "";
  $("#stockSector").textContent = stock.sector ?? "";
  $("#stockIndustry").textContent = stock.subIndustry ?? "";
  $("#stockAddress").textContent = stock.address ?? "";
  const logo = $("#logo");
  if (logo) logo.src = `logos/${stock.symbol}.svg`;
}

/**
 * Handles click on user list (event delegation)
 * @param {*} event
 * @param {Array} users
 * @param {Array} stocks
 */
function handleUserListClick(event, users, stocks) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const userId = target.id;
  if (!userId) return;

  const selectedUser = users.find((u) => u.id == userId);
  if (!selectedUser) return;

  populateForm(selectedUser);
  renderPortfolio(selectedUser);
  resetStockArea();
}

// ---------- Main Bootstrapping ----------
document.addEventListener("DOMContentLoaded", () => {
  // Parse JSON provided via <script> tags in index.html
  // (variables `stockContent` and `userContent` are defined by included data JS files)
  const stocksData = JSON.parse(typeof stockContent !== "undefined" ? stockContent : "[]");
  const userData = JSON.parse(typeof userContent !== "undefined" ? userContent : "[]");

  // Cache DOM nodes we’ll reuse
  const userList = $(".user-list");
  const portfolioList = $(".portfolio-list");
  const saveButton = $("#saveBtn") || $("#savebtn") || $("#save"); // tolerate slight id variants
  const deleteButton = $("#deleteBtn") || $("#deletebtn") || $("#delete"); // tolerate slight id variants

  // Initial render of user list
  generateUserList(userData);

  // Attach a single click listener to the user list (event delegation)
  if (userList) {
    userList.addEventListener("click", (event) => handleUserListClick(event, userData, stocksData));
  }

  // Attach a single click listener to the portfolio container (event delegation for "View" buttons)
  if (portfolioList) {
    portfolioList.addEventListener("click", (event) => {
      const tgt = event.target;
      if (tgt instanceof HTMLButtonElement && tgt.classList.contains("view-btn")) {
        viewStock(tgt.id, stocksData);
      }
    });
  }

  // DELETE user
  if (deleteButton) {
    deleteButton.addEventListener("click", (event) => {
      event.preventDefault();

      const userId = $("#userID")?.value;
      if (!userId) return;

      const idx = userData.findIndex((u) => u.id == userId);
      if (idx === -1) return;

      // Remove from data
      userData.splice(idx, 1);

      // Clear form, portfolio, stock area
      populateForm({ user: { firstname: "", lastname: "", address: "", city: "", email: "" }, id: "" });
      $(".portfolio-list").innerHTML = "";
      resetStockArea();

      // Re-render users
      generateUserList(userData);
    });
  }

  // SAVE user edits
  if (saveButton) {
    saveButton.addEventListener("click", (event) => {
      event.preventDefault();

      const id = $("#userID")?.value;
      if (!id) return;

      for (let i = 0; i < userData.length; i++) {
        if (userData[i].id == id) {
          userData[i].user.firstname = $("#firstname").value;
          userData[i].user.lastname = $("#lastname").value;
          userData[i].user.address = $("#address").value;
          userData[i].user.city = $("#city").value;
          userData[i].user.email = $("#email").value;

          // Re-render user list to reflect any name change
          generateUserList(userData);

          // Keep the portfolio visible for the same user after save
          renderPortfolio(userData[i]);
          break;
        }
      }
    });
  }

  // Optional: select the first user by default for a nice initial state
  if (userData.length > 0) {
    populateForm(userData[0]);
    renderPortfolio(userData[0]);
    resetStockArea();
  }
});

/* Vinesh lab - 02 submission */
