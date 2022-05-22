let defaultColor = "#ecf4f9";
let selectedColor = getCookie("bgcolor");
if (selectedColor) document.querySelector("body").style.background = selectedColor;
colorPicker = document.querySelector("#background-color-select input");
colorPicker.value = (selectedColor) ? selectedColor : defaultColor;
colorPicker.addEventListener("input", updateColor, false);
document.querySelector("#background-color-select a").addEventListener("click", returnToDefault, false);
colorPicker.select();
function updateColor(event) {
  setCookie("bgcolor", event.target.value, 60);
  document.querySelector("body").style.background = event.target.value;
}
function returnToDefault() {
  setCookie("bgcolor", defaultColor, 60);
  document.querySelector("body").style.background = defaultColor;
}