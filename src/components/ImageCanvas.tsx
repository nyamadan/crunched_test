import * as React from "react";
import * as ReactDOM from "react-dom";

import * as twgl from "twgl.js";

import { Crunch } from "../crunch";

const VertexShader = `
attribute vec4 position;

void main() {
  gl_Position = position;
}
`;

const FragmentShader = `
precision mediump float;

uniform sampler2D tex;
uniform vec2 resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec4 color = texture2D(tex, uv);
  gl_FragColor = vec4(color.rgb, 1.0 );
}
`;

interface IProps {
  src?: IImageCanvasSrc;
  onload?: () => void;
}

interface IState {
  width: number;
  height: number;
}

export interface IImageCanvasSrc {
  path: string;
  type: "img" | "dxt1" | "dxt5" | "etc2";
}

export class ImageCanvas extends React.Component<IProps, IState> {
  private el: HTMLCanvasElement = null;
  private gl: WebGL2RenderingContext = null;

  private s3tc: WEBGL_compressed_texture_s3tc = null;
  private etc: WEBGL_compressed_texture_etcPrototype = null;

  private tex: WebGLTexture = null;

  private programInfo: twgl.ProgramInfo;
  private bufferInfo: twgl.BufferInfo;

  private crunch: Crunch;

  public constructor(props: IProps, context?: any) {
    super(props, context);
    this.crunch = new Crunch();
    this.state = { width: 32, height: 32 };
  }

  public componentDidUpdate(prevProps: IProps) {
    if (this.props.src !== prevProps.src) {
      this.load(this.props.src);
    }
  }

  public componentDidMount() {
    const gl = this.gl = this.el.getContext("webgl2") as WebGL2RenderingContext;

    const programInfo = twgl.createProgramInfo(gl, [
      VertexShader,
      FragmentShader,
    ]);

    const arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    const s3tc: WEBGL_compressed_texture_s3tc = gl.getExtension( "WEBGL_compressed_texture_s3tc");
    const etc: WEBGL_compressed_texture_etcPrototype = gl.getExtension("WEBGL_compressed_texture_etc");

    this.s3tc = s3tc;
    this.etc = etc;
    this.programInfo = programInfo;
    this.bufferInfo = bufferInfo;

    this.onRequestAnimationFrame = this.onRequestAnimationFrame.bind(this);

    this.load(this.props.src);
    requestAnimationFrame(this.onRequestAnimationFrame);
  }

  public render() {
    return <canvas width={this.state.width} height={this.state.height} ref={(el) => (this.el = el)} />;
  }

  private onRequestAnimationFrame() {
    const { gl, tex, programInfo, bufferInfo } = this;
    const width = this.state.width;
    const height = this.state.height;
    const resolution = new Float32Array([width, height]);
    const uniforms = { tex, resolution };

    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (this.tex != null) {
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(this.onRequestAnimationFrame);
  }

  private async loadCrunchedImage(src: IImageCanvasSrc) {
    const { etc, s3tc } = this;
    let format: number = 0;

    switch (src.type) {
      case "dxt1":
        if (!s3tc) {
          throw new Error("Unsupported format: COMPRESSED_RGBA_S3TC_DXT1_EXT");
        }

        format = s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT;

        break;
      case "dxt5":
        if (!s3tc) {
          throw new Error("Unsupported format: COMPRESSED_RGBA_S3TC_DXT5_EXT");
        }

        format = s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT;

        break;
      case "etc2":
        if (!etc) {
          throw new Error("Unsupported format: COMPRESSED_RGB8_ETC2");
        }

        format = etc.COMPRESSED_RGB8_ETC2;

        break;
    }

    await this.crunch.load(src.path);

    const { props, gl } = this;
    const { onload } = props;

    const width = this.crunch.getWidth();
    const height = this.crunch.getHeight();
    const data = this.crunch.getBuffer(0);

    if (this.tex == null) {
      this.tex = gl.createTexture();
    }

    const { tex } = this;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.compressedTexImage2D(
      gl.TEXTURE_2D,
      0,
      format,
      width,
      height,
      0,
      data,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.setState({ width, height });

    if (onload != null) {
      onload();
    }
  }

  private async fetchImage(src: string) {
    const image = new Image();

    await new Promise((resolve) => {
      image.src = src;

      if (image.complete) {
        resolve();
        return;
      }

      image.addEventListener("load", resolve);
    });

    return image;
  }

  private async loadImage(src: IImageCanvasSrc) {
    const image = await this.fetchImage(src.path);

    const {width, height} = image;

    const { gl, props } = this;
    const {onload} = props;

    if (this.tex == null) {
      this.tex = gl.createTexture();
    }

    const { tex } = this;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.setState({ width, height });

    if (onload != null) {
      onload();
    }
  }

  private clearImage() {
    const { gl } = this;

    if (this.tex) {
      gl.deleteTexture(this.tex);
      this.tex = null;
    }
  }

  private async load(src: IImageCanvasSrc) {
    if (!src || !src.path) {
      this.clearImage();
      return;
    }

    if (src.type === "img") {
      await this.loadImage(src);
    } else {
      await this.loadCrunchedImage(src);
    }
  }
}
