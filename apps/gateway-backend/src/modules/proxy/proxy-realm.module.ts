import { Global, Module } from '@nestjs/common';
import { ProxyRealmService } from './proxy-realm.service';

@Global()
@Module({
  providers: [ProxyRealmService],
  exports: [ProxyRealmService],
})
export class ProxyRealmModule {}
