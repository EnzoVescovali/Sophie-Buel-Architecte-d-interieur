document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".gallery");
  if (!gallery) return; // évite de casser si le script est chargé sur une autre page

  const token = localStorage.getItem("token");
  const logged = Boolean(token);

  let cachedWorks = [];

  function showWorks(works) {
    gallery.innerHTML = "";
    works.forEach((w) => {
      const figure = document.createElement("figure");

      const img = document.createElement("img");
      img.src = w.imageUrl;
      img.alt = w.title || "";

      const caption = document.createElement("figcaption");
      caption.textContent = w.title;

      figure.append(img, caption);
      gallery.appendChild(figure);
    });
  }

  function showCategories(categoriesData, works) {
    const categories = document.createElement("div");
    categories.classList.add("categoriesFilter");
    gallery.before(categories);

    const everythingBtn = document.createElement("button");
    everythingBtn.textContent = "Tous";
    categories.appendChild(everythingBtn);

    everythingBtn.addEventListener("click", () => showWorks(works));

    categoriesData.forEach((cat) => {
      const btn = document.createElement("button");
      btn.textContent = cat.name;
      categories.appendChild(btn);

      btn.addEventListener("click", () => {
        const filtered = works.filter((w) => w.categoryId === cat.id);
        showWorks(filtered);
      });
    });
  }

  function enableAdminUI() {
    const banner = document.createElement("div");
    banner.classList.add("editBanner");
    banner.textContent = "✎ Mode édition";
    document.body.prepend(banner);

    const navLinks = document.querySelectorAll("nav a");
    for (const a of navLinks) {
      if (a.textContent.trim().toLowerCase() === "login") {
        a.textContent = "logout";
        a.href = "#";
        a.addEventListener("click", (e) => {
          e.preventDefault();
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          window.location.reload();
        });
        break;
      }
    }

    const title = document.querySelector("#portfolio h2");
    if (title && !document.querySelector(".editBtn")) {
      const btn = document.createElement("button");
      btn.classList.add("editBtn");
      btn.type = "button";
      btn.textContent = "✎ modifier";
      title.after(btn);
    }
  }

  function openModal(works) {
    if (document.querySelector(".modalOverlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "modalOverlay";
    overlay.innerHTML = `
      <div class="modalBox" role="dialog" aria-modal="true" aria-label="Galerie photo">
        <button class="modalClose" type="button" aria-label="Fermer">×</button>
        <h3 class="modalTitle">Galerie photo</h3>
        <div class="modalGrid"></div>
        <hr class="modalDivider" />
        <button class="modalPrimaryBtn" type="button">Ajouter une photo</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener("click", (e) => e.target === overlay && close());
    overlay.querySelector(".modalClose").addEventListener("click", close);
    document.addEventListener("keydown", (e) => e.key === "Escape" && close(), {
      once: true,
    });

    const grid = overlay.querySelector(".modalGrid");
    grid.innerHTML = works
      .map(
        (w) => `
          <figure class="modalItem">
            <img class="modalItem__img" src="${w.imageUrl}" alt="${(w.title || "").replaceAll('"', "&quot;")}">
            <button class="modalItem__delete" type="button" aria-label="Supprimer">🗑</button>
          </figure>
        `
      )
      .join("");
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".editBtn")) return;
    if (!cachedWorks.length) return;
    openModal(cachedWorks);
  });

  async function getInfo() {
    try {
      const worksRes = await fetch("http://localhost:5678/api/works");
      const works = await worksRes.json();
      cachedWorks = works;
      showWorks(works);

      if (logged) {
        enableAdminUI();
        return;
      }

      const categoriesRes = await fetch("http://localhost:5678/api/categories");
      const categoriesData = await categoriesRes.json();
      showCategories(categoriesData, works);
    } catch (error) {
      console.log("Something went wrong! Error details:", error);
    }
  }

  getInfo();
});
// modal

let cachedWorks = [];

async function fetchWorks() {
  const res = await fetch("http://localhost:5678/api/works");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  cachedWorks = await res.json();
}

function openModal(works) {
  if (document.querySelector(".modalOverlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";
  overlay.innerHTML = `
    <div class="modalBox" role="dialog" aria-modal="true" aria-label="Galerie photo">
      <button class="modalClose" type="button" aria-label="Fermer">×</button>
      <h3 class="modalTitle">Galerie photo</h3>

      <div class="modalGrid"></div>

      <hr class="modalDivider" />
      <button class="modalPrimaryBtn" type="button">Ajouter une photo</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => e.target === overlay && close());
  overlay.querySelector(".modalClose").addEventListener("click", close);
  document.addEventListener("keydown", (e) => e.key === "Escape" && close(), { once: true });

  const grid = overlay.querySelector(".modalGrid");
  grid.innerHTML = works
    .map(
      (w) => `
        <figure class="modalItem">
          <img class="modalItem__img" src="${w.imageUrl}" alt="${(w.title || "").replaceAll('"', "&quot;")}">
          <button class="modalItem__delete" type="button" aria-label="Supprimer">🗑</button>
        </figure>
      `
    )
    .join("");
}

document.addEventListener("click", async (e) => {
  if (!e.target.closest(".editBtn")) return;

  try {
    if (!cachedWorks.length) await fetchWorks();
    openModal(cachedWorks);
  } catch (err) {
    console.error(err);
  }
});




