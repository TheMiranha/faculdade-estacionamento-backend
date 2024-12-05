import { prisma } from "..";

async function createPlate({
  userId,
  plate,
}: {
  userId: string;
  plate: string;
}) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    return { success: false, message: "Usuário não encontrado" };
  }

  const plateExists = await prisma.plate.findFirst({ where: { plate } });
  if (plateExists) {
    return { success: false, message: "Placa já cadastrada" };
  }

  const createdPlate = await prisma.plate.create({
    data: {
      plate,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });

  if (!createdPlate) {
    return { success: false, message: "Erro ao cadastrar placa" };
  }

  return { success: true, plate: createdPlate };
}

export const plateService = {
  createPlate,
};
