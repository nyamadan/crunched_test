import * as crunch from "../crunch/emscripten/crunch_lib.cpp";

export class Crunch {
  public static async initialize() {
    const module = await crunch.init();
    this.memory = module.memory;

    this.crnGetWidth = module.exports.crn_get_width;
    this.crbGetHeight = module.exports.crn_get_height;
    this.crnGetLevels = module.exports.crn_get_levels;
    this.crnGetUncompressedSize = module.exports.crn_get_uncompressed_size;
    this.crnDecompress = module.exports.crn_decompress;

    this.malloc = module.exports.malloc;
    this.free = module.exports.free;
  }

  private static crnGetWidth: (p: number, size: number) => number = null;
  private static crbGetHeight: (p: number, size: number) => number = null;
  private static crnGetLevels: (p: number, size: number) => number = null;
  private static crnGetUncompressedSize: (
    p: number,
    size: number,
    level: number,
  ) => number = null;
  private static crnDecompress: (
    p: number,
    srcSize: number,
    dst: number,
    dstSize: number,
    firstLevel: number,
    levelCount: number,
  ) => number = null;
  private static malloc: (size: number) => number = null;
  private static free: (p: number) => void = null;

  private static memory: ArrayBuffer = null;
  private width: number = 0;
  private height: number = 0;
  private offset: number = 0;

  private buffers: Uint8Array[] = [];

  public getWidth() {
    return this.width;
  }

  public getHeight() {
    return this.height;
  }

  public getLevel() {
    return this.buffers.length;
  }

  public getBuffer(level: number) {
    return this.buffers[level];
  }

  public getBuffers() {
    return this.buffers;
  }

  public async load(path: string) {
    this.unload();

    const response = await fetch(path);
    const bytes = await response.arrayBuffer();

    const srcSize = bytes.byteLength;
    const srcOffset = Crunch.malloc(srcSize);

    new Uint8Array(Crunch.memory, srcOffset, srcSize).set(
      new Uint8Array(bytes),
    );

    const width = Crunch.crnGetWidth(srcOffset, srcSize);
    const height = Crunch.crbGetHeight(srcOffset, srcSize);

    const level = Crunch.crnGetLevels(srcOffset, srcSize);

    let dstSize = 0;
    const dstLevelOffsets: number[] = new Array(level);
    for (let i = 0; i < level; i++) {
      const levelSize = Crunch.crnGetUncompressedSize(srcOffset, srcSize, i);
      dstSize += levelSize;
      dstLevelOffsets[i] = dstSize;
    }

    const dstOffset = Crunch.malloc(dstSize);

    Crunch.crnDecompress(srcOffset, srcSize, dstOffset, dstSize, 0, level);

    const buffers: Uint8Array[] = new Array(level);
    buffers[0] = new Uint8Array(Crunch.memory, dstOffset, dstLevelOffsets[0]);
    for (let i = 1; i < level; i++) {
      buffers[i] = new Uint8Array(
        Crunch.memory,
        dstOffset + dstLevelOffsets[i - 1],
        dstLevelOffsets[i] - dstLevelOffsets[i - 1],
      );
    }

    this.width = width;
    this.height = height;
    this.offset = dstOffset;
    this.buffers = buffers;

    Crunch.free(srcOffset);
  }

  public unload() {
    this.width = 0;
    this.height = 0;
    this.buffers = [];

    if (this.offset !== 0) {
      Crunch.free(this.offset);
      this.offset = 0;
    }
  }
}
