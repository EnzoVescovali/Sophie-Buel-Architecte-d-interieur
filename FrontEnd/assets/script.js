const gallery = document.querySelector(".gallery")

// async function getData() {
//   const url = "http://localhost:5678/api/works"
//   try {
//     const response = await fetch (url);

//     if (!response.ok) {
//       throw new error (`statut de réponse : ${response.statut}`);
//     }
//     const resultat = await response.json();
//     console.log(resultat);
//   }

//   catch {

//   }
// }














fetch("http://localhost:5678/api/works")
  .then(response => response.json())
  .then((data) => {
    data.forEach((element) => {
      const figure = document.createElement("figure")
      const newImg = document.createElement("img")
      const newCaption = document.createElement("figcaption")

      newImg.src = element.imageUrl
      newCaption.textContent = element.title

      figure.append(newImg, newCaption)
      gallery.appendChild(figure)
    });
  })

// category
const categories = document.createElement("div")
categories.classList.add("categoriesFilter")
gallery.before(categories);

fetch("http://localhost:5678/api/categories")
  .then(response => response.json())
  .then((data) => {
    data.forEach(element => {
      const newCategory = document.createElement("button")
      newCategory.textContent = element.name
      categories.appendChild(newCategory)

      newCategory.addEventListener("click", function (e) {
        newCategory.classList.toggle("color")
      })
    });
  })

const everythingBtn = document.createElement("button")
everythingBtn.textContent = "Tous"
categories.appendChild(everythingBtn)
everythingBtn.addEventListener("click", function (e) {
  everythingBtn.classList.toggle("color")
})

