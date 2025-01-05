// add delayed functionality here
function decorateExternalLinks(links) {
  const { origin } = new URL(window.document.location);
  links.forEach((link) => {
    const { origin: linkOrigin } = new URL(link.href);
    if (linkOrigin && origin !== linkOrigin) {
      link.setAttribute('target', '_self');
    }
  });
}

const externalLinks = document.querySelectorAll('a[href]');
decorateExternalLinks(externalLinks);
