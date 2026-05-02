document.addEventListener('DOMContentLoaded', () => {

  // Pega todos os elementos "navbar-burger"
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Verifica se existem burgers
  if ($navbarBurgers.length > 0) {

    // Adiciona um evento de clique em cada um deles
    $navbarBurgers.forEach( el => {
      el.addEventListener('click', () => {

        // Pega o alvo do atributo "data-target" (id: navbarMenu)
        const target = el.dataset.target;
        const $target = document.getElementById(target);

        // Alterna a classe "is-active" tanto no botão quanto no menu
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }
});