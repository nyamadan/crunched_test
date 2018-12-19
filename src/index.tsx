import * as React from "react";
import * as ReactDOM from "react-dom";

import { ImageCanvas } from "./components/ImageCanvas";
import { Crunch } from "./crunch";

async function main() {
  await Crunch.initialize();

  const container = document.createElement("div");
  document.body.appendChild(container);

  ReactDOM.render(
    <React.Fragment>
      <h2>JPG</h2>
      <ImageCanvas src={{path: "./assets/jinja.jpg", type: "img"}} />
      <h2>DXT1</h2>
      <ImageCanvas src={{path: "./assets/jinja.dxt1.crn", type: "dxt1"}} />
      <h2>DXT5</h2>
      <ImageCanvas src={{path: "./assets/jinja.dxt5.crn", type: "dxt5"}} />
      <h2>ETC2</h2>
      <ImageCanvas src={{path: "./assets/jinja.etc2.crn", type: "etc2"}} />
    </React.Fragment>,
    container);
}

main();
