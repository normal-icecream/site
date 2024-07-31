// add delayed functionality here
function decorateExternalLinks(links) {
  links.forEach((link) => link.setAttribute('target', '_blank'));
}

const externalLinks = document.querySelectorAll('a[href]');
decorateExternalLinks(externalLinks);
