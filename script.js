function ativaLetra(elemento) {
    const arrTexto = elemento.innerHTML.split('');
    elemento.innerHTML = '';
    arrTexto.forEach((letra, i) => {
      setTimeout(() => {
        elemento.innerHTML += letra;
      }, 30 * i);
    });
  }
  
  function animaDigitando(elemento, espera = 1000) {
    ativaLetra(elemento);
    setTimeout(() => {
      animaDigitando(elemento, espera);
    }, elemento.innerHTML.length * 30 + espera);
  }
  
  const titulo = document.querySelector('.digitando');
  animaDigitando(titulo);
  
  function menuMobol(){
    const ativaMenu = document.querySelector('.fa-bars');
    const navMenu = document.querySelector('header .navegacao');


    ativaMenu .addEventListener('click', ()=>{
    ativaMenu.classList.toggle('fa-x')
    navMenu.classList.toggle('ativado')
  })
  }

  menuMobol();