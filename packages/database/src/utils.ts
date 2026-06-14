import { Prisma } from '../generated/prisma' ;

export const getPrismaErrMsg = (err: unknown, customMsg?: string): string => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2011" || err.code === "P2012") {
      return "Database error: Provided value for a field is not valid.";
    }

    switch (err.code) {
      case "P2002":
        return "Database error: A resource with this identifier already exists.";
      case "P2003":
        return "Database error: Missing required input data";
      case "P2000":
        return "Database error: Constraint violation";
    }
  }

  return customMsg ?? "An unexpected error occured. Please try again shortly";
};