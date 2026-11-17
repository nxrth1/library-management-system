@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}
 
  findAll(genreId?: string, search?: string) {
    return this.prisma.book.findMany({
      where: {
        ...(genreId && { genreId: Number(genreId) }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { author: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: { genre: true },
    });
  }
 
  create(dto: CreateBookDto) {
    return this.prisma.book.create({ data: dto });
  }
}