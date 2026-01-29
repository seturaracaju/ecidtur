
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  // adicione outras variáveis de ambiente aqui, se necessário
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
