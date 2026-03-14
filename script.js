// ===== MATRIX ANIMATION =====
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);
function draw() {
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#00ff9d";
  ctx.font = fontSize + "px monospace";
  for(let i=0;i<drops.length;i++){
    const text = letters[Math.floor(Math.random()*letters.length)];
    ctx.fillText(text,i * fontSize, drops[i]*fontSize);
    if(drops[i]*fontSize > canvas.height && Math.random() > 0.975) drops[i]=0;
    drops[i]++;
  }
}
setInterval(draw,35);

// ===== LOGIN DISCORD =====
const CLIENT_ID = "1471875353885675725";
const REDIRECT_URI = "https://orderbot-web.github.io/"; // deve corrispondere esattamente a Discord Developer Portal
const SCOPE = "identify";
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", ()=>{
  const oauthURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${SCOPE}`;
  window.location.href = oauthURL;
});

// ===== OTTIENI TOKEN DAL URL =====
function getTokenFromURL(){
  if(window.location.hash){
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get("access_token");
  }
  return null;
}

const token = getTokenFromURL();

if(token){
  document.getElementById("startScreen").style.display="none";
  document.getElementById("formScreen").style.display="block";

  // ===== FETCH DATI UTENTE DISCORD =====
  fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(user => {
    window.discordUser = { id:user.id, username:user.username, discriminator:user.discriminator };

    // Mostra top bar con nickname
    document.getElementById("discordNick").innerText = `${user.username}#${user.discriminator}`;
    document.getElementById("topBar").style.display="flex";
  });
}

// ===== WEBHOOK DISCORD - EMBED =====
const webhookURL = "https://discord.com/api/v10/webhooks/1482382897653616702/Ev1BX-4HhdqzrR6EuAty_IlMdZr0H2GOCg0gIBiN71tOQQbdbpC-dxugO8XxWEQNttzW";
    
document.getElementById("orderForm").addEventListener("submit", async function(e){
  e.preventDefault();
  if(!window.discordUser) return alert("Devi fare login Discord!");
  const data = {
    botName: document.getElementById("botName").value,
    description: document.getElementById("description").value,
    features: document.getElementById("features").value
  };

  await fetch(webhookURL,{
    method:"POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "📦 Nuovo Ordine Bot",
        color: 0x00ff9d,
        fields: [
          { name:"🤖 Nome Bot", value: data.botName },
          { name:"📄 Descrizione", value: data.description || "N/A"},
          { name:"⚙️ Funzioni", value: data.features || "N/A"},
          { name:"👤 Utente", value: `${window.discordUser.username}#${window.discordUser.discriminator} (${window.discordUser.id})` }
        ],
        timestamp: new Date().toISOString()
      }]
    })
  });

  alert("Ordine inviato!");
  document.getElementById("orderForm").reset();
});

// ===== PULSANTE "Entra nel nostro Discord" =====
document.getElementById("joinDiscord").addEventListener("click", ()=>{
  window.open("https://discord.gg/AAMypkTzeB","_blank");
});
