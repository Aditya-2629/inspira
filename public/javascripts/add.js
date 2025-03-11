const elements = {
  form: document.getElementById("postForm"),
  uploadContainer: document.getElementById("uploadContainer"),
  fileInput: document.getElementById("imageUpload"),
  previewImg: document.getElementById("previewImg"),
  previewVideo: document.getElementById("previewVideo"),
  uploadText: document.getElementById("uploadText"),
  spinner: document.getElementById("spinner"),
  submitBtn: document.getElementById("submitBtn"),
  toast: document.getElementById("toast"),
};

let isSubmitting = false;
const MAX_DURATION = 120; // Max video duration in seconds

// Handle drag events
elements.uploadContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
  elements.uploadContainer.classList.add("dragover");
});
elements.uploadContainer.addEventListener("dragleave", (e) => {
  e.preventDefault();
  elements.uploadContainer.classList.remove("dragover");
});
elements.uploadContainer.addEventListener("drop", handleDrop);

// Preview image or video with duration check
function previewMedia(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    if (file.type.startsWith("image/")) {
      elements.previewImg.src = reader.result;
      elements.previewImg.classList.remove("hidden");
      elements.previewVideo.classList.add("hidden");
      elements.submitBtn.disabled = false;
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = reader.result;
      video.onloadedmetadata = () => {
        if (video.duration > MAX_DURATION) {
          showToast(`Video exceeds ${MAX_DURATION} seconds limit!`, "error");
          elements.fileInput.value = "";
          elements.previewVideo.classList.add("hidden");
          elements.uploadText.classList.remove("hidden");
          elements.submitBtn.disabled = true;
        } else {
          elements.previewVideo.src = reader.result;
          elements.previewVideo.classList.remove("hidden");
          elements.previewImg.classList.add("hidden");
          elements.submitBtn.disabled = false;
        }
      };
    }
    elements.uploadText.classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

function handleDrop(event) {
  event.preventDefault();
  elements.uploadContainer.classList.remove("dragover");
  const file = event.dataTransfer.files[0];
  if (file) {
    elements.fileInput.files = event.dataTransfer.files;
    previewMedia({ target: elements.fileInput });
  }
}

function showToast(message, type = "success") {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type} show`;
  setTimeout(() => (elements.toast.className = `toast ${type}`), 3000);
}

function resetForm() {
  elements.submitBtn.disabled = true;
  elements.spinner.classList.add("hidden");
  elements.uploadContainer.style.pointerEvents = "auto";
  elements.uploadContainer.style.opacity = "1";
  elements.form.reset();
  elements.previewImg.classList.add("hidden");
  elements.previewVideo.classList.add("hidden");
  elements.uploadText.classList.remove("hidden");
  elements.fileInput.value = "";
}

// Display error from query param if present
const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get("error");
if (error) {
  showToast(error, "error");
  history.replaceState(null, "", window.location.pathname);
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isSubmitting) return;

  isSubmitting = true;
  elements.spinner.classList.remove("hidden");
  elements.uploadContainer.style.pointerEvents = "none";
  elements.uploadContainer.style.opacity = "0.5";

  const file = elements.fileInput.files[0];
  if (!file) {
    showToast("Please upload an image or video!", "error");
    resetForm();
    isSubmitting = false;
    return;
  }

  try {
    const formData = new FormData(elements.form);
    const response = await fetch("/createpost", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create post: ${errorText}`);
    }

    showToast("Post created successfully!", "success");
    setTimeout(() => (window.location.href = "/profile"), 2000);
  } catch (error) {
    showToast(`Error: ${error.message}`, "error");
    resetForm();
  } finally {
    isSubmitting = false;
  }
});
