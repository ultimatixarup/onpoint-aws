 {
  // Add the class to hide specific elements
  document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.devtools-hidden');
    elements.forEach(el => el.classList.add('devtools-hidden'));
  });
}
