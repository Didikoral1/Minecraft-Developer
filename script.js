const SUPABASE_URL = "DEINE_SUPABASE_URL";
const SUPABASE_KEY = "DEIN_PUBLISHABLE_KEY";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/* NAVBAR */

async function updateNavbar() {
  if (!supabaseClient) return;

  const loginNav = document.getElementById("loginNav");
  const registerNav = document.getElementById("registerNav");
  const profileNav = document.getElementById("profileNav");
  const navAvatar = document.getElementById("navAvatar");

  const { data } = await supabaseClient.auth.getUser();

  if (data.user) {
    const mcName = data.user.user_metadata.mc_name || "Steve";

    if (loginNav) loginNav.style.display = "none";
    if (registerNav) registerNav.style.display = "none";
    if (profileNav) profileNav.style.display = "inline-block";
    if (navAvatar) navAvatar.src = "https://mc-heads.net/avatar/" + mcName;
  } else {
    if (loginNav) loginNav.style.display = "inline-block";
    if (registerNav) registerNav.style.display = "inline-block";
    if (profileNav) profileNav.style.display = "none";
  }
}

/* REGISTER / LOGIN */

async function register() {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const mcName = document.getElementById("registerMcName").value;

  if (!email || !password || !mcName) {
    alert("Bitte alles ausfüllen.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        mc_name: mcName
      }
    }
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.user) {
    await supabaseClient.from("profiles").insert({
      user_id: data.user.id,
      mc_name: mcName,
      downloads: 0
    });
  }

  alert("Account erstellt. Du kannst dich jetzt einloggen.");
  window.location.href = "login.html";
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "profile.html";
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

/* PROFILE */

async function loadProfile() {
  updateNavbar();

  const { data: userData } = await supabaseClient.auth.getUser();

  if (!userData.user) {
    window.location.href = "login.html";
    return;
  }

  const userId = userData.user.id;
  const email = userData.user.email;
  const mcName = userData.user.user_metadata.mc_name || "Steve";

  document.getElementById("profileName").innerText = mcName;
  document.getElementById("profileEmail").innerText = email;
  document.getElementById("mcAvatar").src = "https://mc-heads.net/avatar/" + mcName;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profile) {
    document.getElementById("profileDownloads").innerText = profile.downloads;
  }

  loadMyReviews(userId);
}

async function loadMyReviews(userId) {
  const myReviews = document.getElementById("myReviews");
  if (!myReviews) return;

  const { data, error } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || data.length === 0) {
    myReviews.innerHTML = "<p>Noch keine Bewertungen geschrieben.</p>";
    return;
  }

  myReviews.innerHTML = "";

  data.forEach(review => {
    myReviews.innerHTML += `
      <div class="card">
        <h3>${review.plugin_name || "Plugin"}</h3>
        <p class="star">${"★".repeat(review.stars)}${"☆".repeat(5 - review.stars)}</p>
        <p>${review.comment}</p>
        <p>Status: ${review.approved ? "Freigegeben" : "Wartet auf Freigabe"}</p>
      </div>
    `;
  });
}

/* COMMUNITY */

async function loadCommunity() {
  updateNavbar();

  const communityList = document.getElementById("communityList");
  const topPlayers = document.getElementById("topPlayers");

  const { data, error } = await supabaseClient
    .from("public_community")
    .select("*")
    .order("downloads", { ascending: false });

  if (error || !data) {
    if (communityList) communityList.innerHTML = "<p>Community konnte nicht geladen werden.</p>";
    return;
  }

  if (topPlayers) {
    topPlayers.innerHTML = "";

    data.slice(0, 10).forEach((player, index) => {
      topPlayers.innerHTML += `
        <div class="card">
          <h3>#${index + 1} ${player.mc_name}</h3>
          <img class="community-avatar" src="https://mc-heads.net/avatar/${player.mc_name}">
          <p>Downloads: ${player.downloads}</p>
          <p>Bewertungen: ${player.review_count}</p>
          <p>Durchschnitt: ${player.avg_stars} ⭐</p>
          <a href="player.html?id=${player.user_id}">Profil ansehen</a>
        </div>
      `;
    });
  }

  if (communityList) {
    communityList.innerHTML = "";

    if (data.length === 0) {
      communityList.innerHTML = "<p>Noch keine Spieler registriert.</p>";
      return;
    }

    data.forEach(player => {
      const joinedDate = new Date(player.created_at).toLocaleDateString("de-DE");

      communityList.innerHTML += `
        <div class="card">
          <img class="community-avatar" src="https://mc-heads.net/avatar/${player.mc_name}">
          <h3>${player.mc_name}</h3>
          <p>Downloads: ${player.downloads}</p>
          <p>Bewertungen: ${player.review_count}</p>
          <p>Durchschnitt: ${player.avg_stars} ⭐</p>
          <p>Mitglied seit: ${joinedDate}</p>
          <a href="player.html?id=${player.user_id}">Profil ansehen</a>
        </div>
      `;
    });
  }
}

