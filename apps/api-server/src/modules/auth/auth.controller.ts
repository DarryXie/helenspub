import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('app/auth')
export class AppAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto, ['admin', 'staff']);
  }

  @Roles('admin', 'staff')
  @Get('me')
  me(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.getProfile(currentUser);
  }

  @Roles('admin', 'staff')
  @Post('logout')
  logout() {
    return this.authService.logout();
  }
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto, ['admin']);
  }

  @Roles('admin')
  @Get('me')
  me(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.getProfile(currentUser);
  }

  @Roles('admin')
  @Post('logout')
  logout() {
    return this.authService.logout();
  }
}
