// Admin menus switch on the client: the data is already loaded, so changing the URL with
// pushState (Next keeps usePathname in sync) shows the next screen instantly, no server round trip.
export const go = e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let new-tab clicks through
  e.preventDefault();
  history.pushState(null, '', e.currentTarget.getAttribute('href'));
  scrollTo(0, 0);
};

export const isActive = (path, href) => (href === '/admin/' ? path === href || path === '/admin' : path.startsWith(href));