/* PLAYER PUBLIC PROFILE */

async function loadPlayerProfile() {
  updateNavbar();

  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("id");

  const playerBox = document.getElementById("playerProfile");
  const playerReviews = document.getElementById("playerReviews");

  if (!playerId) {
    playerBox.innerHTML = "<p>Spieler nicht gefunden.</p>";
    return;
  }

  const { data: player, error } = await supabaseClient
    .from("public_community")
    .select("*")
    .eq("user_id", playerId)
    .single();

  if (error || !player) {
    playerBox.innerHTML = "<p>Spieler nicht gefunden.</p>";
    return;
  }

  const joinedDate = new Date(player.created_at).toLocaleDateString("de-DE");

  playerBox.innerHTML = `
    <div class="profile-box">
      <img id="mcAvatar" src="https://mc-heads.net/avatar/${player.mc_name}">
      <h1>${player.mc_name}</h1>
      <p>Downloads: ${player.downloads}</p>
      <p>Bewertungen: ${player.review_count}</p>
      <p>Durchschnitt: ${player.avg_stars} ⭐</p>
      <p>Mitglied seit: ${joinedDate}</p>
    </div>
  `;

  const { data: reviews } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("user_id", playerId)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  playerReviews.innerHTML = "";

  if (!reviews || reviews.length === 0) {
    playerReviews.innerHTML = "<p>Keine öffentlichen Bewertungen.</p>";
    return;
  }

  reviews.forEach(review => {
    playerReviews.innerHTML += `
      <div class="card">
        <h3>${review.plugin_name || "Plugin"}</h3>
        <p class="star">${"★".repeat(review.stars)}${"☆".repeat(5 - review.stars)}</p>
        <p>${review.comment}</p>
      </div>
    `;
  });
}

/* PLUGINS */

async function loadPlugins() {
  updateNavbar();

  const pluginList = document.getElementById("pluginList");
  if (!pluginList) return;

  const { data, error } = await supabaseClient
    .from("plugins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    pluginList.innerHTML = "<p>Plugins konnten nicht geladen werden.</p>";
    return;
  }

  pluginList.innerHTML = "";

  if (data.length === 0) {
    pluginList.innerHTML = "<p>Noch keine Plugins vorhanden.</p>";
    return;
  }

  data.forEach(plugin => {
    pluginList.innerHTML += `
      <div class="card">
        <h3>${plugin.name}</h3>
        <p>${plugin.short_description}</p>
        <p>Version: ${plugin.version}</p>
        <a href="plugin-detail.html?id=${plugin.id}">Weitere Infos</a>
        <br><br>
        <a href="${plugin.download_url}" target="_blank" onclick="downloadPlugin('${plugin.name}')">Download</a>
      </div>
    `;
  });
}

async function downloadPlugin(pluginName) {
  const { data: userData } = await supabaseClient.auth.getUser();

  if (userData.user) {
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("downloads")
      .eq("user_id", userData.user.id)
      .single();

    if (profile) {
      await supabaseClient
        .from("profiles")
        .update({ downloads: profile.downloads + 1 })
        .eq("user_id", userData.user.id);
    }
  }

  alert(pluginName + " Download startet.");
}

/* PLUGIN DETAIL + REVIEWS */

