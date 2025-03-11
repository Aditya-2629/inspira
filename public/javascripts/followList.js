document.querySelectorAll(".unfollow-btn").forEach((button) => {
  button.addEventListener("click", async (e) => {
    const userId = e.target.dataset.id;
    const response = await fetch(`/unfollow/${userId}`, { method: "POST" });
    const data = await response.json();

    if (data.success) {
      e.target.parentElement.remove();
    }
  });
});
