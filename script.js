// MATRIX ANIMATION
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
    ctx.fillText(text,i*fontSize,drops[i]*fontSize);
    if(drops[i]*fontSize>canvas.height && Math.random()>0.975)drops[i]=0;
    drops[i]++;
  }
}
setInterval(draw,35);

// VARIABILI
const SERVER_ID = "1477043614453596314";
let orderCount=0;
const webhookURL="https://discord.com/api/v10/webhooks/1482382897653616702/Ev1BX-4HhdqzrR6EuAty_IlMdZr0H2GOCg0gIBiN71tOQQbdbpC-dxugO8XxWEQNttzW";

// ELEMENTI
const loginBtn=document.getElementById("loginBtn");
const joinDiscord=document.getElementById("joinDiscord");
const serverWarning=document.getElementById("serverWarning");
const loginPage=document.getElementById("loginPage");
const navbar=document.getElementById("navbar");
const pages=document.querySelectorAll(".page");

// LOGIN SIMULATO
loginBtn.addEventListener("click",()=>{
  // Simula login e verifica server
  const inServer=confirm("Sei nel server Discord? Premi OK se sì.");
  if(!inServer){
    serverWarning.style.display="block";
    return;
  }
  loginPage.style.display="none";
  navbar.style.display="flex";
  showPage("orderBotPage");
  document.getElementById("loginNick").innerText="Log In with: Pasquitos";
});

// PULSANTE ENTRA DISCORD
joinDiscord.addEventListener("click",()=>{window.open("https://discord.gg/AAMypkTzeB","_blank");});

// MOSTRA PAGINA
function showPage(id){
  pages.forEach(p=>p.style.display="none");
  const el=document.getElementById(id);
  if(el) el.style.display="flex";
}

// CLICK BOT
document.getElementById("configBot").addEventListener("click",()=>{
  showPage("formPage");
  document.getElementById("formTitle").innerText="Configura Bot";
});
document.getElementById("hostBot").addEventListener("click",()=>{
  showPage("formPage");
  document.getElementById("formTitle").innerText="Host Bot H24";
});

// FORM + WEBHOOK + LIMIT
document.getElementById("orderForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(orderCount>=5) return alert("Hai raggiunto il limite massimo di 5 ordini!");
  const data={
    botName:document.getElementById("botName").value,
    description:document.getElementById("description").value,
    budget:document.getElementById("budgetField").value
  };
  await fetch(webhookURL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({embeds:[{title:"📦 Nuovo Ordine Bot",color:0x00ff9d,fields:[
      {name:"🤖 Nome Bot",value:data.botName},
      {name:"📄 Descrizione",value:data.description||"N/A"},
      {name:"💰 Budget",value:data.budget||"N/A"},
      {name:"👤 Utente",value:"Pasquitos"}
    ],timestamp:new Date().toISOString()}]})
  });
  orderCount++;
  alert("Ordine inviato!");
  document.getElementById("orderForm").reset();
});
