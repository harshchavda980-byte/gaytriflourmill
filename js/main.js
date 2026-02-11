// Loader
window.addEventListener("load", function(){
  document.getElementById("loader").style.display = "none";
});

// Counter Animation
const counters = document.querySelectorAll('.counter');
counters.forEach(counter => {
  counter.innerText = '0';
  const updateCounter = () => {
    const target = +counter.getAttribute('data-target');
    const c = +counter.innerText;
    const increment = target / 200;
    if(c < target){
      counter.innerText = `${Math.ceil(c + increment)}`;
      setTimeout(updateCounter, 10);
    } else {
      counter.innerText = target;
    }
  };
  updateCounter();
});

// Contact Form Validation
function validateForm() {
  const name = document.forms["contactForm"]["name"].value;
  const email = document.forms["contactForm"]["email"].value;
  const message = document.forms["contactForm"]["message"].value;

  if(name == "" || email == "" || message == ""){
    alert("All fields must be filled out");
    return false;
  }

  alert("Form submitted successfully!");
  return true;
}
