import { Module } from '@nestjs/common'
import { WinService } from './win.service'
import { WinController } from './win.controller'

@Module({
  providers: [WinService],
  controllers: [WinController],
  exports: [WinService],
})
export class WinModule {}
