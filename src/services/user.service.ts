import bcrypt from "bcrypt";
import { prisma } from "..";
import jwt from "jsonwebtoken";

async function createAccount({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. verificar se já tem usuário com o email
  const userByEmail = await prisma.user.findFirst({ where: { email } });

  if (userByEmail) {
    return { success: false, message: "Email já cadastrado" };
  }

  const createdUser = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  if (!createdUser) {
    return { success: false, message: "Erro ao cadastrar usuário" };
  }

  const accessToken = jwt.sign({ id: createdUser.id }, process.env.JWT_SECRET);

  return { success: true, accessToken };
}

async function authenticate({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const userByEmail = await prisma.user.findFirst({ where: { email } });

  if (!userByEmail) {
    return { success: false, message: "Credenciais incorretas" };
  }

  const passwordMatch = await bcrypt.compare(password, userByEmail.password);
  if (!passwordMatch) {
    return { success: false, message: "Credenciais incorretas" };
  }

  const accessToken = jwt.sign({ id: userByEmail.id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  return { success: true, accessToken };
}

async function getAccountByJWT(token: string) {
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    const user = await prisma.user.findFirst({
      where: { id },
      include: { plates: true },
    });

    if (!user) {
      return { success: false, message: "Usuário não encontrado" };
    }

    // @ts-expect-error
    delete user.password;

    return { success: true, user };
  } catch (error) {
    return { success: false, message: "Token inválido" };
  }
}

export const userService = {
  createAccount,
  authenticate,
  getAccountByJWT,
};
