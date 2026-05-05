const slides = [
  {
    img: "img/mentor.jpg",
    title: "Friendly Support",
    desc: "We create a safe space to express your feelings."
  },
  {
    img: "img/depression.webp",
    title: "Guided Help",
    desc: "Resources tailored to your emotional needs."
  },
  {
    img: "img/brain.webp",
    title: "Always With You",
    desc: "Access support anytime, anywhere."
  },
  {
    img: "img/imo.webp",
    title: "Privacy First",
    desc: "Your data is completely safe with us."
  }
];

let index = 0;
let current = 0;

const images = [
  document.getElementById("img1"),
  document.getElementById("img2")
];

const title = document.getElementById("slide-title");
const desc = document.getElementById("slide-desc");

const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");

// initial load
images[0].src = slides[0].img;
images[0].classList.add("active");
title.textContent = slides[0].title;
desc.textContent = slides[0].desc;

function showSlide(newIndex){
  const nextImage = images[1 - current];
  const currentImage = images[current];

  // IMAGE transition
  nextImage.src = slides[newIndex].img;
  nextImage.classList.add("active");
  currentImage.classList.remove("active");

  // TEXT animation (fade + slide out)
  title.classList.add("text-hide");
  desc.classList.add("text-hide");

  setTimeout(() => {
    // change text
    title.textContent = slides[newIndex].title;
    desc.textContent = slides[newIndex].desc;

    // bring text back (fade + slide in)
    title.classList.remove("text-hide");
    desc.classList.remove("text-hide");
  }, 300);

  current = 1 - current;
}

function nextSlide(){
  index = (index + 1) % slides.length;
  showSlide(index);
}

function prevSlide(){
  index = (index - 1 + slides.length) % slides.length;
  showSlide(index);
}

nextBtn.addEventListener("click", nextSlide);
prevBtn.addEventListener("click", prevSlide);

setInterval(nextSlide, 3000);