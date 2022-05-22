// Background color selection widget

const body = document.querySelector("body");
const returnToDefaultButton = document.querySelector("#background-color-select a");
let defaultColor = "#ecf4f9"; // pale blue
let selectedColor = getCookie("bgcolor");

if (selectedColor) {
  body.style.background = selectedColor;
}

colorPicker = document.querySelector("#background-color-select input");
colorPicker.value = (selectedColor) ? selectedColor : defaultColor;

colorPicker.addEventListener("input", updateColor, false);
returnToDefaultButton.addEventListener("click", returnToDefault, false);
colorPicker.select();

function updateColor(event) {
  setCookie("bgcolor", event.target.value, 60);
  body.style.background = event.target.value;
}
function returnToDefault() {
  setCookie("bgcolor", defaultColor, 60);
  body.style.background = defaultColor;
  colorPicker.value = defaultColor;
}