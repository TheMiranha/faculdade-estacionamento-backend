declare module "bun" {
  interface Env {
    JWT_SECRET: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      email: string;
    }
  }
}
