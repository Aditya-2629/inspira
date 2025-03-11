// Shuffle Posts
function shufflePosts() {
  const grid = document.querySelector(".masonry-grid");
  const cards = Array.from(grid.children);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  grid.style.opacity = "0";
  setTimeout(() => {
    grid.append(...cards);
    grid.style.opacity = "1";
  }, 300);
}

// Like Post
async function likePost(postId, button) {
  try {
    const response = await fetch(`/like/${postId}`, { method: "POST" });
    const data = await response.json();
    if (data.success) {
      button.classList.toggle("liked");
      const likeCount = button
        .closest(".post-card")
        .querySelector(".like-count");
      if (likeCount) likeCount.textContent = data.likes;
    }
  } catch (error) {
    console.error("Error liking post:", error);
  }
}
