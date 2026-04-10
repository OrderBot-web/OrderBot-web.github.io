const API = "http://localhost:3000";

function save(){
  fetch(API + "/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      guildId: document.getElementById("guild").value,
      color: document.getElementById("color").value,
      description: document.getElementById("desc").value
    })
  });

  alert("Salvato!");
}
