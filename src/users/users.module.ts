import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { FixesModule } from '../fixes/fixes.module';
import { UserVehiclesModule } from '../user-vehicles/user-vehicles.module';
import { User } from './entities/user.entity';
import { UserStatsService } from './user-stats.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ActivityLogModule,
    FixesModule,
    UserVehiclesModule,
  ],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService, UserStatsService],
  exports: [UsersService],
})
export class UsersModule {}
