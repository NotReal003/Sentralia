export async function onRequest(context) {
  const response = await context.next();

  return new HTMLRewriter()
    .on('title', {
      element(e) { e.setInnerContent('Request | NotReal003'); }
    })
    .on('meta[property="og:description"]', {
      element(e) { e.setAttribute('content', 'We want to make sure you have the best experience possible. If you’re having any issues, please reach out! '); }
    })
    .on('meta[property="og:image"]', {
      element(e) { e.setAttribute('content', 'https://request.notreal003.org/IMG_3231.png'); }
    })
    .on('meta[property="og:url"]', {
      element(e) { e.setAttribute('content', 'https://notreal003.org/support'); }
    })
    .on('meta[property="og:title"]', {
      element(e) { e.setAttribute('content', 'Request | NotReal003'); }
    })
    .on('meta[name="theme-color"]', {
      element(e) { e.setAttribute('content', '#3252FD'); }
    })
    .transform(response);
}
