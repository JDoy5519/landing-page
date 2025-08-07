//HEADER LOGIC

const ctaButton = document.querySelector('.cta-button');
const dropdownMenu = document.querySelector('.dropdown-menu');

ctaButton.addEventListener('click', () => {
  dropdownMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!ctaButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.add('hidden');
  }
});

//CLAIMS PROCESS ANIMATION
const faders = document.querySelectorAll('.fade-in');

const appearOptions = {
    threshold: 0.3
  };

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
entries.forEach(entry => {
    if (!entry.isIntersecting) return;
      entry.target.classList.add("show");
      observer.unobserve(entry.target);
    });
  }, appearOptions);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
  });

//FORM SUBMIT LOGIC
const claimTypeSelect = document.getElementById("claimType");
const ivaRefGroup = document.getElementById("ivaRefGroup");

function toggleIVAField() {
  if (claimTypeSelect.value === "IVA") {
    ivaRefGroup.classList.remove("hidden");
  } else {
    ivaRefGroup.classList.add("hidden");
  }
}

// Run once on page load
toggleIVAField();

// Run every time claim type changes
claimTypeSelect.addEventListener("change", toggleIVAField);


// Inline thank you message (FormSubmit trick)
const form = document.getElementById("claimForm");
form.addEventListener("submit", function (e) {
  e.preventDefault();
  
  fetch(form.action, {
    method: "POST",
    body: new FormData(form),
    headers: { Accept: "application/json" }
  }).then(response => {
    if (response.ok) {
      form.reset();
      document.getElementById("thankYouMessage").classList.remove("hidden");
    }
  });
});

//ABOUT US SCROLL

const fadeEls = document.querySelectorAll('.fade-in-up');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  });

fadeEls.forEach(el => observer.observe(el));
