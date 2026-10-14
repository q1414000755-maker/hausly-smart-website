(function () {
  "use strict";

  function filterNews(type) {
    document.querySelectorAll("[data-news-type]").forEach(function (node) {
      var own = node.getAttribute("data-news-type");
      node.hidden = type !== "all" && own !== type;
    });
    document.querySelectorAll("[data-news-filter]").forEach(function (button) {
      var active = button.getAttribute("data-news-filter") === type;
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-news-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      filterNews(button.getAttribute("data-news-filter") || "all");
    });
  });

  var archiveFilter = document.querySelector("[data-news-archive-filter]");
  var archiveSearch = document.querySelector("[data-news-search]");
  function filterArchive() {
    var type = archiveFilter ? archiveFilter.value : "all";
    var query = archiveSearch ? archiveSearch.value.trim().toLowerCase() : "";
    document.querySelectorAll("[data-news-archive-item]").forEach(function (row) {
      var matchesType = type === "all" || row.getAttribute("data-news-type") === type;
      var matchesSearch = !query || row.textContent.toLowerCase().indexOf(query) !== -1;
      row.hidden = !(matchesType && matchesSearch);
    });
  }
  if (archiveFilter) archiveFilter.addEventListener("change", filterArchive);
  if (archiveSearch) archiveSearch.addEventListener("input", filterArchive);
  document.querySelectorAll("[data-news-topic]").forEach(function (link) {
    link.addEventListener("click", function () {
      var type = link.getAttribute("data-news-topic") || "all";
      filterNews(type);
    });
  });

  document.querySelectorAll("[data-company-form]").forEach(function (form) {
    var counter = form.querySelector("[data-company-counter]");
    var textarea = form.querySelector("textarea");
    if (textarea && counter) {
      textarea.addEventListener("input", function () {
        counter.textContent = textarea.value.length + " / " + (textarea.maxLength > 0 ? textarea.maxLength : 1000);
      });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-company-status]");
      if (!form.checkValidity()) {
        form.reportValidity();
        if (status) status.textContent = "Please complete the required fields.";
        return;
      }
      if (status) status.textContent = "Your inquiry is ready for review. Submission connection is pending production integration.";
    });
  });
})();
