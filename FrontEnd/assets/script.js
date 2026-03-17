document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".gallery")
  if (!gallery) return

  function getToken() {
    const raw = localStorage.getItem("token") || ""
    let t = raw
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === "string") t = parsed
      else if (parsed?.token) t = parsed.token
    } catch {}
    return String(t).replace(/^Bearer\s+/i, "").replace(/"/g, "").trim()
  }

  const isLogged = () => Boolean(getToken())

  let cachedWorks = []
  let cachedCategories = []

  function showWorks(works) {
    gallery.innerHTML = ""
    works.forEach((w) => {
      const figure = document.createElement("figure")
      figure.dataset.id = w.id

      const img = document.createElement("img")
      img.src = w.imageUrl
      img.alt = w.title || ""

      const caption = document.createElement("figcaption")
      caption.textContent = w.title

      figure.append(img, caption)
      gallery.appendChild(figure)
    })
  }

  function showCategories(categories) {
    if (document.querySelector(".categoriesFilter")) return

    const wrap = document.createElement("div")
    wrap.classList.add("categoriesFilter")
    gallery.before(wrap)

    const allBtn = document.createElement("button")
    allBtn.textContent = "Tous"
    wrap.appendChild(allBtn)
    allBtn.addEventListener("click", () => showWorks(cachedWorks))

    categories.forEach((cat) => {
      const btn = document.createElement("button")
      btn.textContent = cat.name
      wrap.appendChild(btn)

      btn.addEventListener("click", () => {
        showWorks(cachedWorks.filter((w) => w.categoryId === cat.id))
      })
    })
  }

  function enableAdminUI() {
    if (!document.querySelector(".editBanner")) {
      const banner = document.createElement("div")
      banner.classList.add("editBanner")
      banner.textContent = "✎ Mode édition"
      document.body.prepend(banner)
    }

    const navLinks = document.querySelectorAll("nav a")
    for (const a of navLinks) {
      if (a.textContent.trim().toLowerCase() === "login") {
        a.textContent = "logout"
        a.href = "#"
        a.addEventListener("click", (e) => {
          e.preventDefault()
          localStorage.removeItem("token")
          localStorage.removeItem("userId")
          window.location.reload()
        })
        break
      }
    }

    const title = document.querySelector("#portfolio h2")
    if (title && !document.querySelector(".editBtn")) {
      const btn = document.createElement("button")
      btn.classList.add("editBtn")
      btn.type = "button"
      btn.textContent = "✎ modifier"
      title.after(btn)
    }
  }

  async function fetchWorks() {
    const res = await fetch("http://localhost:5678/api/works")
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    cachedWorks = await res.json()
    showWorks(cachedWorks)
  }

  async function fetchCategories() {
    const res = await fetch("http://localhost:5678/api/categories")
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    cachedCategories = await res.json()
  }

  async function deleteWork(id) {
    const token = getToken()
    if (!token) throw new Error("Pas connecté (token)")

    const res = await fetch(`http://localhost:5678/api/works/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) {
      localStorage.removeItem("token")
      throw new Error("401: reconnecte-toi")
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }

  async function addWork({ imageFile, title, categoryId }) {
    const token = getToken()
    if (!token) throw new Error("Pas connecté (token)")

    const fd = new FormData()
    fd.append("image", imageFile)
    fd.append("title", title)
    fd.append("category", String(categoryId))

    const res = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })

    if (res.status === 401) {
      localStorage.removeItem("token")
      throw new Error("401: reconnecte-toi")
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }

  function createOverlay() {
    const existing = document.querySelector(".modalOverlay")
    if (existing) return existing

    const overlay = document.createElement("div")
    overlay.className = "modalOverlay"
    overlay.dataset.view = "gallery"
    document.body.appendChild(overlay)

    const close = () => overlay.remove()

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close()

      const closeBtn = e.target.closest(".modalClose")
      if (closeBtn) close()

      if (overlay.dataset.view === "gallery") {
        const addBtn = e.target.closest(".modalPrimaryBtn")
        if (addBtn) return renderAddModal(overlay)

        const delBtn = e.target.closest(".modalItem__delete")
        if (delBtn) return onDeleteFromModal(overlay, delBtn.dataset.id)
      }

      if (overlay.dataset.view === "add") {
        const backBtn = e.target.closest(".modalBack")
        if (backBtn) return renderGalleryModal(overlay)
      }
    })

    document.addEventListener("keydown", (e) => e.key === "Escape" && close(), { once: true })

    return overlay
  }

  async function onDeleteFromModal(overlay, id) {
    if (!id) return
    try {
      await deleteWork(id)
      await fetchWorks()
      renderGalleryModal(overlay)
    } catch (err) {
      console.error(err)
      alert(`Suppression impossible (${err.message})`)
    }
  }

  function renderGalleryModal(overlay) {
    overlay.dataset.view = "gallery"
    overlay.innerHTML = `
      <div class="modalBox" role="dialog" aria-modal="true" aria-label="Galerie photo">
        <button class="modalClose" type="button" aria-label="Fermer">×</button>
        <h3 class="modalTitle">Galerie photo</h3>
        <div class="modalGrid"></div>
        <hr class="modalDivider" />
        <button class="modalPrimaryBtn" type="button">Ajouter une photo</button>
      </div>
    `

    const grid = overlay.querySelector(".modalGrid")
    grid.innerHTML = cachedWorks.length
      ? cachedWorks
          .map(
            (w) => `
              <figure class="modalItem" data-id="${w.id}">
                <img class="modalItem__img" src="${w.imageUrl}" alt="${(w.title || "").replaceAll('"', "&quot;")}">
                <button class="modalItem__delete" type="button" data-id="${w.id}" aria-label="Supprimer">🗑</button>
              </figure>
            `
          )
          .join("")
      : `<p style="text-align:center;">Aucun projet</p>`
  }

  function renderAddModal(overlay) {
    overlay.dataset.view = "add"

    overlay.innerHTML = `
      <div class="modalBox" role="dialog" aria-modal="true" aria-label="Ajout photo">
        <button class="modalBack" type="button" aria-label="Retour">←</button>
        <button class="modalClose" type="button" aria-label="Fermer">×</button>

        <h3 class="modalTitle">Ajout photo</h3>

        <form class="addForm">
          <div class="addPreview">
            <img class="addPreviewImg" alt="" style="display:none; max-width:100%; height:auto;" />
            <input class="addFile" type="file" accept="image/*" style="display:none;" />
            <button class="addFileBtn" type="button">+ Ajouter photo</button>
            <p class="addHint">jpg, png : 4mo max</p>
          </div>

          <label>Titre</label>
          <input class="addTitle" type="text" />

          <label>Catégorie</label>
          <select class="addCategory">
            <option value="">-- Choisir --</option>
            ${cachedCategories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
          </select>

          <button class="modalPrimaryBtn addSubmit" type="submit" disabled>Valider</button>
        </form>
      </div>
    `

    const fileInput = overlay.querySelector(".addFile")
    const fileBtn = overlay.querySelector(".addFileBtn")
    const previewImg = overlay.querySelector(".addPreviewImg")
    const titleInput = overlay.querySelector(".addTitle")
    const categorySelect = overlay.querySelector(".addCategory")
    const submitBtn = overlay.querySelector(".addSubmit")

    const refreshSubmit = () => {
      submitBtn.disabled = !(fileInput.files?.[0] && titleInput.value.trim() && categorySelect.value)
    }

    fileBtn.addEventListener("click", () => fileInput.click())
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0]
      if (!file) return refreshSubmit()
      previewImg.src = URL.createObjectURL(file)
      previewImg.style.display = "block"
      fileBtn.style.display = "none"
      refreshSubmit()
    })
    titleInput.addEventListener("input", refreshSubmit)
    categorySelect.addEventListener("change", refreshSubmit)

    overlay.querySelector(".addForm").addEventListener("submit", async (e) => {
      e.preventDefault()
      try {
        await addWork({
          imageFile: fileInput.files[0],
          title: titleInput.value.trim(),
          categoryId: categorySelect.value,
        })
        await fetchWorks()
        renderGalleryModal(overlay)
      } catch (err) {
        console.error(err)
        alert(`Ajout impossible (${err.message})`)
      }
    })
  }

  document.addEventListener("click", async (e) => {
    if (!e.target.closest(".editBtn")) return

    try {
      if (!cachedWorks.length) await fetchWorks()
      if (!cachedCategories.length) await fetchCategories()

      const overlay = createOverlay()
      renderGalleryModal(overlay)
    } catch (err) {
      console.error(err)
      alert(`Impossible d'ouvrir (${err.message})`)
    }
  })

  async function init() {
    try {
      await fetchWorks()

      if (isLogged()) {
        enableAdminUI()
        await fetchCategories()
        return
      }

      await fetchCategories()
      showCategories(cachedCategories)
    } catch (err) {
      console.log("Something went wrong! Error details:", err)
    }
  }

  init()
})


// login.js
const form = document.querySelector(".loginForm")
const emailInput = document.getElementById("mail")
const passwordInput = document.getElementById("passW")

async function loginInfo() {
  const loginRes = await fetch("http://localhost:5678/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    }),
  })

  const login = await loginRes.json()

  if (loginRes.ok) {
    const token = String(login.token || "").replace(/^Bearer\s+/i, "").replace(/"/g, "").trim()
    localStorage.setItem("token", token)
    if (login.userId) localStorage.setItem("userId", String(login.userId))
    window.location.href = "index.html"
  } else {
    alert("Email ou mot de passe incorrect")
    console.log("Erreur", login)
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault()
  try {
    await loginInfo()
  } catch (error) {
    console.log("Something went wrong! Error details:" + error)
  }
})