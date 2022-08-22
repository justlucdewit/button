let start;

const retrieveStart = () => {
  fetch("/api/state").then((res) =>
    res.json().then((data) => {
      if (data.start != start) {
        updateScoreBoard();
      }
      start = data.start;
    })
  );
};

const secondsToDhms = (seconds=0) => {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600*24));
  const h = Math.floor(seconds % (3600*24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  
  return `${d}d ${h}h ${m}m ${s}s`;
}

const updateScoreBoard = () => {
  fetch("/api/scores").then((res) =>
    res.json().then((data) => {
      const top = document.getElementById("top");
      top.innerHTML = "<tr><th>Place</th><th>Name</th><th>Time</th></tr>";
      data.forEach((e, i) => {
        top.innerHTML += `<tr><td>${i + 1}</td><td>${e.username}</td><td>${
          secondsToDhms(Number(e.score))
        }</td></tr>`;
      });
    })
  );
};

const updateTimer = () => {
  window.setInterval(() => {
    const delta = Math.floor(new Date().getTime() / 1000) - start;
    const sec = delta % 60;
    const min = Math.floor((delta / 60) % 60);
    const hour = Math.floor(delta / 3600);

    document.getElementById("sec").innerText = sec < 10 ? "0" + sec : sec;
    document.getElementById("min").innerText = min < 10 ? "0" + min : min;
    document.getElementById("hour").innerText = hour;
    document.getElementById("time").style.visibility = "visible";
  }, 500);
};

retrieveStart();
updateTimer();

const clickButton = () => {
  name = document.getElementById("name").value;

  if (name.length > 20) {
    alert("name may not be more then 20 characters long");
    return;
  }

  if (new Date() / 1000 - start < 300) {
    alert("you may not press the button before the timer is at least on 5 min");
    return;
  }

  if (!Boolean(/^[a-z0-9 ]+$/i.exec(name))) {
    alert("name must only contain a-z A-Z or 0-9");
    return;
  }

  fetch(`/api/press/${name}`);
  retrieveStart();
  updateTimer();
};

setInterval(retrieveStart, 2000);

document.getElementById("btn").onclick = clickButton;
