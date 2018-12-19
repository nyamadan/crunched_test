declare interface WEBGL_compressed_texture_etcPrototype
{
  COMPRESSED_R11_EAC: number;
  COMPRESSED_RG11_EAC: number;
  COMPRESSED_RGB8_ETC2: number;
  COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: number;
  COMPRESSED_RGBA8_ETC2_EAC: number;
  COMPRESSED_SIGNED_R11_EAC: number;
  COMPRESSED_SIGNED_RG11_EAC: number;
  COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: number;
  COMPRESSED_SRGB8_ETC2: number;
  COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: number;
}

declare module "*.cpp" {
  type module = { exports: any, memory: ArrayBuffer };

  namespace Wasm {
    function init(): Promise<module>;
    function init(adjustEnv: (obj: any) => any): Promise<module>;
  }

  export = Wasm;
}
