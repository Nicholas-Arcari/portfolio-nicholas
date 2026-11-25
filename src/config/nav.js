// Le voci del menu del sito, in un posto solo: le usano il menu in alto di ogni
// pagina (src/components/SiteNav.jsx) e quello a scomparsa del telefono.
// `id` serve a evidenziare la voce della pagina in cui si e'; una voce con
// `children` e' un sottomenu, una con `href` porta fuori dal sito.
export const NAV = [
  { id: 'home', to: '/', icon: 'icon solid fa-home', label: 'nav.home' },
  { id: 'about', to: '/about', icon: 'icon solid fa-user', label: 'nav.about' },
  {
    id: 'passions',
    icon: 'icon solid fa-glass-cheers',
    label: 'nav.passions',
    children: [
      { to: '/ricette', label: 'nav.recipes' },
      { to: '/cocktail', label: 'nav.cocktails' },
      { to: '/stampe3d', label: 'nav.prints3d' },
      { to: '/galleria', label: 'nav.gallery' },
    ],
  },
  { id: 'github', href: 'https://github.com/Nicholas-Arcari', icon: 'icon brands fa-github', label: 'nav.github' },
];
