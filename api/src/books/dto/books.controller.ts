@Controller("books")
export class BooksController {
  constructor(private booksService: BooksService) {}
 
  @Get()
  findAll(@Query("genreId") genreId?: string, @Query("search") search?: string) {
    return this.booksService.findAll(genreId, search);
  }
 
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.booksService.findOne(Number(id));
  }
 
  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }
}
 