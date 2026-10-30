# Portfolio di Alessio

Sito statico: nessuna build. Netlify lo pubblica così com'è.

```
index.html        contenuto della pagina
css/stile.css     stili (design system in cima al file)
js/scena.js       oggetto 3D (Three.js), espone window.Scena
js/animazioni.js  caricamento, scroll fluido, animazioni allo scroll, menu mobile, cursore, terminale
js/footer.js      footer a mezzetinte
fonts/            Geist, Instrument Sans, Geist Mono (woff2)
vendor/           Three.js r160, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13
lavori/           screenshot dei progetti (vedi lavori/LEGGIMI.txt)
```

In locale aprilo con un server (per esempio Live Server di VS Code o `npx serve`):
con il doppio clic su `index.html` il browser blocca il caricamento dei font.
