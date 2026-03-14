document.getElementById("orderForm").addEventListener("submit", async function(e){
  e.preventDefault();

  const data = {
    botName: document.getElementById("botName").value,
    description: document.getElementById("description").value,
    features: document.getElementById("features").value,
    contact: document.getElementById("contact").value
  };

  // Invio diretto al webhook Discord (solo per test privati)
  await fetch("https://discord.com/api/v10/webhooks/1482382897653616702/Ev1BX-4HhdqzrR6EuAty_IlMdZr0H2GOCg0gIBiN71tOQQbdbpC-dxugO8XxWEQNttzW", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: `
📦 NUOVO ORDINE BOT

🤖 Nome Bot: ${data.botName}
📄 Descrizione: ${data.description}
⚙️ Funzioni: ${data.features}
📞 Contatto: ${data.contact}
      `
    })
  });

  alert("Ordine inviato al tuo server Discord!");
});
