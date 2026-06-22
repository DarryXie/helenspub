import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CocktailQueryDto } from './dto/cocktail-query.dto';
import { CreateCocktailDto } from './dto/create-cocktail.dto';
import { UpdateCocktailDto } from './dto/update-cocktail.dto';
import { CocktailsService } from './cocktails.service';

@Controller('public/cocktails')
export class PublicCocktailsController {
  constructor(private readonly cocktailsService: CocktailsService) {}

  @Public()
  @Get()
  findAll(@Query() query: CocktailQueryDto) {
    return this.cocktailsService.findPublic(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cocktailsService.findPublicById(id);
  }
}

@Controller('app/cocktails')
@Roles('admin', 'staff')
export class AppCocktailsController {
  constructor(private readonly cocktailsService: CocktailsService) {}

  @Get()
  findAll(@Query() query: CocktailQueryDto) {
    return this.cocktailsService.findApp(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cocktailsService.findAnyById(id);
  }
}

@Controller('admin/cocktails')
@Roles('admin')
export class AdminCocktailsController {
  constructor(private readonly cocktailsService: CocktailsService) {}

  @Get()
  findAll(@Query() query: CocktailQueryDto) {
    return this.cocktailsService.findAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cocktailsService.findAnyById(id);
  }

  @Post()
  create(@Body() dto: CreateCocktailDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.cocktailsService.create(dto, currentUser);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCocktailDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.cocktailsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cocktailsService.remove(id);
  }
}
