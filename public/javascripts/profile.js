// DOM Elements
const elements = {
  uploadIcon: document.getElementById("uploadIcon"),
  uploadForm: document.getElementById("uploadForm"),
  profilePicInput: document.getElementById("profilePicInput"),
  profilePic: document.getElementById("profilePic"),
  profilePicLoader: document.getElementById("profilePicLoader"),
  toast: document.getElementById("toast"),
  followBtn: document.getElementById("follow-btn"),
};

// Show Toast Notification
function showToast(message, type = "success") {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type} show`;
  setTimeout(() => (elements.toast.className = `toast ${type}`), 3000);
}

// Profile Picture Upload
if (elements.uploadIcon) {
  elements.uploadIcon.addEventListener("click", () =>
    elements.profilePicInput.click()
  );

  elements.profilePicInput.addEventListener("change", async () => {
    const file = elements.profilePicInput.files[0];
    if (!file) return;

    elements.profilePicLoader.classList.remove("hidden");
    elements.profilePic.style.opacity = "0.5";
    elements.uploadIcon.style.pointerEvents = "none";

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/upload-profile-pic", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const data = await response.json();
      if (!data.profilePicUrl) throw new Error("Invalid response from server");

      elements.profilePic.src = `${data.profilePicUrl}?t=${Date.now()}`;
      showToast("Profile picture updated successfully!", "success");
    } catch (error) {
      showToast(`Failed to update profile picture: ${error.message}`, "error");
    } finally {
      elements.profilePicLoader.classList.add("hidden");
      elements.profilePic.style.opacity = "1";
      elements.uploadIcon.style.pointerEvents = "auto";
      elements.uploadForm.reset();
    }
  });
}

// Follow/Unfollow User
if (elements.followBtn) {
  elements.followBtn.addEventListener("click", async () => {
    const userId = elements.followBtn.dataset.id;
    const isFollowing = elements.followBtn.textContent.trim() === "Unfollow";
    const endpoint = isFollowing ? `/unfollow/${userId}` : `/follow/${userId}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        elements.followBtn.textContent = isFollowing ? "Follow" : "Unfollow";
        const followersCountEl = document.getElementById("followers-count");
        let count = parseInt(followersCountEl.textContent);
        followersCountEl.textContent = isFollowing ? count - 1 : count + 1;
      } else {
        showToast("Failed to update follow status", "error");
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, "error");
    }
  });
}

// Like Post
async function likePost(postId, button) {
  try {
    const response = await fetch(`/like/${postId}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();

    if (data.success) {
      button.classList.toggle("liked");
      const likeCount = button
        .closest(".post-card")
        .querySelector(".like-count");
      if (likeCount) likeCount.textContent = data.likes;
    } else {
      showToast("Failed to like post", "error");
    }
  } catch (error) {
    showToast(`Error liking post: ${error.message}`, "error");
  }
}

// profile.js
async function openFollowList(type) {
  const url = `/users/user/${currentUserId}/${type}/list`; // Use /users prefix from app.js
  console.log("Fetching URL:", url);
  try {
    const response = await fetch(url, {
      credentials: "include",
    });
    console.log("Response status:", response.status);
    if (!response.ok) {
      console.error("Response text:", await response.text());
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched data:", data);

    document.getElementById("followListTitle").textContent =
      type === "followers" ? "Followers" : "Following";
    const listContainer = document.getElementById("followList");
    listContainer.innerHTML = "";

    data.forEach((user) => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center p-2 border-b";
      li.innerHTML = `
          <div class="flex items-center space-x-2">
            <img src="${
              user.profilePic || "/images/default.jpg"
            }" class="w-10 h-10 rounded-full" alt="${user.username}">
            <span>${user.username}</span>
          </div>
          ${
            type === "following"
              ? `<button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition" onclick="toggleFollow('${user._id}')">Unfollow</button>`
              : ""
          }
        `;
      listContainer.appendChild(li);
    });

    document.getElementById("followListModal").classList.remove("hidden");
  } catch (error) {
    console.error("Fetch error:", error);
    showToast(`Failed to load ${type} list`, "error");
  }
}

async function toggleFollow(userId) {
  try {
    const response = await fetch(`/users/unfollow/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await response.json();
    if (data.success) {
      const li = document.querySelector(
        `li button[onclick="toggleFollow('${userId}')"]`
      )?.parentElement;
      if (li) li.remove();
      showToast("Unfollowed successfully", "success");
    } else {
      showToast("Failed to unfollow", "error");
    }
  } catch (error) {
    console.error("Unfollow error:", error);
    showToast("Error unfollowing user", "error");
  }
}

function showToast(message, type) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: type === "error" ? "#ef4444" : "#10b981",
  }).showToast();
}

async function toggleFollow(userId) {
  try {
    const response = await fetch(`/unfollow/${userId}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();

    if (data.success) {
      openFollowList("following");
    } else {
      showToast("Failed to unfollow user", "error");
    }
  } catch (error) {
    showToast(`Error: ${error.message}`, "error");
  }
}

function closeFollowList() {
  document.getElementById("followListModal").classList.add("hidden");
}
