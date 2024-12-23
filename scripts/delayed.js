// add delayed functionality here
function decorateExternalLinks(links) {
  links.forEach((link) => link.setAttribute('target', '_self'));
}

const externalLinks = document.querySelectorAll('a[href]');
decorateExternalLinks(externalLinks);
