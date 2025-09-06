import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Categories') // Agrupa en la sección "Categories" en Swagger
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías' })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías obtenida correctamente',
    type: [Category],
  })
  async findAllCategories(): Promise<Category[]> {
    return this.categoriesService.findAllCategories();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Obtener una categoría por su nombre' })
  @ApiParam({
    name: 'name',
    type: String,
    description: 'Nombre de la categoría a buscar',
    example: 'Guitarras',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró una categoría con ese nombre',
  })
  async findOne(@Param('name') name: string): Promise<Category> {
    return this.categoriesService.findCategoryByName(name);
  }
}


// cambios:
// antes:
// @Get(':id')
// async findOne(@Param('name') name: string): Promise<Category> {
//   return this.categoriesService.findCategoryByName(name);
// }
// despues: (con el cambio de id a name ya que se buscara por nombre/)
// @Get(':name')
// async findOne(@Param('name') name: string): Promise<Category> {
//   return this.categoriesService.findCategoryByName(name);
// }



