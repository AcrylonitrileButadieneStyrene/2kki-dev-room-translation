// ==UserScript==
// @name        YNO 2kki Dev Room Translation
// @match       https://ynoproject.net/*
// @version     0.1.0
// @grant       unsafeWindow
// @downloadURL https://raw.githubusercontent.com/AcrylonitrileButadieneStyrene/2kki-dev-room-translation/master/yno-2kki-dev-room-translation.user.js
// @supportURL  https://github.com/AcrylonitrileButadieneStyrene/2kki-dev-room-translation/issues
// @homepageURL https://github.com/AcrylonitrileButadieneStyrene/2kki-dev-room-translation/blob/master/README.md
// @run-at      document-start
// ==/UserScript==

// TODO: a way to change this without it getting overritten by updates
const baseUrl = "https://cdn.jsdelivr.net/gh/AcrylonitrileButadieneStyrene/2kki-dev-room-translation/";

let overrides;
fetch(baseUrl + "overrides.json")
  .then(resp => resp.json())
  .then(json => {
    let traverse;
    (traverse = item => {
      for (const [key, value] of Object.entries(item))
        if (typeof value != "string")
          traverse(value);
        else if (!value.startsWith("https://"))
          item[key] = baseUrl + value;
    })(json);

    overrides = json;
    indexFile?.send();
  });

let indexFile;
const original = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(_, path) {
  const position = path.indexOf("https://");
  if (position != -1)
    arguments[1] = path.substring(position);
  original.apply(this, arguments);

  if (path == "/data/2kki/./index.json") {
    indexFile = this;
    this.addEventListener("readystatechange", () => {
      if (this.readyState != 4)
        return;

      const index = JSON.parse(new TextDecoder().decode(this.response));
      Object.assign(index, overrides);
      const replacement = new TextEncoder().encode(JSON.stringify(index)).buffer;
      Object.defineProperty(this, "response", {
        get: () => replacement,
        configurable: true,
      });
    });
  }
};

const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function() {
  if (this == indexFile && !overrides)
    return;
  return originalSend.apply(this, arguments);
};

