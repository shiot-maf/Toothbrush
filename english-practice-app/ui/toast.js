let toastTimer = null

export function showToast(msg) {
  let toast = document.getElementById("toast")
  if (!toast) {
    toast = document.createElement("div")
    toast.id = "toast"
    document.body.appendChild(toast)
  }

  toast.textContent = msg
  toast.classList.remove("toast-hide")
  toast.classList.add("toast-show")

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.classList.remove("toast-show")
    toast.classList.add("toast-hide")
  }, 3000)
}
