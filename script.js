const SUPABASE_URL = "https://fvoqwqarrlewwonzsydh.supabase.co";
const SUPABASE_KEY = "sb_publishable_78UTQOor9uK3v_sDHF0YgA_Xgli01AM";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function downloadPlugin(pluginName) {
  let downloads = localStorage.getItem("downloads");

  if (!downloads) {
    downloads = 0;
  }

  downloads++;
  localStorage.setItem("downloads", downloads);

  alert(pluginName + " Download startet bald!");

  /*
    Hier später deinen echten Download-Link einfügen.
    Beispiel:
    window.location.href = "https://github.com/DEINNAME/DEINREPO/releases/download/v1.0/plugin.jar";
  */
}

function updateDownloadCounter() {
  const counter = document.getElementById("downloadCount");

  if (counter) {
    const downloads = localStorage.getItem("downloads") || 0;
    counter.innerText = downloads;
  }
}

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

  alert("Account erstellt. Du wirst jetzt zum Profil weitergeleitet.");

  await loginAfterRegister(email, password);
}

async function loginAfterRegister(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
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

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "profile.html";
}

async function loadProfile() {
  if (!supabaseClient) {
    document.getElementById("profileName").innerText = "Supabase nicht verbunden";
    return;
  }

  const { data } = await supabaseClient.auth.getUser();

  if (!data.user) {
    document.getElementById("profileName").innerText = "Nicht eingeloggt";
    document.getElementById("profileEmail").innerText = "Bitte logge dich zuerst ein.";
    return;
  }

  const email = data.user.email;
  const mcName = data.user.user_metadata.mc_name || "Steve";

  document.getElementById("profileName").innerText = mcName;
  document.getElementById("profileEmail").innerText = email;
  document.getElementById("mcAvatar").src = "https://mc-heads.net/avatar/" + mcName;
}

async function logout() {
  if (!supabaseClient) {
    return;
  }

  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

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

updateDownloadCounter();
updateNavbar();
