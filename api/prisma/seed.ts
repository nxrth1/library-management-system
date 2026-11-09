import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const catalog = [
  {
    name: "Fantasy",
    slug: "fantasy",
    books: [
      ["The Hobbit", "J.R.R. Tolkien", "9780547928227", "A fantasy adventure about a hobbit who joins a quest.", "https://example.com/covers/hobbit.jpg", 3, 3],
      ["A Wizard of Earthsea", "Ursula K. Le Guin", "9780547773742", "A young wizard learns about balance, power, and identity.", "https://example.com/covers/earthsea.jpg", 2, 2],
      ["The Name of the Wind", "Patrick Rothfuss", "9780756404741", "A gifted musician recounts his life and the magic he has known.", "https://example.com/covers/name-of-the-wind.jpg", 3, 2],
      ["The Last Unicorn", "Peter S. Beagle", "9780451450524", "A unicorn searches for her kind in a world of fading wonder.", "https://example.com/covers/last-unicorn.jpg", 2, 2],
    ],
  },
  {
    name: "Science Fiction",
    slug: "science-fiction",
    books: [
      ["Dune", "Frank Herbert", "9780441172719", "A noble family struggles for control of a desert planet and its spice.", "https://example.com/covers/dune.jpg", 4, 2],
      ["Kindred", "Octavia E. Butler", "9780807083697", "A modern Black woman is transported back to the antebellum South.", "https://example.com/covers/kindred.jpg", 3, 3],
      ["The Left Hand of Darkness", "Ursula K. Le Guin", "9780441478125", "An envoy seeks to understand a planet whose people change gender.", "https://example.com/covers/left-hand-of-darkness.jpg", 2, 2],
      ["The Martian", "Andy Weir", "9780553418026", "A stranded astronaut uses ingenuity to survive on Mars.", "https://example.com/covers/the-martian.jpg", 3, 3],
    ],
  },
  {
    name: "Mystery",
    slug: "mystery",
    books: [
      ["The Hound of the Baskervilles", "Arthur Conan Doyle", "9780486474915", "A detective investigates a mysterious hound and a centuries-old family curse.", "https://example.com/covers/hound-baskervilles.jpg", 2, 1],
      ["Murder on the Orient Express", "Agatha Christie", "9780062693662", "Detective Poirot solves a murder aboard a snowbound train.", "https://example.com/covers/orient-express.jpg", 2, 2],
      ["The Big Sleep", "Raymond Chandler", "9780394758282", "A private investigator is drawn into a web of blackmail and violence.", "https://example.com/covers/big-sleep.jpg", 3, 2],
      ["The No. 1 Ladies' Detective Agency", "Alexander McCall Smith", "9781400034772", "A witty detective solves quietly significant cases in Botswana.", "https://example.com/covers/no-1-ladies.jpg", 2, 2],
    ],
  },
  {
    name: "Biography",
    slug: "biography",
    books: [
      ["Educated", "Tara Westover", "9780399590504", "A memoir about growing up in a survivalist family and seeking education.", "https://example.com/covers/educated.jpg", 3, 3],
      ["Becoming", "Michelle Obama", "9781524763138", "A memoir tracing identity, leadership, and public life.", "https://example.com/covers/becoming.jpg", 2, 1],
      ["Long Walk to Freedom", "Nelson Mandela", "9780316548182", "The memoir of South Africa's anti-apartheid leader.", "https://example.com/covers/long-walk-to-freedom.jpg", 2, 2],
      ["The Diary of a Young Girl", "Anne Frank", "9780553577129", "A young Jewish girl records her thoughts while in hiding during World War II.", "https://example.com/covers/anne-frank.jpg", 2, 2],
    ],
  },
] as const;

async function main(): Promise<void> {
  for (const genreData of catalog) {
    const genre = await prisma.genre.upsert({
      where: { name: genreData.name },
      update: { slug: genreData.slug },
      create: {
        name: genreData.name,
        slug: genreData.slug,
      },
    });

    for (const [title, author, isbn, description, coverImage, totalCopies, availableCopies] of genreData.books) {
      await prisma.book.upsert({
        where: { isbn },
        update: {
          title,
          author,
          description,
          coverImage,
          totalCopies,
          availableCopies,
          genreId: genre.id,
        },
        create: {
          title,
          author,
          isbn,
          description,
          coverImage,
          totalCopies,
          availableCopies,
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
