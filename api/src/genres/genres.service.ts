@Injectable()
export class GenreService {
  constructor(private prisma: PrismaService) {}
 
  findAll(name?: string, search?: string) {
    return this.prisma.book.findMany({
      where: {
        ...(name && { name: String(name) }),
        ...(search && {
          OR: [
            { book: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: { id: true },
    });
  }
 
  create(dto: CreateGenreDto) {
    return this.prisma.book.create({ data: dto });
  }
}