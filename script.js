const SUPABASE_URL = "https://fvoqwqarrlewwonzsydh.supabase.co";
const SUPABASE_KEY = "sb_publishable_78UTQOor9uK3v_sDHF0YgA_Xgli01AM";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/* =========================
   DOWNLOAD COUNTER
========================= */

async function downloadPlugin(pluginName) {
  let downloads = localStorage.getItem("downloads");

  if (!downloads) {
    downloads = 0;
  }

  downloads++;
  localStorage.setItem("downloads", downloads);

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

  alert(pluginName + " Download startet bald!");
}

function updateDownloadCounter() {
  const counter = document.getElementById("downloadCount");

  if (counter) {
    const downloads = localStorage.getItem("downloads") || 0;
    counter.innerText = downloads;
  }
}

/* =========================
   REGISTER / LOGIN
========================= */

async function register() {
  if (!supabaseClient) {
    alert("Supabase ist noch nicht verbunden.");
    return;
  }

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

  alert("Account erstellt. Du wirst jetzt zum Profil weitergeleitet.");

  await loginAfterRegister(email, password);
}

async function loginAfterRegister(email, password) {
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (!error) {
    window.location.href = "profile.html";
  }
}

async function login() {
  if (!supabaseClient) {
    alert("Supabase ist noch nicht verbunden.");
    return;
  }

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
  if (!supabaseClient) {
    return;
  }

  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

/* =========================
   NAVBAR
========================= */

async function updateNavbar() {
  if (!supabaseClient) {
    return;
  }

  const loginNav = document.getElementById("loginNav");
  const profileNav = document.getElementById("profileNav");
  const navAvatar = document.getElementById("navAvatar");

  if (!loginNav || !profileNav || !navAvatar) {
    return;
  }

  const { data } = await supabaseClient.auth.getUser();

  if (data.user) {
    const mcName = data.user.user_metadata.mc_name || "Steve";

    loginNav.style.display = "none";
    profileNav.style.display = "inline-block";
    navAvatar.src = "https://mc-heads.net/avatar/" + mcName;
  } else {
    loginNav.style.display = "inline-block";
    profileNav.style.display = "none";
  }
}

/* =========================
   PROFILE
========================= */

async function loadProfile() {
  updateNavbar();

  if (!supabaseClient) {
    document.getElementById("profileName").innerText = "Supabase nicht verbunden";
    return;
  }

  const { data: userData } = await supabaseClient.auth.getUser();

  if (!userData.user) {
    document.getElementById("profileName").innerText = "Nicht eingeloggt";
    document.getElementById("profileEmail").innerText = "Bitte logge dich zuerst ein.";
    return;
  }

  const email = userData.user.email;
  const mcName = userData.user.user_metadata.mc_name || "Steve";

  document.getElementById("profileName").innerText = mcName;
  document.getElementById("profileEmail").innerText = email;
  document.getElementById("mcAvatar").src = "https://mc-heads.net/avatar/" + mcName;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", userData.user.id)
    .single();

  if (profile && document.getElementById("profileDownloads")) {
    document.getElementById("profileDownloads").innerText = profile.downloads;
  }

  loadMyReviews(userData.user.id);
}

async function loadMyReviews(userId) {
  const myReviews = document.getElementById("myReviews");

  if (!myReviews) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    myReviews.innerHTML = "<p>Bewertungen konnten nicht geladen werden.</p>";
    return;
  }

  if (data.length === 0) {
    myReviews.innerHTML = "<p>Du hast noch keine Bewertungen geschrieben.</p>";
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

/* =========================
   COMMUNITY
========================= */

async function loadCommunity() {
  updateNavbar();

  const communityList = document.getElementById("communityList");

  if (!communityList) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("public_community")
    .select("*")
    .order("downloads", { ascending: false });

  if (error) {
    communityList.innerHTML = "<p>Community konnte nicht geladen werden.</p>";
    return;
  }

  if (data.length === 0) {
    communityList.innerHTML = "<p>Noch keine Spieler registriert.</p>";
    return;
  }

  communityList.innerHTML = "";

  data.forEach(player => {
    const joinedDate = new Date(player.created_at).toLocaleDateString("de-DE");

    communityList.innerHTML += `
      <div class="card">
        <img class="community-avatar" src="https://mc-heads.net/avatar/${player.mc_name}" alt="${player.mc_name}">
        <h3>${player.mc_name}</h3>
        <p>Downloads: ${player.downloads}</p>
        <p>Bewertungen: ${player.review_count}</p>
        <p>Durchschnitt: ${player.avg_stars} ⭐</p>
        <p>Mitglied seit: ${joinedDate}</p>
      </div>
    `;
  });
}

/* =========================
   PLUGINS
========================= */

async function loadPlugins() {
  updateNavbar();

  const pluginList = document.getElementById("pluginList");

  if (!pluginList) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("plugins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    pluginList.innerHTML = "<p>Plugins konnten nicht geladen werden.</p>";
    return;
  }

  pluginList.innerHTML = "";

  data.forEach(plugin => {
    pluginList.innerHTML += `
      <div class="card">
        <h3>${plugin.name}</h3>
        <p>${plugin.short_description}</p>
        <span>Version: ${plugin.version}</span>
        <br><br>
        <a href="plugin-detail.html?id=${plugin.id}">Weitere Infos</a>
        <br><br>
        <a href="${plugin.download_url}" target="_blank" onclick="downloadPlugin('${plugin.name}')">Download</a>
      </div>
    `;
  });
}

/* =========================
   PLUGIN DETAILS + REVIEWS
========================= */

async function loadPluginDetail() {
  updateNavbar();

  const params = new URLSearchParams(window.location.search);
  const pluginId = params.get("id");

  if (!pluginId) {
    return;
  }

  const { data: plugin, error } = await supabaseClient
    .from("plugins")
    .select("*")
    .eq("id", pluginId)
    .single();

  if (error || !plugin) {
    document.getElementById("pluginDetail").innerHTML = "<p>Plugin nicht gefunden.</p>";
    return;
  }

  document.getElementById("pluginDetail").innerHTML = `
    <h1>${plugin.name}</h1>
    <p><strong>Version:</strong> ${plugin.version}</p>
    <p>${plugin.full_description}</p>
    <br>
    <a href="${plugin.download_url}" target="_blank" onclick="downloadPlugin('${plugin.name}')">Download</a>
  `;

  loadReviews(pluginId);
}

async function loadReviews(pluginId) {
  const reviewList = document.getElementById("reviewList");

  if (!reviewList) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("plugin_id", pluginId)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    reviewList.innerHTML = "<p>Bewertungen konnten nicht geladen werden.</p>";
    return;
  }

  if (data.length === 0) {
    reviewList.innerHTML = "<p>Noch keine Bewertungen vorhanden.</p>";
    return;
  }

  reviewList.innerHTML = "";

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

  const stars = document.getElementById("reviewStars").value;
  const comment = document.getElementById("reviewComment").value;
  const mcName = userData.user.user_metadata.mc_name || "Unbekannt";

  if (!comment) {
    alert("Bitte Kommentar schreiben.");
    return;
  }

  const { error } = await supabaseClient
    .from("reviews")
    .insert({
      plugin_id: pluginId,
      plugin_name: plugin ? plugin.name : "Plugin",
      user_id: userData.user.id,
      mc_name: mcName,
      stars: Number(stars),
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

/* =========================
   ADMIN
========================= */

async function isCurrentUserAdmin() {
  if (!supabaseClient) return false;

  const { data: userData } = await supabaseClient.auth.getUser();

  if (!userData.user) return false;

  const { data, error } = await supabaseClient
    .from("admins")
    .select("*")
    .eq("user_id", userData.user.id)
    .single();

  return !!data && !error;
}

async function loadAdminPanel() {
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

  const { error } = await supabaseClient
    .from("plugins")
    .insert({
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

async function loadPendingReviews() {
  const pendingReviews = document.getElementById("pendingReviews");

  const { data, error } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("approved", false)
    .order("created_at", { ascending: false });

  if (error) {
    pendingReviews.innerHTML = "<p>Bewertungen konnten nicht geladen werden.</p>";
    return;
  }

  if (data.length === 0) {
    pendingReviews.innerHTML = "<p>Keine offenen Bewertungen.</p>";
    return;
  }

  pendingReviews.innerHTML = "";

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

async function loadAdminPlugins() {
  const adminPlugins = document.getElementById("adminPlugins");

  const { data, error } = await supabaseClient
    .from("plugins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    adminPlugins.innerHTML = "<p>Plugins konnten nicht geladen werden.</p>";
    return;
  }

  adminPlugins.innerHTML = "";

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

/* =========================
   START
========================= */

updateDownloadCounter();
updateNavbar();
