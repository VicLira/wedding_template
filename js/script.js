// Defina a data do casamento aqui
const dataCasamento = new Date("Dec 31, 2026 18:00:00").getTime();

const timer = setInterval(function() {
    const agora = new Date().getTime();
    const distancia = dataCasamento - agora;

    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

    document.getElementById("days").innerHTML = dias;
    document.getElementById("hours").innerHTML = horas;
    document.getElementById("minutes").innerHTML = minutos;
    document.getElementById("seconds").innerHTML = segundos;

    if (distancia < 0) {
        clearInterval(timer);
        document.getElementById("countdown").innerHTML = "É HOJE!";
    }
}, 1000);