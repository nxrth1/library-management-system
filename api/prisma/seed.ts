import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const catalog = [
  {
    name: "Fantasy",
    books: [
      ["The Hobbit", "J.R.R. Tolkien", "9780547928227", 1937],
      ["A Wizard of Earthsea", "Ursula K. Le Guin", "9780547773742", 1968],
      ["The Name of the Wind", "Patrick Rothfuss", "9780756404741", 2007],
      ["The Last Unicorn", "Peter S. Beagle", "9780451450524", 1968],
    ],
  },
  {
    name: "Science Fiction",
    books: [
      ["Dune", "Frank Herbert", "9780441172719", 1965],
      ["Kindred", "Octavia E. Butler", "9780807083697", 1979],
      ["The Left Hand of Darkness", "Ursula K. Le Guin", "9780441478125", 1969],
      ["The Martian", "Andy Weir", "9780553418026", 2011],
    ],
  },
  {
    name: "Mystery",
    books: [
      ["The Hound of the Baskervilles", "Arthur Conan Doyle", "9780486474915", 1902],
      ["Murder on the Orient Express", "Agatha Christie", "9780062693662", 1934],
      ["The Big Sleep", "Raymond Chandler", "9780394758282", 1939],
      ["The No. 1 Ladies' Detective Agency", "Alexander McCall Smith", "9781400034772", 1998],
    ],
  },
  {
    name: "Historical Fiction",
    books: [
      ["The Book Thief", "Markus Zusak", "9780375842207", 2005],
      ["The Pillars of the Earth", "Ken Follett", "9780451166890", 1989],
      ["The Nightingale", "Kristin Hannah", "9780312577223", 2015],
      ["A Tale of Two Cities", "Charles Dickens", "9780141439600", 1859],
    ],
  },
] as const;

async function main(): Promise<void> {
  for (const genreData of catalog) {
    const genre = await prisma.genre.upsert({
      where: { name: genreData.name },
      update: {},
      create: { name: genreData.name },
    });

    for (const [title, author, isbn, publishedAt] of genreData.books) {
      await prisma.book.upsert({
        where: { isbn },
        update: {
          title,
          author,
          publishedAt,
          genreId: genre.id,
        },
        create: {
          title,
          author,
          isbn,
          publishedAt,
          genreId: genre.id,
        },
      });
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the library catalog:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
