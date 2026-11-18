@Controller("genres")
export class GenresController {
  constructor(private genreService: GenreService) {}
 
  @Get()
  findAll(@Query("name") name?: string, @Query("search") search?: string) {
    return this.genreService.findAll(name, search);
  }
 
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.genreService.findOne(Number(id));
  }
 
  @Post()
  create(@Body() dto: CreateGenreDto) {
    return this.genreService.create(dto);
  }
}