async function loadPluginDetail() {
  updateNavbar();

  const params = new URLSearchParams(window.location.search);
  const pluginId = params.get("id");

  const detail = document.getElementById("pluginDetail");

  if (!pluginId) {
    detail.innerHTML = "<p>Plugin nicht gefunden.</p>";
    return;
  }

  const { data: plugin, error } = await supabaseClient
    .from("plugins")
    .select("*")
    .eq("id", pluginId)
    .single();

  if (error || !plugin) {
    detail.innerHTML = "<p>Plugin nicht gefunden.</p>";
    return;
  }

  detail.innerHTML = `
    <div class="profile-box">
      <h1>${plugin.name}</h1>
      <p><strong>Version:</strong> ${plugin.version}</p>
      <p>${plugin.full_description}</p>
      <br>
      <a href="${plugin.download_url}" target="_blank" onclick="downloadPlugin('${plugin.name}')">Download</a>
    </div>
  `;

  loadReviews(pluginId);
}

async function loadReviews(pluginId) {
  const reviewList = document.getElementById("reviewList");
  if (!reviewList) return;

  const { data } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("plugin_id", pluginId)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  reviewList.innerHTML = "";

  if (!data || data.length === 0) {
    reviewList.innerHTML = "<p>Noch keine Bewertungen vorhanden.</p>";
    return;
  }

  data.forEach(review => {
    reviewList.innerHTML += `
      <div class="card">
        <h3>${review.mc_name}</h3>
        <p class="star">${"★".repeat(review.stars)}${"☆".repeat(5 - review.stars)}</p>
        <p>${review.comment}</p>
      </div>
    `;
  });
}

