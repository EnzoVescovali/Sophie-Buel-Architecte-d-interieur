const gallery = document.querySelector(".gallery");

function showWorks(works) {
  gallery.innerHTML = "";
  works.forEach((element) => {
    const figure = document.createElement("figure");
    const newImg = document.createElement("img");
    const newCaption = document.createElement("figcaption");

    newImg.src = element.imageUrl;
    newCaption.textContent = element.title;

    figure.append(newImg, newCaption);
    gallery.appendChild(figure);
  });
}

const categories = document.createElement("div");
categories.classList.add("categoriesFilter");
gallery.before(categories);

function showCategories(categoriesData) {
  categories.innerHTML = "";

  const everythingBtn = document.createElement("button")
  everythingBtn.textContent = "Tous"
  categories.appendChild(everythingBtn)

  

  categoriesData.forEach((element) => {
    const newCategory = document.createElement("button");
    newCategory.textContent = element.name;
    categories.appendChild(newCategory);

    everythingBtn.addEventListener("click", function (e) {
      everythingBtn.classList.toggle("color")
    })
    newCategory.addEventListener("click", function (e) {
      newCategory.classList.toggle("color")
    })
  });
  
}

async function getInfo() {
  try {
    const worksRes = await fetch("http://localhost:5678/api/works");
    const categoriesRes = await fetch("http://localhost:5678/api/categories");

    const works = await worksRes.json();
    const categoriesData = await categoriesRes.json(); // ✅ renommé

    console.log(works, categoriesData);

    showWorks(works);
    showCategories(categoriesData); // ✅ on passe le bon truc
  } catch (error) {
    console.log("Something went wrong! Error details:" + error);
  }
}

getInfo();

