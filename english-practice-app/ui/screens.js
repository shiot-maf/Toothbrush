export function showScreen(id) {
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"))
  const target = document.getElementById(id)
  if (target) target.classList.add("active")
}

export function showGlobalSpinner() {
  document.getElementById("global-spinner").classList.add("visible")
}

export function hideGlobalSpinner() {
  document.getElementById("global-spinner").classList.remove("visible")
}
