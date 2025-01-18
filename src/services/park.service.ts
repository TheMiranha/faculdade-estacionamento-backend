import { prisma } from "..";

async function getAllParks() {
  const parks = await prisma.park.findMany({});

  const now = new Date();
  const parkings = await getAllParkings().then((res) =>
    res.parkings.filter(
      (p) => new Date(p.startedAt) < now && now < new Date(p.endedAt)
    )
  );

  const parksWithParking = parks.map((p) => {
    const park = { ...p, parking: null };
    const parking = parkings.find((parking) => parking.parkId === p.id);
    if (parking) {
      // @ts-expect-error
      park.parking = parking;
    }
    return park;
  });

  return { success: true, parks: parksWithParking };
}

async function getAllParkings() {
  const parkings = await prisma.parking.findMany({
    include: {
      plate: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return { success: true, parkings };
}

async function buyPark({
  parkId,
  timeInSeconds,
  plateId,
}: {
  parkId: string;
  timeInSeconds: number;
  plateId: string;
}) {
  const plate = await prisma.plate.findUnique({
    where: {
      plate: plateId,
    },
  });

  if (!plate) {
    return { success: false, message: "Placa não cadastrada" };
  }

  const park = await prisma.park.findUnique({
    where: {
      id: parkId,
    },
  });

  if (!park) {
    return { success: false, message: "Estacionamento não encontrado" };
  }

  const parkings = await getAllParkings().then((res) =>
    res.parkings.filter((p) => p.parkId === parkId)
  );
  // verificar se o a data atual não está entre startedAt e endedAt da vaga
  const now = new Date();
  const parking = parkings.filter(
    (p) => new Date(p.startedAt) < now && now < new Date(p.endedAt)
  );
  if (parking.length) {
    return { success: false, message: "Estacionamento já ocupado" };
  }

  const endedAt = new Date();
  endedAt.setSeconds(endedAt.getSeconds() + timeInSeconds);
  const createdParking = await prisma.parking.create({
    data: {
      startedAt: new Date(),
      endedAt,
      park: {
        connect: {
          id: parkId,
        },
      },
      plate: {
        connect: {
          plate: plateId,
        },
      },
    },
  });

  return { success: true, parking: createdParking };
}

export const parkService = {
  getAllParks,
  getAllParkings,
  buyPark,
};
