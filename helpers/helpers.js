/* eslint-disable import/prefer-default-export */
// Function to remove empty elements based on selector
export function removeEmptyElements(selector) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element) => {
    // Check if the element has child nodes
    if (element.children.length === 0) {
      element.remove();
    }
  });
}
