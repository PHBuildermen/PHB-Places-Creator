const tabs =
  document.querySelectorAll(".tab");

const panels =
  document.querySelectorAll(".tab-panel");


/*
|--------------------------------------------------------------------------
| Tabs
|--------------------------------------------------------------------------
*/

tabs.forEach((tab) => {

  tab.addEventListener("click", () => {

    tabs.forEach((item) => {
      item.classList.remove("active");
    });

    panels.forEach((panel) => {
      panel.classList.remove("active");
    });

    tab.classList.add("active");

    const target =
      document.getElementById(
        tab.dataset.tab
      );

    target.classList.add("active");

    if (tab.dataset.tab === "logs") {
      loadLogs();
    }

  });

});


/*
|--------------------------------------------------------------------------
| File Selector
|--------------------------------------------------------------------------
*/

const fileInput =
  document.getElementById("placeFile");

const fileBox =
  document.getElementById("fileBox");


fileInput.addEventListener(
  "change",
  () => {

    const file =
      fileInput.files[0];

    if (!file) {

      fileBox.textContent =
        "NO FILE SELECTED";

      return;
    }

    const size =
      (
        file.size /
        1024 /
        1024
      ).toFixed(2);

    fileBox.textContent =
      `${file.name} • ${size} MB`;

  }
);


/*
|--------------------------------------------------------------------------
| Progress
|--------------------------------------------------------------------------
*/

function updateProgress(
  percentage,
  text
) {

  document
    .getElementById("progressBar")
    .style.width =
      `${percentage}%`;

  document
    .getElementById("progressText")
    .textContent =
      text;

}


/*
|--------------------------------------------------------------------------
| Publish
|--------------------------------------------------------------------------
*/

const form =
  document.getElementById(
    "publishForm"
  );


form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const button =
      form.querySelector(
        "button[type='submit']"
      );

    button.disabled = true;

    updateProgress(
      15,
      "UPLOADING..."
    );

    try {

      const formData =
        new FormData(form);

      updateProgress(
        35,
        "SENDING FILE..."
      );

      const response =
        await fetch(
          "/api/publish",
          {
            method: "POST",
            body: formData
          }
        );

      updateProgress(
        70,
        "ROBLOX REQUEST..."
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Publishing failed."
        );

      }

      updateProgress(
        100,
        `SUCCESS • VERSION ${
          data.versionNumber ?? "?"
        }`
      );

      alert(
        "Place published successfully!"
      );

    } catch (error) {

      console.error(error);

      updateProgress(
        100,
        "ERROR"
      );

      alert(
        error.message ||
        "Something went wrong."
      );

    } finally {

      button.disabled = false;

    }

  }
);


/*
|--------------------------------------------------------------------------
| Logs
|--------------------------------------------------------------------------
*/

const refreshButton =
  document.getElementById(
    "refreshLogs"
  );


refreshButton.addEventListener(
  "click",
  loadLogs
);


async function loadLogs() {

  const consoleBox =
    document.getElementById(
      "console"
    );

  try {

    const response =
      await fetch("/api/logs");

    const logs =
      await response.json();

    if (!logs.length) {

      consoleBox.textContent =
        "NO LOGS YET";

      return;
    }


    consoleBox.innerHTML =
      logs
        .map((entry) => {

          const time =
            new Date(
              entry.time
            ).toLocaleTimeString();

          return `
            <div class="log ${entry.type}">
              [${time}]
              ${escapeHTML(entry.message)}
            </div>
          `;

        })
        .join("");


    consoleBox.scrollTop =
      consoleBox.scrollHeight;

  } catch {

    consoleBox.textContent =
      "FAILED TO LOAD LOGS.";

  }

}


/*
|--------------------------------------------------------------------------
| HTML Escape
|--------------------------------------------------------------------------
*/

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