async function submitReview() {
  const params = new URLSearchParams(window.location.search);
  const pluginId = params.get("id");

  const { data: userData } = await supabaseClient.auth.getUser();

  if (!userData.user) {
    alert("Du musst eingeloggt sein.");
    window.location.href = "login.html";
    return;
  }

  const { data: plugin } = await supabaseClient
    .from("plugins")
    .select("name")
    .eq("id", pluginId)
    .single();

  const stars = Number(document.getElementById("reviewStars").value);
  const comment = document.getElementById("reviewComment").value;
  const mcName = userData.user.user_metadata.mc_name || "Unbekannt";

  if (!comment) {
    alert("Bitte Kommentar schreiben.");
    return;
  }

  const { error } = await supabaseClient.from("reviews").insert({
    plugin_id: pluginId,
    plugin_name: plugin ? plugin.name : "Plugin",
    user_id: userData.user.id,
    mc_name: mcName,
    stars: stars,
    comment: comment,
    approved: false
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Bewertung wurde gesendet und wartet auf Freigabe.");
  document.getElementById("reviewComment").value = "";
}

/* ADMIN */

async function isCurrentUserAdmin() {
  const { data: userData } = await supabaseClient.auth.getUser();

  if (!userData.user) return false;

  const { data } = await supabaseClient
    .from("admins")
    .select("*")
    .eq("user_id", userData.user.id)
    .single();

  return !!data;
}

async function loadAdminPanel() {
  updateNavbar();

  const adminAccess = document.getElementById("adminAccess");
  const adminPanel = document.getElementById("adminPanel");

  const admin = await isCurrentUserAdmin();

  if (!admin) {
    adminAccess.innerHTML = "<h2>Kein Zugriff</h2><p>Du bist kein Admin.</p>";
    return;
  }

  adminAccess.style.display = "none";
  adminPanel.style.display = "block";

  loadPendingReviews();
  loadAdminPlugins();
}

async function addPlugin() {
  const name = document.getElementById("pluginName").value;
  const version = document.getElementById("pluginVersion").value;
  const shortDescription = document.getElementById("pluginShort").value;
  const fullDescription = document.getElementById("pluginFull").value;
  const downloadUrl = document.getElementById("pluginDownload").value;

  if (!name || !version || !shortDescription || !fullDescription || !downloadUrl) {
    alert("Bitte alles ausfüllen.");
    return;
  }

  const { error } = await supabaseClient.from("plugins").insert({
    name: name,
    version: version,
    short_description: shortDescription,
    full_description: fullDescription,
    download_url: downloadUrl
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Plugin gespeichert.");
  location.reload();
}

async function loadAdminPlugins() {
  const adminPlugins = document.getElementById("adminPlugins");

  const { data } = await supabaseClient
    .from("plugins")
    .select("*")
    .order("created_at", { ascending: false });

  adminPlugins.innerHTML = "";

  if (!data || data.length === 0) {
    adminPlugins.innerHTML = "<p>Keine Plugins vorhanden.</p>";
    return;
  }

  data.forEach(plugin => {
    adminPlugins.innerHTML += `
      <div class="card">
        <h3>${plugin.name}</h3>
        <p>${plugin.short_description}</p>
        <button class="danger" onclick="deletePlugin('${plugin.id}')">Plugin löschen</button>
      </div>
    `;
  });
}

async function deletePlugin(pluginId) {
  if (!confirm("Plugin wirklich löschen?")) return;

  const { error } = await supabaseClient
    .from("plugins")
    .delete()
    .eq("id", pluginId);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Plugin gelöscht.");
  loadAdminPlugins();
}

async function loadPendingReviews() {
  const pendingReviews = document.getElementById("pendingReviews");

  const { data } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("approved", false)
    .order("created_at", { ascending: false });

  pendingReviews.innerHTML = "";

  if (!data || data.length === 0) {
    pendingReviews.innerHTML = "<p>Keine offenen Bewertungen.</p>";
    return;
  }

  data.forEach(review => {
    pendingReviews.innerHTML += `
      <div class="card">
        <h3>${review.mc_name}</h3>
        <p>Plugin: ${review.plugin_name || "Plugin"}</p>
        <p class="star">${"★".repeat(review.stars)}${"☆".repeat(5 - review.stars)}</p>
        <p>${review.comment}</p>
        <button onclick="approveReview('${review.id}')">Freigeben</button>
        <button class="danger" onclick="deleteReview('${review.id}')">Löschen</button>
      </div>
    `;
  });
}

async function approveReview(reviewId) {
  const { error } = await supabaseClient
    .from("reviews")
    .update({ approved: true })
    .eq("id", reviewId);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Bewertung freigegeben.");
  loadPendingReviews();
}

async function deleteReview(reviewId) {
  const { error } = await supabaseClient
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Bewertung gelöscht.");
  loadPendingReviews();
}

updateNavbar();
async function loadHomePage() {
  updateNavbar();

  const homePlugins = document.getElementById("homePlugins");
  const homeTopPlayers = document.getElementById("homeTopPlayers");

  const { data: plugins } = await supabaseClient
    .from("plugins")
    .select("*")
    .order("created_at", { ascending: false });

  if (plugins) {
    document.getElementById("homePluginCount").innerText = plugins.length;

    homePlugins.innerHTML = "";

    plugins.slice(0, 3).forEach(plugin => {
      homePlugins.innerHTML += `
        <div class="card">
          <h3>${plugin.name}</h3>
          <p>${plugin.short_description}</p>
          <p>Version: ${plugin.version}</p>
          <a href="plugin-detail.html?id=${plugin.id}">Weitere Infos</a>
        </div>
      `;
    });
  }

  const { data: players } = await supabaseClient
    .from("public_community")
    .select("*")
    .order("downloads", { ascending: false });

  if (players) {
    document.getElementById("homeUserCount").innerText = players.length;

    let totalDownloads = 0;
    players.forEach(player => totalDownloads += player.downloads);
    document.getElementById("homeDownloadCount").innerText = totalDownloads;

    homeTopPlayers.innerHTML = "";

    players.slice(0, 10).forEach((player, index) => {
      homeTopPlayers.innerHTML += `
        <div class="card">
          <h3>#${index + 1} ${player.mc_name}</h3>
          <img class="community-avatar" src="https://mc-heads.net/avatar/${player.mc_name}">
          <p>Downloads: ${player.downloads}</p>
          <p>Bewertungen: ${player.review_count}</p>
          <a href="player.html?id=${player.user_id}">Profil ansehen</a>
        </div>
      `;
    });
  }
}
