
setTimeout(function(){
  var sc = document.createElement("script");
  sc.type = "text/javascript";
  sc.textContent = `
$include(./injected.js)
`;
  document.body.appendChild(sc);
}, 300);
