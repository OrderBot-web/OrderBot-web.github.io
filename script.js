// ===== MATRIX ANIMATION =====
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);
function draw(){ctx.fillStyle="rgba(0,0,0,0.05)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#00ff9d";ctx.font=fontSize+"px monospace";for(let i=0;i<drops.length;i++){const text=letters[Math.floor(Math.random()*letters.length)];ctx.fillText(text,i*fontSize,drops[i]*fontSize);if(drops[i]*fontSize>canvas.height && Math.random()>0.975)drops[i]=0;drops[i]++;}}setInterval(draw,35);

// ===== LOGIN DISCORD & VERIFY SERVER =====
const CLIENT_ID="1471875353885675725";
const REDIRECT_URI="https://orderbot-web.github.io/";
const SCOPE="identify guilds";
const SERVER_ID="TUO_SERVER_ID"; // Inserisci il tuo server
const loginBtn=document.getElementById("loginBtn");
loginBtn.addEventListener("click",()=>{window.location.href=`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${SCOPE}`;});
function getTokenFromURL(){if(window.location.hash){const hash=window.location.hash.substring(1);const params=new URLSearchParams(hash);return params.get("access_token");}return null;}
const token=getTokenFromURL();
if(token){
  // fetch user
  fetch("https://discord.com/api/users/@me",{headers:{Authorization:`Bearer ${token}`}}).then(res=>res.json()).then(user=>{
    window.discordUser=user;
    document.getElementById("loginNick").innerText=`Log In with: ${user.username}`;
  });
  // fetch guilds
  fetch("https://discord.com/api/users/@me/guilds",{headers:{Authorization:`Bearer ${token}`}}).then(res=>res.json()).then(guilds=>{
    const isMember=guilds.some(g=>g.id===SERVER_ID);
    window.inServer=isMember;
    if(!isMember){alert("Devi entrare nel nostro server Discord prima di ordinare!");document.getElementById("formScreen").style.display="none";}
    else{document.getElementById("mainScreen").style.display="block";document.getElementById("navbar").style.display="flex";}
  });
}

// ===== SCROLL NAVBAR =====
function scrollToSection(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth'});}

// ===== QUADRATI BOT CLICK =====
document.getElementById("configBot").addEventListener("click",()=>{document.getElementById("botFormTitle").innerText="Configura Bot";document.getElementById("budgetField").placeholder="Inserisci Budget";document.getElementById("formScreen").style.display="block";});
document.getElementById("hostBot").addEventListener("click",()=>{document.getElementById("botFormTitle").innerText="Host Bot H24";document.getElementById("budgetField").placeholder="Inserisci Budget";document.getElementById("formScreen").style.display="block";});

// ===== WEBHOOK + LIMIT ORDINI =====
let orderCount=0;
const webhookURL="https://discord.com/api/v10/webhooks/1482382897653616702/Ev1BX-4HhdqzrR6EuAty_IlMdZr0H2GOCg0gIBiN71tOQQbdbpC-dxugO8XxWEQNttzW";
document.getElementById("orderForm").addEventListener("submit",async function(e){
  e.preventDefault();
  if(!window.inServer) return alert("Non sei nel server Discord, non puoi ordinare!");
  if(orderCount>=5) return alert("Hai raggiunto il limite massimo di 5 ordini!");
  const data={botName:document.getElementById("botName").value,description:document.getElementById("description").value,budget:document.getElementById("budgetField").value};
  await fetch(webhookURL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({embeds:[{title:"📦 Nuovo Ordine Bot",color:0x00ff9d,fields:[{name:"🤖 Nome Bot",value:data.botName},{name:"📄 Descrizione",value:data.description||"N/A"},{name:"💰 Budget",value:data.budget||"N/A"},{name:"👤 Utente",value:`${window.discordUser.username}#${window.discordUser.discriminator} (${window.discordUser.id})`}],timestamp:new Date().toISOString()}]})});
  orderCount++;
  alert("Ordine inviato!");
  document.getElementById("orderForm").reset();
});

// ===== PULSANTE DISCORD BASSO =====
document.getElementById("joinDiscord").addEventListener("click",()=>{window.open("https://discord.gg/AAMypkTzeB","_blank");});
