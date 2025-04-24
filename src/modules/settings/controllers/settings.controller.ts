import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SettingsService } from '../settings.service';
import {
  UpdateSettingsDto,
  UpdateNotificationsDto,
  UpdateSecurityDto,
} from '../dto/settings.dto';
import { Settings } from '../schemas/settings.schema';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Settings')
@Controller('api/settings')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @Get()
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({
    status: 200,
    description: 'Return system settings',
    type: Settings,
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getSettings(): Promise<Settings> {
    const settings = await this.settingsService.getSettings();
    return settings;
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get public settings' })
  @ApiResponse({
    status: 200,
    description: 'Return public settings',
    type: Settings,
  })
  async getPublicSettings(): Promise<Settings> {
    const settings = await this.settingsService.getSettings();
    return settings;
  }

  @Put()
  @ApiOperation({ summary: 'Update system settings' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: Settings,
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateSettings(
    @Body(ValidationPipe) updateSettingsDto: UpdateSettingsDto,
  ): Promise<Settings> {
    const settings = await this.settingsService.updateSettings(updateSettingsDto);
    return settings;
  }

  @Put('notifications')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({
    status: 200,
    description: 'Notification settings updated successfully',
    type: Settings,
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateNotifications(
    @Body(ValidationPipe) updateNotificationsDto: UpdateNotificationsDto,
  ): Promise<Settings> {
    const settings = await this.settingsService.updateNotifications(updateNotificationsDto);
    return settings;
  }

  @Put('security')
  @ApiOperation({ summary: 'Update security settings' })
  @ApiResponse({
    status: 200,
    description: 'Security settings updated successfully',
    type: Settings,
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateSecurity(
    @Body(ValidationPipe) updateSecurityDto: UpdateSecurityDto,
  ): Promise<Settings> {
    const settings = await this.settingsService.updateSecurity(updateSecurityDto);
    return settings;
  }
}
