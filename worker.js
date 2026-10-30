const PREFIX = "/stilllabs";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path !== PREFIX && !path.startsWith(PREFIX + "/")) {
      return fetch(request);
    }

    let assetPath = path.slice(PREFIX.length);
    if (assetPath === "" || assetPath === "/") assetPath = "/index.html";
    url.pathname = assetPath;
    return env.ASSETS.fetch(new Request(url, request));
  },
};
